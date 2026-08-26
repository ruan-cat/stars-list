import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_ARTIFACT_URL, fetchTodoArtifact, isTodoScanArtifact, resolveArtifactUrl } from "./todo-artifact.ts";

const validArtifact = {
	schemaVersion: 1,
	generatedAt: "2026-08-26T00:00:00.000Z",
	scan: {
		owner: "ruan-cat",
		repositoryScope: "owner",
		branchStrategy: ["dev"],
		authMode: "public-only",
		completeness: "complete",
		extensions: [".ts"],
		maxFileBytes: 1000,
	},
	summary: {
		repositoryCount: 1,
		scannedRepositoryCount: 1,
		todoCount: 0,
		unresolvedEmptyTodoCount: 0,
		skippedFileCount: 0,
		errorCount: 0,
	},
	repositories: [],
	todos: [],
	errors: [],
};

test("resolves the default and environment artifact URLs", () => {
	assert.equal(resolveArtifactUrl({}), DEFAULT_ARTIFACT_URL);
	assert.equal(
		resolveArtifactUrl({ VITE_GITHUB_TODO_ARTIFACT_URL: "https://example.test/todos.json" }),
		"https://example.test/todos.json",
	);
});

test("rejects schema and top-level type mismatches", () => {
	assert.equal(isTodoScanArtifact(validArtifact), true);
	assert.equal(isTodoScanArtifact({ ...validArtifact, schemaVersion: 2 }), false);
	assert.equal(isTodoScanArtifact({ ...validArtifact, todos: {} }), false);
	assert.equal(isTodoScanArtifact({ ...validArtifact, summary: null }), false);
});

test("passes AbortSignal to fetch and returns validated JSON", async () => {
	const originalFetch = globalThis.fetch;
	const controller = new AbortController();
	let receivedSignal: AbortSignal | undefined;
	globalThis.fetch = async (_input, init) => {
		receivedSignal = init?.signal as AbortSignal | undefined;
		return new Response(JSON.stringify(validArtifact), {
			status: 200,
			headers: { "content-type": "application/json" },
		});
	};

	try {
		const artifact = await fetchTodoArtifact("https://example.test/todos.json", controller.signal);
		assert.equal(artifact.schemaVersion, 1);
		assert.equal(receivedSignal, controller.signal);
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test("normalizes HTTP and schema failures", async () => {
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async () => new Response("nope", { status: 404, statusText: "Not Found" });
	try {
		await assert.rejects(fetchTodoArtifact("https://example.test/missing.json"), /404/);
	} finally {
		globalThis.fetch = originalFetch;
	}
});
