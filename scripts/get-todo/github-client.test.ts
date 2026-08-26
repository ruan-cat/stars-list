import assert from "node:assert/strict";
import { test } from "node:test";

import { createGitHubClient } from "./github-client.ts";

function response(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json", ...headers },
	});
}

test("lists all owned repositories through pagination", async () => {
	const calls: string[] = [];
	const client = createGitHubClient({
		token: "secret",
		requester: async (url: string) => {
			calls.push(url);
			if (/(?:[?&])page=1(?:&|$)/.test(url)) {
				return {
					data: [{ name: "one", full_name: "ruan-cat/one", private: false, default_branch: "main" }],
					headers: new Headers({ link: '<https://api.github.com/user/repos?per_page=100&page=2>; rel="next"' }),
				};
			}
			return {
				data: [{ name: "two", full_name: "ruan-cat/two", private: true, default_branch: "master" }],
				headers: new Headers(),
			};
		},
	});

	const repositories = await client.listOwnedRepositories("ruan-cat");
	assert.deepEqual(
		repositories.map((repository) => repository.name),
		["one", "two"],
	);
	assert.equal(calls.length, 2);
});

test("selects dev before main and master", async () => {
	const calls: string[] = [];
	const client = createGitHubClient({
		requester: async (url: string) => {
			calls.push(url);
			if (url.endsWith("/branches?per_page=100"))
				return { data: [{ name: "main" }, { name: "feature" }], headers: new Headers() };
			return { data: { name: "master" }, headers: new Headers() };
		},
	});

	assert.equal(await client.selectBranch("ruan-cat/demo"), "main");
	assert.deepEqual(calls, ["/repos/ruan-cat/demo/branches?per_page=100"]);
});

test("retries a rate-limited request using retry-after", async () => {
	let attempts = 0;
	const client = createGitHubClient({
		maxRetries: 1,
		sleep: async () => undefined,
		requester: async () => {
			attempts += 1;
			if (attempts === 1) throw { response: { status: 429, headers: new Headers({ "retry-after": "0" }) } };
			return { data: { ok: true }, headers: new Headers() };
		},
	});

	assert.deepEqual(await client.getJson<{ ok: boolean }>("/rate_limit"), { ok: true });
	assert.equal(attempts, 2);
});
