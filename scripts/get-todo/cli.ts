import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { homedir } from "node:os";

import { defineCommand, runMain } from "citty";
import { consola } from "consola";
import { name as packageName, version as packageVersion } from "../../package.json";

import { collectTodos, DEFAULT_EXTENSIONS } from "./collector.ts";
import { createGitHubClient } from "./github-client.ts";
import { pruneCache, createRunDirectory, cleanupRunDirectory } from "./cache.ts";
import { downloadSnapshot } from "./degit-client.ts";
import { loadManifest, manifestAgeDays, writeManifest } from "./manifest.ts";
import { collectFromManifest } from "./local-snapshot-collector.ts";
import { parseTodoFile } from "./todo-parser.ts";
import type { ManifestRepository, RepositoryManifest, TodoScanArtifact } from "./types.ts";

const logger = consola.withTag(packageName);

export interface RunCliOptions {
	owner: string;
	output: string;
	fixture?: string;
	extensions?: string[];
	maxFileBytes?: number;
	transport?: "api" | "degit";
	manifest?: string;
	includeForks?: boolean;
	strict?: boolean;
	clearCache?: boolean;
	refreshManifest?: boolean;
}

async function listFiles(directory: string): Promise<string[]> {
	const entries = await readdir(directory, { withFileTypes: true });
	const files: string[] = [];
	for (const entry of entries) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) files.push(...(await listFiles(path)));
		else files.push(path);
	}
	return files;
}

async function collectFixture(options: RunCliOptions): Promise<TodoScanArtifact> {
	const root = resolve(options.fixture as string);
	const files = await listFiles(root);
	const todos = [];
	let skippedFileCount = 0;
	for (const file of files) {
		const path = relative(root, file).replaceAll("\\", "/");
		const content = await readFile(file, "utf8");
		const size = Buffer.byteLength(content, "utf8");
		if (
			!(options.extensions ?? DEFAULT_EXTENSIONS).some((extension) =>
				path.toLowerCase().endsWith(extension.toLowerCase()),
			) ||
			size > (options.maxFileBytes ?? 1024 * 1024)
		) {
			skippedFileCount += 1;
			continue;
		}
		const parsed = parseTodoFile({
			path,
			content,
			sha: "fixture-sha",
			branch: "dev",
			repo: "fixture",
			visibility: "public",
			language: null,
			htmlUrl: "https://example.invalid/fixture/blob/dev",
		});
		todos.push(...parsed.matches);
	}
	return {
		schemaVersion: 1,
		generatedAt: new Date().toISOString(),
		scan: {
			owner: options.owner,
			repositoryScope: "owner",
			branchStrategy: ["dev", "main", "master"],
			authMode: "public-only",
			completeness: "complete",
			extensions: options.extensions ?? DEFAULT_EXTENSIONS,
			maxFileBytes: options.maxFileBytes ?? 1024 * 1024,
		},
		summary: {
			repositoryCount: 1,
			scannedRepositoryCount: 1,
			todoCount: todos.length,
			unresolvedEmptyTodoCount: todos.filter((todo) => todo.kind === "unresolved_empty_todo").length,
			skippedFileCount,
			errorCount: 0,
		},
		repositories: [
			{
				fullName: `${options.owner}/fixture`,
				visibility: "public",
				selectedBranch: "dev",
				status: "scanned",
				todoCount: todos.length,
				errors: [],
			},
		],
		todos,
		errors: [],
	};
}

async function writeArtifact(path: string, artifact: TodoScanArtifact): Promise<void> {
	const absolute = resolve(path);
	await mkdir(dirname(absolute), { recursive: true });
	const temporary = `${absolute}.${process.pid}.tmp`;
	await writeFile(temporary, `${JSON.stringify(artifact, null, "\t")}\n`, "utf8");
	await rename(temporary, absolute);
}

