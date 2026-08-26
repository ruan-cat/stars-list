import assert from "node:assert/strict";
import { test } from "node:test";

import { parseTodoFile } from "./todo-parser.ts";

const baseInput = {
	path: "docs/plan.md",
	sha: "sha-1",
	branch: "dev",
	repo: "demo",
	visibility: "public" as const,
	language: "Markdown",
	htmlUrl: "https://github.com/ruan-cat/demo/blob/dev/docs/plan.md",
};

test("parses markdown headings and uses text after the TODO comment", () => {
	const result = parseTodoFile({
		...baseInput,
		content: "## 006 <!-- TODO: 2026-8-24 codex 正在做 --> 持续推进二期 AI 项目改造",
	});

	assert.equal(result.matches.length, 1);
	assert.equal(result.matches[0].kind, "markdown-heading");
	assert.equal(result.matches[0].text, "持续推进二期 AI 项目改造");
	assert.equal(result.matches[0].todoAnnotation, "2026-8-24 codex 正在做");
	assert.equal(result.matches[0].line, 1);
});

test("parses markdown inline TODO using annotation text", () => {
	const result = parseTodoFile({
		...baseInput,
		content: "1. <!-- TODO: 可接受的优化 --> **先降低默认输出成本。**",
	});

	assert.equal(result.matches[0].kind, "markdown-inline");
	assert.equal(result.matches[0].text, "可接受的优化");
});

test("parses standalone TODO content and empty TODO continuation", () => {
	const result = parseTodoFile({
		...baseInput,
		content:
			"<!-- TODO: 后面再考虑提供更好看的动效 现在暂时没有需求 -->\n\n<!-- TODO: -->\n\n回到本项目，针对 docs/plan 文件。",
	});

	assert.equal(result.matches.length, 2);
	assert.equal(result.matches[0].kind, "markdown-standalone");
	assert.equal(result.matches[0].text, "后面再考虑提供更好看的动效 现在暂时没有需求");
	assert.equal(result.matches[1].kind, "markdown-standalone");
	assert.equal(result.matches[1].text, "回到本项目，针对 docs/plan 文件。");
	assert.equal(result.matches[1].line, 3);
});

test("records unresolved empty TODO at a structural boundary", () => {
	const result = parseTodoFile({
		...baseInput,
		content: "<!-- TODO: -->\n\n## Next section",
	});

	assert.equal(result.matches.length, 1);
	assert.equal(result.matches[0].kind, "unresolved_empty_todo");
	assert.equal(result.matches[0].text, "");
});

test("ignores the numeric empty heading blacklist", () => {
	const result = parseTodoFile({
		...baseInput,
		content: "## 015 <!-- TODO: -->",
	});

	assert.equal(result.matches.length, 0);
});

test("recognizes only standalone uppercase TODO", () => {
	const result = parseTodoFile({
		...baseInput,
		path: "src/example.ts",
		language: "TypeScript",
		content: "// todo: lowercase\n// TODOLIST: not a marker\n/** TODO: 准备删除该工具 */",
	});

	assert.equal(result.matches.length, 1);
	assert.equal(result.matches[0].kind, "source-comment");
	assert.equal(result.matches[0].text, "准备删除该工具");
});

test("parses source comment prefixes", () => {
	const result = parseTodoFile({
		...baseInput,
		path: "styles/main.scss",
		language: "SCSS",
		content: "// TODO: 实现图标变化的动效\n/* TODO: 清理旧变量 */\n# TODO: 更新文档",
	});

	assert.deepEqual(
		result.matches.map((match) => match.text),
		["实现图标变化的动效", "清理旧变量", "更新文档"],
	);
});

test("returns each independent inline Markdown TODO", () => {
	const result = parseTodoFile({
		...baseInput,
		content: "<!-- TODO: 第一项 --> 与 <!-- TODO: 第二项 --> 同行",
	});

	assert.deepEqual(
		result.matches.map((match) => match.text),
		["第一项", "第二项"],
	);
});
