import test from "node:test";
import assert from "node:assert/strict";
import { buildTodoTree, countVisibleTodos, filterTodoTree, toggleTodoNode, type TodoTreeState } from "./todo-tree.ts";
import type { TodoScanArtifact } from "../../../scripts/get-todo/types.ts";

const artifact: TodoScanArtifact = {
	schemaVersion: 1,
	generatedAt: "2026-08-26T00:00:00.000Z",
	scan: {
		owner: "ruan-cat",
		repositoryScope: "owner",
		branchStrategy: ["main"],
		authMode: "public-only",
		completeness: "complete",
		extensions: [".md"],
		maxFileBytes: 1000,
	},
	summary: {
		repositoryCount: 1,
		scannedRepositoryCount: 1,
		todoCount: 2,
		unresolvedEmptyTodoCount: 0,
		skippedFileCount: 0,
		errorCount: 0,
	},
	repositories: [
		{
			fullName: "ruan-cat/demo",
			visibility: "public",
			selectedBranch: "main",
			status: "scanned",
			todoCount: 2,
			errors: [],
		},
	],
	todos: [
		{
			id: "b",
			repo: "demo",
			path: "src/a.ts",
			branch: "main",
			line: 4,
			kind: "source-comment",
			text: "fix auth",
			todoAnnotation: "fix auth",
			rawLine: "// TODO fix auth",
			sha: "sha",
			htmlUrl: "https://github.com/ruan-cat/demo/blob/main/src/a.ts#L4",
			visibility: "public",
			language: "TypeScript",
		},
		{
			id: "a",
			repo: "demo",
			path: "README.md",
			branch: "main",
			line: 2,
			kind: "markdown-inline",
			text: "docs",
			todoAnnotation: "docs",
			rawLine: "<!-- TODO docs -->",
			sha: "sha",
			htmlUrl: "https://github.com/ruan-cat/demo/blob/main/README.md#L2",
			visibility: "public",
			language: "Markdown",
		},
	],
	errors: [],
};

test("builds repository, branch, directory, file and todo levels with stable ordering", () => {
	const tree = buildTodoTree(artifact);
	assert.equal(tree[0].type, "repository");
	assert.equal(tree[0].id, "repo:ruan-cat/demo");
	assert.equal(tree[0].count, 2);
	const branch = tree[0].children.find((node) => node.type === "branch");
	assert.ok(branch);
	assert.equal(
		branch?.children.some((node) => node.type === "file" && node.label === "README.md"),
		true,
	);
	assert.equal(countVisibleTodos(tree), 2);
});

test("filters matching leaves while retaining their ancestor chain", () => {
	const tree = buildTodoTree(artifact);
	const filtered = filterTodoTree(tree, { text: "auth", kind: "source-comment" });
	assert.equal(countVisibleTodos(filtered), 1);
	assert.equal(filtered[0].children[0].count, 1);
});

test("toggleTodoNode returns immutable expanded state", () => {
	const state: TodoTreeState = { expanded: { "repo:ruan-cat/demo": true }, selectedId: null };
	const next = toggleTodoNode(state, "repo:ruan-cat/demo");
	assert.notEqual(next, state);
	assert.equal(next.expanded["repo:ruan-cat/demo"], false);
	assert.equal(state.expanded["repo:ruan-cat/demo"], true);
});

test("treats empty UI filter values as no filter", () => {
	const tree = buildTodoTree(artifact);
	const filtered = filterTodoTree(tree, { search: "", repo: "", branch: "", kind: "" });
	assert.equal(countVisibleTodos(filtered), 2);
});
