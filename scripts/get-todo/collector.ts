import type { GitHubClient, GitHubRepository, GitTreeEntry } from "./github-client.ts";
import { visibilityOf } from "./github-client.ts";
import { parseTodoFile } from "./todo-parser.ts";
import type { RepositoryScan, TodoScanArtifact, TodoMatch, ParseTodoInput } from "./types.ts";

export const DEFAULT_EXTENSIONS = [
	".md",
	".mdx",
	".txt",
	".ts",
	".tsx",
	".js",
	".jsx",
	".vue",
	".css",
	".scss",
	".less",
	".json",
	".yaml",
	".yml",
	".html",
	".xml",
	".py",
	".go",
	".java",
	".kt",
	".rs",
	".rb",
	".php",
	".c",
	".cpp",
	".h",
	".sh",
	".ps1",
	".sql",
];

const IGNORED_DIRECTORY = /(^|\/)(?:node_modules|dist|build|\.git)(?:\/|$)/;
const IGNORED_FILE = /(?:^|\/)(?:package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/;

export interface CollectorOptions {
	owner: string;
	client: GitHubClient;
	authenticated: boolean;
	isActions: boolean;
	extensions?: string[];
	maxFileBytes?: number;
	includeForks?: boolean;
	now?: Date;
}

function extensionOf(path: string): string {
	const dot = path.lastIndexOf(".");
	return dot >= 0 ? path.slice(dot).toLowerCase() : "";
}

function isCandidateFile(entry: GitTreeEntry, extensions: Set<string>, maxFileBytes: number): boolean {
	return (
		entry.type === "blob" &&
		!IGNORED_DIRECTORY.test(entry.path) &&
		!IGNORED_FILE.test(entry.path) &&
		extensions.has(extensionOf(entry.path)) &&
		(entry.size ?? 0) <= maxFileBytes
	);
}

function languageFor(path: string, repository: GitHubRepository): string | null {
	if (repository.language) return repository.language;
	const languages: Record<string, string> = {
		".md": "Markdown",
		".mdx": "MDX",
		".ts": "TypeScript",
		".tsx": "TypeScript",
		".js": "JavaScript",
		".jsx": "JavaScript",
		".vue": "Vue",
		".scss": "SCSS",
		".css": "CSS",
		".json": "JSON",
		".yaml": "YAML",
		".yml": "YAML",
	};
	return languages[extensionOf(path)] ?? null;
}

async function flattenTree(
	client: GitHubClient,
	fullName: string,
	response: { tree: GitTreeEntry[]; truncated: boolean; sha: string },
): Promise<GitTreeEntry[]> {
	if (!response.truncated) return response.tree;
	const entries: GitTreeEntry[] = [];
	const visit = async (tree: { tree: GitTreeEntry[] }): Promise<void> => {
		for (const entry of tree.tree) {
			if (entry.type === "tree") await visit(await client.getTree(fullName, entry.sha));
			else entries.push(entry);
		}
	};
	await visit(await client.getTree(fullName, response.sha));
	return entries;
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
	const results: R[] = [];
	let cursor = 0;
	const run = async (): Promise<void> => {
		while (cursor < items.length) {
			const index = cursor;
			cursor += 1;
			results[index] = await worker(items[index]);
		}
	};
	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
	return results;
}

function repositoryError(
	repository: GitHubRepository,
	status: RepositoryScan["status"],
	error: string,
): RepositoryScan {
	return {
		fullName: repository.full_name,
		visibility: visibilityOf(repository),
		selectedBranch: null,
		status,
		todoCount: 0,
		errors: [error],
	};
}

/**
 * 采集指定用户仓库的 TODO 并生成 JSON contract。
 * @example
 * collectTodos(options);
 */
export async function collectTodos(options: CollectorOptions): Promise<TodoScanArtifact> {
	if (options.isActions && !options.authenticated)
		throw new Error("GITHUB_TOKEN or GITHUB_PAT_TOKEN is required in GitHub Actions");
	const maxFileBytes = options.maxFileBytes ?? 1024 * 1024;
	const extensions = new Set(
		(options.extensions ?? DEFAULT_EXTENSIONS).map((extension) =>
			extension.startsWith(".") ? extension.toLowerCase() : `.${extension.toLowerCase()}`,
		),
	);
	const discovered = await options.client.listOwnedRepositories(options.owner);
	const repositories: RepositoryScan[] = [];
	const todos: TodoMatch[] = [];
	let skippedFileCount = 0;

	for (const repository of discovered.filter(
		(item) => (options.authenticated || !item.private) && (options.includeForks || !item.fork),
	)) {
		try {
			const branch = await options.client.selectBranch(repository.full_name);
			if (!branch) {
				repositories.push(
					repositoryError(repository, "branch_unavailable", "No dev, main, or master branch is available"),
				);
				continue;
			}
			const treeResponse = await options.client.getRecursiveTree(repository.full_name, branch);
			const tree = await flattenTree(options.client, repository.full_name, treeResponse);
			const scan: RepositoryScan = {
				fullName: repository.full_name,
				visibility: visibilityOf(repository),
				selectedBranch: branch,
				status: "scanned",
				todoCount: 0,
				errors: [],
			};
			const candidateEntries = tree.filter((entry) => entry.type === "blob");
			const fileResults = await mapWithConcurrency(candidateEntries, 4, async (entry) => {
				if (!isCandidateFile(entry, extensions, maxFileBytes))
					return { matches: [], skipped: Boolean(entry.size && entry.size > maxFileBytes) };
				const blob = await options.client.getBlobText(repository.full_name, entry.sha);
				if (blob.content.includes("\u0000")) return { matches: [], skipped: true };
				const path = entry.path;
				const input: ParseTodoInput = {
					path,
					content: blob.content,
					sha: blob.sha,
					branch,
					repo: repository.name,
					visibility: visibilityOf(repository),
					language: languageFor(path, repository),
					htmlUrl: `https://github.com/${repository.full_name}/blob/${encodeURIComponent(branch)}/${path}`,
				};
				return { matches: parseTodoFile(input).matches, skipped: false };
			});
			for (const result of fileResults) {
				todos.push(...result.matches);
				scan.todoCount += result.matches.length;
				if (result.skipped) skippedFileCount += 1;
			}
			repositories.push(scan);
		} catch (error) {
			const status = (error as { status?: number })?.status;
			repositories.push(
				repositoryError(
					repository,
					status === 401 || status === 403 ? "unauthorized" : "failed",
					status === 401 || status === 403 ? "Repository access denied" : "Repository scan failed",
				),
			);
		}
	}

	repositories.sort((left, right) => left.fullName.localeCompare(right.fullName));
	todos.sort(
		(left, right) =>
			left.repo.localeCompare(right.repo) ||
			left.path.localeCompare(right.path) ||
			left.line - right.line ||
			left.id.localeCompare(right.id),
	);
	const errors = repositories.flatMap((repository) =>
		repository.errors.map((error) => `${repository.fullName}: ${error}`),
	);
	const completeness =
		!options.authenticated ||
		errors.length > 0 ||
		repositories.length !== discovered.filter((item) => options.authenticated || !item.private).length
			? "partial"
			: "complete";
	const generatedAt = (options.now ?? new Date()).toISOString();
	return {
		schemaVersion: 1,
		generatedAt,
		scan: {
			owner: options.owner,
			repositoryScope: "owner",
			branchStrategy: ["dev", "main", "master"],
			authMode: options.authenticated ? "authenticated" : "public-only",
			completeness,
			extensions: [...extensions].sort(),
			maxFileBytes,
		},
		summary: {
			repositoryCount: discovered.length,
			scannedRepositoryCount: repositories.filter((repository) => repository.status === "scanned").length,
			todoCount: todos.length,
			unresolvedEmptyTodoCount: todos.filter((todo) => todo.kind === "unresolved_empty_todo").length,
			skippedFileCount,
			errorCount: errors.length,
		},
		repositories,
		todos,
		errors,
	};
}
