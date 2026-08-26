import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { collectFromManifest } from "./local-snapshot-collector.ts";
import type { RepositoryManifest } from "./types.ts";

test("scans non-fork snapshots and records degit metadata", async () => {
	const root = await mkdtemp(join(tmpdir(), "todo-snapshot-"));
	const manifest: RepositoryManifest = {
		schemaVersion: 1,
		owner: "ruan-cat",
		generatedAt: "2026-08-26T00:00:00.000Z",
		source: "manual",
		manifestStale: true,
		repositories: [
			{
				fullName: "ruan-cat/original",
				visibility: "public",
				fork: false,
				archived: false,
				selectedBranch: null,
				lastKnownCommitSha: null,
				lastFetchedAt: null,
			},
			{
				fullName: "ruan-cat/fork",
				visibility: "public",
				fork: true,
				archived: false,
				selectedBranch: "main",
				lastKnownCommitSha: "fork-sha",
				lastFetchedAt: null,
			},
		],
	};
	let cleaned = false;
	try {
		const artifact = await collectFromManifest({
			manifest,
			root,
			authenticated: true,
			resolveBranch: async () => ({ branch: "dev", commitSha: "a".repeat(40) }),
			downloadSnapshot: async (input) => {
				await mkdir(join(input.destination, "docs"), { recursive: true });
				await writeFile(join(input.destination, "docs", "plan.md"), "## 001 <!-- TODO: --> 完成快照扫描\n", "utf8");
				return { source: "degit", commitSha: input.commitSha, cacheStatus: "miss" };
			},
			cleanup: async () => {
				cleaned = true;
			},
		});

		assert.equal(artifact.repositories.length, 2);
		assert.equal(artifact.summary.scannedRepositoryCount, 1);
		assert.equal(artifact.todos.length, 1);
		assert.equal(artifact.todos[0].source, "degit");
		assert.equal(artifact.todos[0].commitSha, "a".repeat(40));
		assert.equal(artifact.scan.completeness, "partial");
		assert.equal(cleaned, true);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test("skips private manifest entries without local credentials", async () => {
	const root = await mkdtemp(join(tmpdir(), "todo-snapshot-public-only-"));
	const manifest: RepositoryManifest = {
		schemaVersion: 1,
		owner: "ruan-cat",
		generatedAt: "2026-08-26T00:00:00.000Z",
		source: "manual",
		manifestStale: false,
		repositories: [
			{
				fullName: "ruan-cat/private",
				visibility: "private",
				fork: false,
				archived: false,
				selectedBranch: null,
				lastKnownCommitSha: null,
				lastFetchedAt: null,
			},
		],
	};
	try {
		const artifact = await collectFromManifest({
			manifest,
			root,
			authenticated: false,
			resolveBranch: async () => {
				throw new Error("must not resolve private branch");
			},
			downloadSnapshot: async () => {
				throw new Error("must not download private snapshot");
			},
			cleanup: async () => undefined,
		});
		assert.equal(artifact.repositories[0].status, "unauthorized");
		assert.equal(artifact.scan.completeness, "partial");
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test("continues the full scan when one repository snapshot fails", async () => {
	const root = await mkdtemp(join(tmpdir(), "todo-snapshot-partial-"));
	const manifest: RepositoryManifest = {
		schemaVersion: 1,
		owner: "ruan-cat",
		generatedAt: "2026-08-26T00:00:00.000Z",
		source: "manual",
		manifestStale: false,
		repositories: [
			{
				fullName: "ruan-cat/fails",
				visibility: "public",
				fork: false,
				archived: false,
				selectedBranch: null,
				lastKnownCommitSha: null,
				lastFetchedAt: null,
			},
			{
				fullName: "ruan-cat/works",
				visibility: "public",
				fork: false,
				archived: false,
				selectedBranch: null,
				lastKnownCommitSha: null,
				lastFetchedAt: null,
			},
		],
	};
	try {
		const artifact = await collectFromManifest({
			manifest,
			root,
			authenticated: true,
			resolveBranch: async () => ({ branch: "dev", commitSha: "b".repeat(40) }),
			downloadSnapshot: async (input) => {
				if (input.fullName.endsWith("/fails")) throw new Error("snapshot unavailable");
				await mkdir(input.destination, { recursive: true });
				await writeFile(join(input.destination, "plan.md"), "<!-- TODO: keep scanning -->\n", "utf8");
				return { source: "degit", commitSha: input.commitSha, cacheStatus: "miss" };
			},
			cleanup: async () => undefined,
		});
		assert.equal(artifact.repositories.length, 2);
		assert.equal(artifact.summary.scannedRepositoryCount, 1);
		assert.equal(artifact.summary.todoCount, 1);
		assert.equal(artifact.repositories.find((repo) => repo.fullName.endsWith("/fails"))?.status, "failed");
		assert.equal(artifact.repositories.find((repo) => repo.fullName.endsWith("/works"))?.status, "scanned");
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
