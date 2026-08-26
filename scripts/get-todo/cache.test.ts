import assert from "node:assert/strict";
import { mkdir, rm, utimes, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { cleanupRunDirectory, createRunDirectory, pruneCache } from "./cache.ts";

test("prunes expired cache entries and enforces a byte limit", async () => {
	const root = await mkdtemp(join(tmpdir(), "todo-cache-"));
	const old = join(root, "old");
	const recent = join(root, "recent");
	try {
		await mkdir(old);
		await mkdir(recent);
		await writeFile(join(old, "blob"), "12345", "utf8");
		await writeFile(join(recent, "blob"), "12345", "utf8");
		const oldDate = new Date("2026-01-01T00:00:00.000Z");
		await utimes(old, oldDate, oldDate);
		const report = await pruneCache({ root, maxBytes: 5, maxAgeDays: 7, now: new Date("2026-08-26T00:00:00.000Z") });
		assert.equal(report.removedEntries.includes("old"), true);
		assert.equal(report.totalBytes <= 5, true);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test("creates and cleans a temporary run directory", async () => {
	const directory = await createRunDirectory();
	assert.equal(directory.includes("ruan-cat-github-todo-"), true);
	await cleanupRunDirectory(directory);
	await assert.rejects(() => cleanupRunDirectory(join(tmpdir(), "not-a-run-directory")), /unsafe run directory/);
});
