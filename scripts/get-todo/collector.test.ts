import assert from "node:assert/strict";
import { test } from "node:test";

import { collectTodos } from "./collector.ts";
import type { GitHubClient, GitHubRepository } from "./github-client.ts";

function repository(name: string, isPrivate = false): GitHubRepository {
	return { name, full_name: `ruan-cat/${name}`, private: isPrivate, default_branch: "main", language: "TypeScript" };
}

function fakeClient(repositories: GitHubRepository[]): GitHubClient {
	return {
		getJson: async () => ({}) as never,
		listOwnedRepositories: async () => repositories,
		branchExists: async (_fullName, branch) => branch === "dev",
		selectBranch: async () => "dev",
		getRecursiveTree: async (fullName) => ({
			sha: `${fullName}-tree`,
			url: "tree-url",
			truncated: false,
			tree: [
				{ path: "docs/plan.md", mode: "100644", type: "blob", sha: `${fullName}-blob`, size: 100 },
				{ path: "dist/out.js", mode: "100644", type: "blob", sha: "ignored", size: 10 },
			],
		}),
		getTree: async () => ({ sha: "tree", url: "tree-url", truncated: false, tree: [] }),
		getBlobText: async () => ({ content: "## 006 <!-- TODO: --> 持续推进\n", size: 40, sha: "blob-sha" }),
	};
}

test("collects owned repositories and filters generated paths", async () => {
	const artifact = await collectTodos({
		owner: "ruan-cat",
		client: fakeClient([repository("public-repo"), repository("private-repo", true)]),
		authenticated: true,
		isActions: false,
	});

	assert.equal(artifact.scan.completeness, "complete");
	assert.equal(artifact.summary.repositoryCount, 2);
	assert.equal(artifact.summary.todoCount, 2);
	assert.deepEqual(
		artifact.todos.map((todo) => todo.repo),
		["private-repo", "public-repo"],
	);
	assert.equal(artifact.todos[0].branch, "dev");
	assert.equal(artifact.todos[0].visibility, "private");
});

test("marks unauthenticated scans partial and excludes private repositories", async () => {
	const artifact = await collectTodos({
		owner: "ruan-cat",
		client: fakeClient([repository("public-repo"), repository("private-repo", true)]),
		authenticated: false,
		isActions: false,
	});

	assert.equal(artifact.scan.authMode, "public-only");
	assert.equal(artifact.scan.completeness, "partial");
	assert.equal(artifact.summary.scannedRepositoryCount, 1);
	assert.equal(artifact.repositories.length, 1);
});

test("rejects GitHub Actions collection without a token", async () => {
	await assert.rejects(
		() => collectTodos({ owner: "ruan-cat", client: fakeClient([]), authenticated: false, isActions: true }),
		/GITHUB_TOKEN or GITHUB_PAT_TOKEN is required/,
	);
});

test("excludes fork repositories by default", async () => {
	const fork = { ...repository("fork-repo"), fork: true };
	const artifact = await collectTodos({
		owner: "ruan-cat",
		client: fakeClient([repository("original"), fork]),
		authenticated: true,
		isActions: false,
	});
	assert.deepEqual(
		artifact.repositories.map((item) => item.fullName),
		["ruan-cat/original"],
	);
});
