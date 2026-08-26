import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

const DEFAULT_MAX_BYTES = 512 * 1024 * 1024;
const DEFAULT_MAX_AGE_DAYS = 7;
const RUN_PREFIX = "ruan-cat-github-todo-";

export interface CacheOptions {
	root: string;
	maxBytes?: number;
	maxAgeDays?: number;
	now?: Date;
}

export interface CacheReport {
	removedEntries: string[];
	totalBytes: number;
}

interface CacheEntry {
	name: string;
	path: string;
	bytes: number;
	modified: number;
}

async function directorySize(path: string): Promise<number> {
	const entries = await readdir(path, { withFileTypes: true });
	let total = 0;
	for (const entry of entries) {
		const child = join(path, entry.name);
		if (entry.isDirectory()) total += await directorySize(child);
		else total += (await stat(child)).size;
	}
	return total;
}

/** 创建本次运行专用的临时目录。 */
export async function createRunDirectory(): Promise<string> {
	return mkdtemp(join(tmpdir(), RUN_PREFIX));
}

/** 清理本次运行临时目录，并拒绝越界路径。 */
export async function cleanupRunDirectory(path: string): Promise<void> {
	const resolved = resolve(path);
	const temporaryRoot = resolve(tmpdir());
	if (dirname(resolved) !== temporaryRoot || !basename(resolved).startsWith(RUN_PREFIX))
		throw new Error("unsafe run directory");
	await rm(resolved, { recursive: true, force: true });
}

/** 按过期时间和总字节数清理 degit 快照缓存。 */
export async function pruneCache(options: CacheOptions): Promise<CacheReport> {
	const root = resolve(options.root);
	try {
		await stat(root);
	} catch (error) {
		if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return { removedEntries: [], totalBytes: 0 };
		throw error;
	}
	const now = options.now?.getTime() ?? Date.now();
	const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
	const maxAgeMs = (options.maxAgeDays ?? DEFAULT_MAX_AGE_DAYS) * 86_400_000;
	const entries: CacheEntry[] = [];
	for (const entry of await readdir(root, { withFileTypes: true })) {
		const path = join(root, entry.name);
		const metadata = await stat(path);
		entries.push({
			name: entry.name,
			path,
			bytes: entry.isDirectory() ? await directorySize(path) : metadata.size,
			modified: metadata.mtimeMs,
		});
	}
	const removedEntries: string[] = [];
	for (const entry of entries) {
		if (now - entry.modified > maxAgeMs) {
			await rm(entry.path, { recursive: true, force: true });
			removedEntries.push(entry.name);
		}
	}
	let totalBytes = entries
		.filter((entry) => !removedEntries.includes(entry.name))
		.reduce((total, entry) => total + entry.bytes, 0);
	for (const entry of entries
		.filter((item) => !removedEntries.includes(item.name))
		.sort((left, right) => left.modified - right.modified)) {
		if (totalBytes <= maxBytes) break;
		await rm(entry.path, { recursive: true, force: true });
		removedEntries.push(entry.name);
		totalBytes -= entry.bytes;
	}
	return { removedEntries, totalBytes };
}

export { DEFAULT_MAX_AGE_DAYS, DEFAULT_MAX_BYTES, RUN_PREFIX };
