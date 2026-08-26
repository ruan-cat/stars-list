import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { runCli } from "./cli.ts";
import { validateArtifact } from "./validate.ts";

test("fixture mode writes a valid artifact atomically", async () => {
	const directory = await mkdtemp(join(tmpdir(), "todo-scanner-"));
	const fixture = join(directory, "sample.md");
	const output = join(directory, "nested", "result.json");
	await writeFile(fixture, "## 001 <!-- TODO: --> 完成 fixture\n", "utf8");

	try {
		await runCli({ owner: "ruan-cat", fixture: directory, output });
		const artifact = JSON.parse(await readFile(output, "utf8")) as {
			schemaVersion: number;
			todos: Array<{ text: string }>;
		};
		assert.equal(artifact.schemaVersion, 1);
		assert.equal(artifact.todos[0].text, "完成 fixture");
		assert.equal(validateArtifact(artifact), true);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});

test("validator rejects an artifact without schemaVersion", () => {
	assert.equal(validateArtifact({ todos: [] }), false);
});