/** 执行一次 GitHub TODO 扫描并写入 JSON。 */
export async function runCli(options: RunCliOptions): Promise<TodoScanArtifact> {
	logger.info(`${packageName} v${packageVersion} todo scan is running...`);
	const token = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT_TOKEN;
	const isActions = process.env.GITHUB_ACTIONS === "true";
	let artifact: TodoScanArtifact;
	if (options.fixture) {
		artifact = await collectFixture(options);
	} else if ((options.transport ?? "degit") === "api") {
		artifact = await collectTodos({
			owner: options.owner,
			client: createGitHubClient({ token }),
			authenticated: Boolean(token),
			isActions,
			extensions: options.extensions,
			maxFileBytes: options.maxFileBytes,
		});
	} else {
		const manifestPath = resolve(options.manifest ?? "scripts/get-todo/repositories.json");
		let manifest: RepositoryManifest;
		const shouldRefreshManifest = options.refreshManifest ?? isActions;
		if (shouldRefreshManifest) {
			try {
				const repositories = await createGitHubClient({ token }).listOwnedRepositories(options.owner);
				const entries: ManifestRepository[] = repositories.map((repository) => ({
					fullName: repository.full_name,
					visibility: repository.private ? "private" : "public",
					fork: Boolean(repository.fork),
					archived: Boolean(repository.archived),
					selectedBranch: null,
					lastKnownCommitSha: null,
					lastFetchedAt: null,
				}));
				manifest = {
					schemaVersion: 1,
					owner: options.owner,
					generatedAt: new Date().toISOString(),
					source: "github-api",
					manifestStale: false,
					repositories: entries,
				};
				await writeManifest(manifestPath, manifest);
			} catch (error) {
				manifest = await loadManifest(manifestPath);
				manifest = { ...manifest, manifestStale: true, source: "cache" };
				logger.warn(`Manifest refresh failed; using cached manifest (${manifestAgeDays(manifest)} days old)`);
				if (isActions && manifestAgeDays(manifest) > 30) throw new Error("Repository manifest is older than 30 days");
				if (error instanceof Error) logger.debug(error.message);
			}
		} else {
			manifest = await loadManifest(manifestPath);
		}
		const runDirectory = await createRunDirectory();
		const localAppData = process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local");
		const cacheRoots = [join(localAppData, "ruan-cat", "github-todo"), join(localAppData, "degit")];
		for (const cacheRoot of cacheRoots)
			await pruneCache({
				root: cacheRoot,
				maxBytes: options.clearCache ? 0 : undefined,
				maxAgeDays: options.clearCache ? 0 : undefined,
			}).catch(() => undefined);
		try {
			artifact = await collectFromManifest({
				manifest,
				root: runDirectory,
				authenticated: Boolean(token),
				token,
				includeForks: options.includeForks,
				resolveBranch: (repository) => resolveBranchForManifest(repository, token),
				downloadSnapshot: (input) => downloadSnapshot(input),
				cleanup: cleanupRunDirectory,
				extensions: options.extensions,
				maxFileBytes: options.maxFileBytes,
			});
		} catch (error) {
			await cleanupRunDirectory(runDirectory).catch(() => undefined);
			throw error;
		}
	}
	await writeArtifact(options.output, artifact);
	logger.info(
		`Scanned ${artifact.summary.scannedRepositoryCount}/${artifact.summary.repositoryCount} repositories; found ${artifact.summary.todoCount} TODOs`,
	);
	if ((options.strict || isActions) && artifact.scan.completeness !== "complete")
		throw new Error(
			`GitHub Actions scan is incomplete: ${artifact.errors.join("; ") || "one or more repositories were not scanned"}`,
		);
	return artifact;
}

async function resolveBranchForManifest(
	repository: ManifestRepository,
	token?: string,
): Promise<{ branch: string; commitSha: string } | null> {
	const remote = `https://github.com/${repository.fullName}.git`;
	const { resolvePreferredBranch } = await import("./git-client.ts");
	return resolvePreferredBranch(remote, repository.visibility === "private" ? token : undefined);
}

const command = defineCommand({
	meta: { name: "todo-scan", version: packageVersion, description: "Scan GitHub repositories for TODO markers" },
	args: {
		owner: { type: "string", default: "ruan-cat", description: "GitHub owner" },
		output: { type: "string", default: "artifacts/github-todos/ruan-cat.json", description: "Output JSON path" },
		fixture: { type: "string", description: "Offline fixture directory" },
		extensions: { type: "string", description: "Comma-separated extensions" },
		maxFileBytes: { type: "string", description: "Maximum file size" },
		transport: { type: "enum", options: ["degit", "api"], default: "degit", description: "Content transport" },
		manifest: {
			type: "string",
			default: "scripts/get-todo/repositories.json",
			description: "Repository manifest path",
		},
		includeForks: { type: "boolean", default: false, description: "Include fork repositories" },
		strict: { type: "boolean", default: false, description: "Fail on partial scan" },
		clearCache: { type: "boolean", default: false, description: "Prune local cache" },
		refreshManifest: { type: "boolean", default: false, description: "Refresh repository manifest via API" },
	},
	run: async (context) => {
		const parsed = context.args as Record<string, unknown>;
		const text = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined);
		const booleanValue = (value: unknown): boolean => value === true || value === "true";
		await runCli({
			owner: text(parsed.owner) ?? "ruan-cat",
			output: text(parsed.output) ?? "artifacts/github-todos/ruan-cat.json",
			fixture: text(parsed.fixture),
			extensions: text(parsed.extensions)?.split(",").filter(Boolean),
			maxFileBytes: text(parsed.maxFileBytes) ? Number(text(parsed.maxFileBytes)) : undefined,
			transport: (text(parsed.transport) as "degit" | "api" | undefined) ?? "degit",
			manifest: text(parsed.manifest),
			includeForks: booleanValue(parsed.includeForks),
			strict: booleanValue(parsed.strict),
			clearCache: booleanValue(parsed.clearCache),
			refreshManifest: booleanValue(parsed.refreshManifest),
		});
	},
});

if (process.argv[1]?.endsWith("cli.ts")) {
	runMain(command, { rawArgs: process.argv.slice(2).filter((argument) => argument !== "--") }).catch((error) => {
		logger.error(error instanceof Error ? error.message : "TODO scan failed");
		process.exitCode = 1;
	});
}
