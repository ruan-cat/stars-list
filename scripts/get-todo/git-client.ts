import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

import { commandEnvironment } from "./git-auth.ts";

const execFile = promisify(execFileCallback);

export type GitCommandRunner = (args: string[], options: { env?: NodeJS.ProcessEnv }) => Promise<string>;

function sanitizeError(error: unknown, token?: string): Error {
	const message = error instanceof Error ? error.message : "git command failed";
	const redacted = token
		? message.split(token).join("[REDACTED]")
		: message.replace(/https?:\/\/[^\s@]+@/g, "https://[REDACTED]@");
	return new Error(redacted);
}

async function defaultRunner(args: string[], options: { env?: NodeJS.ProcessEnv }): Promise<string> {
	const result = await execFile("git", args, { ...options, windowsHide: true, encoding: "utf8" });
	return result.stdout;
}

/** 列出远端分支和 commit SHA。 */
export async function listRemoteBranches(
	remote: string,
	token?: string,
	runner: GitCommandRunner = defaultRunner,
): Promise<Map<string, string>> {
	try {
		const output = await runner(["ls-remote", "--heads", "--refs", remote], { env: commandEnvironment(token) });
		const branches = new Map<string, string>();
		for (const line of output.split(/\r?\n/)) {
			const match = line.match(/^([0-9a-f]{40})\s+refs\/heads\/(.+)$/i);
			if (match) branches.set(match[2], match[1]);
		}
		return branches;
	} catch (error) {
		throw sanitizeError(error, token);
	}
}

/** 按 dev、main、master 顺序选择远端分支。 */
export async function resolvePreferredBranch(
	remote: string,
	token?: string,
	runner: GitCommandRunner = defaultRunner,
): Promise<{ branch: string; commitSha: string } | null> {
	const branches = await listRemoteBranches(remote, token, runner);
	for (const branch of ["dev", "main", "master"]) {
		const commitSha = branches.get(branch);
		if (commitSha) return { branch, commitSha };
	}
	return null;
}
