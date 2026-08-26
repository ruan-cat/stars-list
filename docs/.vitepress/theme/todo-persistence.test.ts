import test from "node:test";
import assert from "node:assert/strict";
import { readPersistedArtifact, writePersistedArtifact } from "./todo-persistence.ts";

const artifact = {
	schemaVersion: 1 as const,
	generatedAt: "2026-08-26T00:00:00.000Z",
	scan: {
		owner: "ruan-cat",
		repositoryScope: "owner" as const,
		branchStrategy: ["dev"],
		authMode: "public-only" as const,
		completeness: "complete" as const,
		extensions: [],
		maxFileBytes: 1,
	},
	summary: {
		repositoryCount: 0,
		scannedRepositoryCount: 0,
		todoCount: 0,
		unresolvedEmptyTodoCount: 0,
		skippedFileCount: 0,
		errorCount: 0,
	},
	repositories: [],
	todos: [],
	errors: [],
};

test("writes and reads a fresh persisted artifact", () => {
	const storage = new Map<string, string>();
	const original = globalThis.localStorage;
	Object.defineProperty(globalThis, "localStorage", {
		configurable: true,
		value: {
			getItem: (key: string) => storage.get(key) ?? null,
			setItem: (key: string, value: string) => storage.set(key, value),
		},
	});
	try {
		writePersistedArtifact("todo", artifact, 10_000);
		const persisted = readPersistedArtifact("todo", 10_000 + 30 * 60 * 1000);
		assert.deepEqual(persisted?.artifact, artifact);
		assert.equal(persisted?.stale, true);
	} finally {
		Object.defineProperty(globalThis, "localStorage", { configurable: true, value: original });
	}
});

test("keeps stale snapshots for seven days but drops older snapshots", () => {
	const storage = new Map<string, string>();
	const original = globalThis.localStorage;
	Object.defineProperty(globalThis, "localStorage", {
		configurable: true,
		value: {
			getItem: (key: string) => storage.get(key) ?? null,
			setItem: (key: string, value: string) => storage.set(key, value),
		},
	});
	try {
		writePersistedArtifact("todo", artifact, 10_000);
		assert.ok(readPersistedArtifact("todo", 10_000 + 7 * 24 * 60 * 60 * 1000 - 1));
		assert.equal(readPersistedArtifact("todo", 10_000 + 7 * 24 * 60 * 60 * 1000), null);
	} finally {
		Object.defineProperty(globalThis, "localStorage", { configurable: true, value: original });
	}
});

test("ignores invalid JSON and never throws", () => {
	const original = globalThis.localStorage;
	Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: () => "{bad" } });
	try {
		assert.equal(readPersistedArtifact("todo"), null);
	} finally {
		Object.defineProperty(globalThis, "localStorage", { configurable: true, value: original });
	}
});
