import { execFile as execFileCallback } from "node:child_process";
import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

import degit from "degit";

import { commandEnvironment } from "./git-auth.ts";

const execFile = promisify(execFileCallback);

export interface DegitEmitterLike {
	on: (event: "info" | "warn", listener: (info: { message?: string }) => void) => DegitEmitterLike;
	clone: (destination: string) => Promise<void>;
}

export type DegitFactory = (
	source: string,
	options: { cache: boolean; force: boolean; mode: "tar"; verbose: boolean },
) => DegitEmitterLike;

export interface SnapshotRequest {
	fullName: string;
	branch: string;
	commitSha: string;
	destination: string;
	token?: string;
	degitFactory?: DegitFactory;
	gitFallback?: (input: SnapshotRequest) => Promise<void>;
}

export interface SnapshotResult {
	source: "degit" | "git-fallback";
	commitSha: string;
	cacheStatus: "hit" | "miss" | "fallback";
}

async function removeGitMetadata(destination: string): Promise<void> {
	await rm(join(destination, ".git"), { recursive: true, force: true });
}

async function defaultGitFallback(input: SnapshotRequest): Promise<void> {
	const temporary = `${input.destination}.git-fallback`;
	await rm(temporary, { recursive: true, force: true });
	await mkdir(dirname(temporary), { recursive: true });
	const remote = `https://github.com/${input.fullName}.git`;
	await execFile(
		"git",
		["clone", "--depth", "1", "--single-branch", "--no-tags", "--branch", input.branch, remote, temporary],
		{ env: commandEnvironment(input.token), windowsHide: true, encoding: "utf8" },
	);
	await rm(input.destination, { recursive: true, force: true });
	await cp(temporary, input.destination, {
		recursive: true,
		filter: (source) => !source.endsWith("\\.git") && !source.endsWith("/.git"),
	});
	await rm(temporary, { recursive: true, force: true });
}

/** 下载无 .git 的 degit 快照，失败时切换到临时 Git fallback。 */
export async function downloadSnapshot(input: SnapshotRequest): Promise<SnapshotResult> {
	const factory = input.degitFactory ?? (degit as unknown as DegitFactory);
	await mkdir(dirname(input.destination), { recursive: true });
	let lastError: unknown;
	for (let attempt = 0; attempt < 2; attempt += 1) {
		try {
			await rm(input.destination, { recursive: true, force: true });
			const emitter = factory(`${input.fullName}#${input.branch}`, {
				cache: false,
				force: true,
				mode: "tar",
				verbose: false,
			});
			emitter.on("info", () => emitter);
			emitter.on("warn", () => emitter);
			await emitter.clone(input.destination);
			await removeGitMetadata(input.destination);
			return { source: "degit", commitSha: input.commitSha, cacheStatus: attempt === 0 ? "miss" : "fallback" };
		} catch (error) {
			lastError = error;
		}
	}

	try {
		await rm(input.destination, { recursive: true, force: true });
		await (input.gitFallback ?? defaultGitFallback)(input);
		await removeGitMetadata(input.destination);
		return { source: "git-fallback", commitSha: input.commitSha, cacheStatus: "fallback" };
	} catch (fallbackError) {
		const first = lastError instanceof Error ? lastError.message : "degit download failed";
		const second = fallbackError instanceof Error ? fallbackError.message : "git fallback failed";
		throw new Error(`${first}; ${second}`.replace(input.token ?? "\u0000", "[REDACTED]"));
	}
}
