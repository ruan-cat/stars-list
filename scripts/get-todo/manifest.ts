import { dirname } from "node:path";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";

import type { ManifestRepository, RepositoryManifest } from "./types.ts";

function isManifestRepository(value: unknown): value is ManifestRepository {
	if (typeof value !== "object" || value === null) return false;
	const repository = value as Record<string, unknown>;
	return (
		typeof repository.fullName === "string" &&
		["public", "private"].includes(String(repository.visibility)) &&
		typeof repository.fork === "boolean" &&
		typeof repository.archived === "boolean" &&
		(typeof repository.selectedBranch === "string" || repository.selectedBranch === null) &&
		(typeof repository.lastKnownCommitSha === "string" || repository.lastKnownCommitSha === null) &&
		(typeof repository.lastFetchedAt === "string" || repository.lastFetchedAt === null)
	);
}

function assertManifest(value: unknown): asserts value is RepositoryManifest {
	if (typeof value !== "object" || value === null) throw new Error("Invalid manifest: expected an object");
	const manifest = value as Record<string, unknown>;
	if (
		manifest.schemaVersion !== 1 ||
		typeof manifest.owner !== "string" ||
		typeof manifest.generatedAt !== "string" ||
		!["github-api", "manual", "cache"].includes(String(manifest.source)) ||
		typeof manifest.manifestStale !== "boolean" ||
		!Array.isArray(manifest.repositories) ||
		!manifest.repositories.every(isManifestRepository)
	)
		throw new Error("Invalid manifest: schema validation failed");
}

/** 读取并校验仓库 manifest。 */
export async function loadManifest(path: string): Promise<RepositoryManifest> {
	const value: unknown = JSON.parse(await readFile(path, "utf8"));
	assertManifest(value);
	return value;
}

/** 原子写入仓库 manifest。 */
export async function writeManifest(path: string, manifest: RepositoryManifest): Promise<void> {
	assertManifest(manifest);
	await mkdir(dirname(path), { recursive: true });
	const temporary = `${path}.${process.pid}.tmp`;
	await writeFile(temporary, `${JSON.stringify(manifest, null, "\t")}\n`, "utf8");
	await rename(temporary, path);
}

/** 按默认策略过滤 fork，保留归档原创仓库。 */
export function filterScannableRepositories(manifest: RepositoryManifest, includeForks = false): ManifestRepository[] {
	return manifest.repositories
		.filter((repository) => includeForks || !repository.fork)
		.sort((left, right) => left.fullName.localeCompare(right.fullName));
}

/** 计算 manifest 距离指定时间的完整天数。 */
export function manifestAgeDays(manifest: RepositoryManifest, now = new Date()): number {
	const generatedAt = Date.parse(manifest.generatedAt);
	if (!Number.isFinite(generatedAt)) return Number.POSITIVE_INFINITY;
	return Math.max(0, Math.floor((now.getTime() - generatedAt) / 86_400_000));
}
