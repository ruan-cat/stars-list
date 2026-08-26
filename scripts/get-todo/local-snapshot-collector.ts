import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

import { filterScannableRepositories } from "./manifest.ts";
import type { SnapshotRequest, SnapshotResult } from "./degit-client.ts";
import { parseTodoFile } from "./todo-parser.ts";
import type { ManifestRepository, RepositoryManifest, RepositoryScan, TodoMatch, TodoScanArtifact } from "./types.ts";

const DEFAULT_EXTENSIONS = [
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
const IGNORED_DIRECTORY = /(^|[\\/])(?:node_modules|dist|build|\.git)(?:[\\/]|$)/;
const IGNORED_FILE = /(?:^|[\\/])(?:package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/;

export interface SnapshotCollectorOptions {
	manifest: RepositoryManifest;
	root: string;
	resolveBranch: (repository: ManifestRepository) => Promise<{ branch: string; commitSha: string } | null>;
	downloadSnapshot: (input: SnapshotRequest) => Promise<SnapshotResult>;
	cleanup?: (root: string) => Promise<void>;
	authenticated: boolean;
	token?: string;
	includeForks?: boolean;
	extensions?: string[];
	maxFileBytes?: number;
	now?: Date;
}

async function listFiles(root: string, current = root): Promise<string[]> {
	const files: string[] = [];
	for (const entry of await readdir(current, { withFileTypes: true })) {
		const path = join(current, entry.name);
		if (entry.isDirectory()) {
			if (!IGNORED_DIRECTORY.test(path)) files.push(...(await listFiles(root, path)));
		} else {
			files.push(path);
		}
	}
	return files;
}

function extensionOf(path: string): string {
	const index = path.lastIndexOf(".");
	return index >= 0 ? path.slice(index).toLowerCase() : "";
}

async function scanRepository(
	repository: ManifestRepository,
	options: SnapshotCollectorOptions,
	extensions: Set<string>,
	maxFileBytes: number,
): Promise<{ repository: RepositoryScan; todos: TodoMatch[]; skipped: number }> {
	const branchInfo = await options.resolveBranch(repository);
	if (!branchInfo)
		return {
			repository: {
				fullName: repository.fullName,
				visibility: repository.visibility,
				selectedBranch: null,
				status: "branch_unavailable",
				todoCount: 0,
				errors: [],
				fork: repository.fork,
				archived: repository.archived,
			},
			todos: [],
			skipped: 0,
		};
	const destination = join(options.root, repository.fullName.replace("/", "__"));
	const snapshot = await options.downloadSnapshot({
		fullName: repository.fullName,
		branch: branchInfo.branch,
		commitSha: branchInfo.commitSha,
		destination,
		token: repository.visibility === "private" ? options.token : undefined,
	});
	const todos: TodoMatch[] = [];
	let skipped = 0;
	for (const file of await listFiles(destination)) {
		const relativePath = file.slice(destination.length + 1).replaceAll("\\", "/");
		if (IGNORED_FILE.test(relativePath) || !extensions.has(extensionOf(relativePath))) continue;
		const metadata = await stat(file);
		if (metadata.size > maxFileBytes) {
			skipped += 1;
			continue;
		}
		const content = await readFile(file, "utf8");
		if (content.includes("\u0000")) {
			skipped += 1;
			continue;
		}
		const parsed = parseTodoFile({
			path: relativePath,
			content,
			sha: branchInfo.commitSha,
			branch: branchInfo.branch,
			repo: repository.fullName.split("/").at(-1) ?? repository.fullName,
			visibility: repository.visibility,
			language: null,
			htmlUrl: `https://github.com/${repository.fullName}/blob/${branchInfo.branch}/${relativePath}`,
		});
		for (const todo of parsed.matches)
			todos.push({
				...todo,
				source: snapshot.source,
				commitSha: snapshot.commitSha,
				manifestStale: options.manifest.manifestStale,
				cacheStatus: snapshot.cacheStatus,
				fork: repository.fork,
			});
	}
	return {
		repository: {
			fullName: repository.fullName,
			visibility: repository.visibility,
			selectedBranch: branchInfo.branch,
			status: "scanned",
			todoCount: todos.length,
			errors: [],
			fork: repository.fork,
			archived: repository.archived,
			commitSha: snapshot.commitSha,
			source: snapshot.source,
			cacheStatus: snapshot.cacheStatus,
		},
		todos,
		skipped,
	};
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
	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
	return results;
}

/** 通过 manifest 和 degit 快照扫描 TODO。 */
export async function collectFromManifest(options: SnapshotCollectorOptions): Promise<TodoScanArtifact> {
	const extensions = new Set(
		(options.extensions ?? DEFAULT_EXTENSIONS).map((extension) =>
			extension.startsWith(".") ? extension.toLowerCase() : `.${extension.toLowerCase()}`,
		),
	);
	const maxFileBytes = options.maxFileBytes ?? 1024 * 1024;
	const selected = filterScannableRepositories(options.manifest, options.includeForks).filter(
		(repository) => options.authenticated || repository.visibility === "public",
	);
	const skippedForks = options.manifest.repositories
		.filter((repository) => !options.includeForks && repository.fork)
		.map((repository) => ({
			fullName: repository.fullName,
			visibility: repository.visibility,
			selectedBranch: null,
			status: "skipped" as const,
			todoCount: 0,
			errors: [],
			fork: true,
			archived: repository.archived,
			skipReason: "fork" as const,
		}));
	const skippedPrivate = options.manifest.repositories
		.filter((repository) => !options.authenticated && !repository.fork && repository.visibility === "private")
		.map((repository) => ({
			fullName: repository.fullName,
			visibility: repository.visibility,
			selectedBranch: null,
			status: "unauthorized" as const,
			todoCount: 0,
			errors: ["Private repository requires credentials"],
			fork: repository.fork,
			archived: repository.archived,
		}));
	try {
		const results = await mapWithConcurrency(selected, 4, async (repository) => {
			try {
				return await scanRepository(repository, options, extensions, maxFileBytes);
			} catch (error) {
				return {
					repository: {
						fullName: repository.fullName,
						visibility: repository.visibility,
						selectedBranch: null,
						status: "failed" as const,
						todoCount: 0,
						errors: [error instanceof Error ? error.message : "Repository scan failed"],
						fork: repository.fork,
						archived: repository.archived,
					},
					todos: [],
					skipped: 0,
				};
			}
		});
		const repositories = [...skippedForks, ...skippedPrivate, ...results.map((result) => result.repository)].sort(
			(left, right) => left.fullName.localeCompare(right.fullName),
		);
		const todos = results
			.flatMap((result) => result.todos)
			.sort(
				(left, right) =>
					left.repo.localeCompare(right.repo) || left.path.localeCompare(right.path) || left.line - right.line,
			);
		const errors = repositories.flatMap((repository) =>
			repository.errors.map((error) => `${repository.fullName}: ${error}`),
		);
		return {
			schemaVersion: 1,
			generatedAt: (options.now ?? new Date()).toISOString(),
			scan: {
				owner: options.manifest.owner,
				repositoryScope: "owner",
				branchStrategy: ["dev", "main", "master"],
				authMode: options.authenticated ? "authenticated" : "public-only",
				completeness: options.manifest.manifestStale || errors.length > 0 ? "partial" : "complete",
				extensions: [...extensions].sort(),
				maxFileBytes,
				transport: "degit",
				manifestStale: options.manifest.manifestStale,
			},
			summary: {
				repositoryCount: options.manifest.repositories.length,
				scannedRepositoryCount: results.filter((result) => result.repository.status === "scanned").length,
				todoCount: todos.length,
				unresolvedEmptyTodoCount: todos.filter((todo) => todo.kind === "unresolved_empty_todo").length,
				skippedFileCount: results.reduce((total, result) => total + result.skipped, 0),
				errorCount: errors.length,
			},
			repositories,
			todos,
			errors,
		};
	} finally {
		if (options.cleanup) await options.cleanup(options.root);
	}
}
