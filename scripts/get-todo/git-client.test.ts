import assert from "node:assert/strict";
import { test } from "node:test";

import { listRemoteBranches, resolvePreferredBranch } from "./git-client.ts";

test("resolves dev before main and master without placing token in argv", async () => {
	let receivedArgs: string[] = [];
	let receivedEnv: Record<string, string | undefined> | undefined;
	const runner = async (args: string[], options: { env?: NodeJS.ProcessEnv }): Promise<string> => {
		receivedArgs = args;
		receivedEnv = options.env;
		return `${"a".repeat(40)}\trefs/heads/main\n${"b".repeat(40)}\trefs/heads/master\n`;
	};

	const result = await resolvePreferredBranch("https://github.com/ruan-cat/demo.git", "secret-token", runner);
	assert.deepEqual(result, { branch: "main", commitSha: "a".repeat(40) });
	assert.equal(receivedArgs.includes("secret-token"), false);
	assert.equal(
		receivedEnv?.GIT_CONFIG_VALUE_0,
		`AUTHORIZATION: basic ${Buffer.from("x-access-token:secret-token", "utf8").toString("base64")}`,
	);
	assert.equal(receivedEnv?.GIT_CONFIG_VALUE_0?.includes("secret-token"), false);
});

test("parses remote refs and returns null when preferred branches are absent", async () => {
	const runner = async (): Promise<string> => `${"c".repeat(40)}\trefs/heads/feature\n`;
	const branches = await listRemoteBranches("https://github.com/ruan-cat/demo.git", undefined, runner);
	assert.equal(branches.get("feature"), "c".repeat(40));
	assert.equal(await resolvePreferredBranch("https://github.com/ruan-cat/demo.git", undefined, runner), null);
});

test("sanitizes git command failures", async () => {
	const runner = async (): Promise<string> => {
		throw new Error("fatal: https://secret-token@github.com/rejected");
	};
	await assert.rejects(
		() => listRemoteBranches("https://github.com/ruan-cat/demo.git", "secret-token", runner),
		(error) => {
			assert.equal(String(error).includes("secret-token"), false);
			return true;
		},
	);
});
