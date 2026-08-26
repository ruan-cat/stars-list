import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { downloadSnapshot } from "./degit-client.ts";

test("downloads a branch snapshot with degit and removes git metadata", async () => {
	const root = await mkdtemp(join(tmpdir(), "todo-degit-"));
	const destination = join(root, "snapshot");
	let source = "";
	try {
		const result = await downloadSnapshot({
			fullName: "ruan-cat/demo",
			branch: "dev",
			commitSha: "a".repeat(40),
			destination,
			degitFactory: (value) => {
				source = value;
				return {
					on: () => undefined,
					clone: async (path: string) => {
						await mkdir(join(path, ".git"), { recursive: true });
						await writeFile(join(path, "README.md"), "content", "utf8");
					},
				};
			},
		});

		assert.equal(source, "ruan-cat/demo#dev");
		assert.equal(result.source, "degit");
		assert.equal(await readFile(join(destination, "README.md"), "utf8"), "content");
		assert.equal(await readFile(join(destination, ".git"), "utf8").catch(() => null), null);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test("falls back to git once when degit fails", async () => {
	const root = await mkdtemp(join(tmpdir(), "todo-degit-fallback-"));
	const destination = join(root, "snapshot");
	let fallbackCalls = 0;
	try {
		const result = await downloadSnapshot({
			fullName: "ruan-cat/private-demo",
			branch: "main",
			commitSha: "b".repeat(40),
			destination,
			degitFactory: () => ({
				on: () => undefined,
				clone: async () => {
					throw new Error("tarball denied");
				},
			}),
			gitFallback: async (input) => {
				fallbackCalls += 1;
				await mkdir(input.destination, { recursive: true });
				await mkdir(join(input.destination, ".git"), { recursive: true });
				await writeFile(join(input.destination, "src.ts"), "// TODO: fallback", "utf8");
			},
		});

		assert.equal(result.source, "git-fallback");
		assert.equal(fallbackCalls, 1);
		assert.equal(await readFile(join(destination, "src.ts"), "utf8"), "// TODO: fallback");
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
