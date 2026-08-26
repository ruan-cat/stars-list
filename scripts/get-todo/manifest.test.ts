import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { filterScannableRepositories, loadManifest, manifestAgeDays, writeManifest } from "./manifest.ts";
import type { RepositoryManifest } from "./types.ts";

function createManifest(): RepositoryManifest {
	return {
		schemaVersion: 1,
		owner: "ruan-cat",
		generatedAt: "2026-08-26T00:00:00.000Z",
		source: "manual",
		manifestStale: false,
		repositories: [
			{
				fullName: "ruan-cat/original",
				visibility: "public",
				fork: false,
				archived: false,
				selectedBranch: "dev",
				lastKnownCommitSha: "sha-1",
				lastFetchedAt: "2026-08-26T00:00:00.000Z",
			},
			{
				fullName: "ruan-cat/fork",
				visibility: "public",
				fork: true,
				archived: false,
				selectedBranch: "main",
				lastKnownCommitSha: "sha-2",
				lastFetchedAt: "2026-08-26T00:00:00.000Z",
			},
			{
				fullName: "ruan-cat/archived",
				visibility: "private",
				fork: false,
				archived: true,
				selectedBranch: "master",
				lastKnownCommitSha: "sha-3",
				lastFetchedAt: "2026-08-26T00:00:00.000Z",
			},
		],
	};
}

test("writes and loads a valid manifest atomically", async () => {
	const directory = await mkdtemp(join(tmpdir(), "todo-manifest-"));
	const path = join(directory, "repositories.json");
	try {
		const manifest = createManifest();
		await writeManifest(path, manifest);
		assert.deepEqual(await loadManifest(path), manifest);
		assert.equal((await readFile(path, "utf8")).endsWith("\n"), true);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});

test("filters forks while retaining archived original repositories", () => {
	const manifest = createManifest();
	assert.deepEqual(
		filterScannableRepositories(manifest).map((repository) => repository.fullName),
		["ruan-cat/archived", "ruan-cat/original"],
	);
	assert.equal(filterScannableRepositories(manifest, true).length, 3);
});

test("calculates manifest age in days", () => {
	const manifest = createManifest();
	assert.equal(manifestAgeDays(manifest, new Date("2026-08-27T00:00:00.000Z")), 1);
});
