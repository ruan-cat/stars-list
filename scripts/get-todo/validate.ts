import { readFile } from "node:fs/promises";

import type { TodoScanArtifact } from "./types.ts";

const COMPLETENESS = new Set(["complete", "partial", "failed"]);
const REPOSITORY_STATUS = new Set(["scanned", "unauthorized", "branch_unavailable", "failed", "skipped"]);

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

/** 校验 TODO 扫描 JSON contract。 */
export function validateArtifact(value: unknown): value is TodoScanArtifact {
	if (
		!isRecord(value) ||
		value.schemaVersion !== 1 ||
		!Array.isArray(value.todos) ||
		!Array.isArray(value.repositories) ||
		!isRecord(value.summary) ||
		!isRecord(value.scan)
	)
		return false;
	if (!COMPLETENESS.has(String(value.scan.completeness))) return false;
	if (!["authenticated", "public-only"].includes(String(value.scan.authMode))) return false;
	const summary = value.summary;
	if (typeof summary.repositoryCount !== "number" || summary.repositoryCount < value.repositories.length) return false;
	if (summary.todoCount !== value.todos.length) return false;
	if (
		summary.unresolvedEmptyTodoCount !==
		value.todos.filter((todo) => isRecord(todo) && todo.kind === "unresolved_empty_todo").length
	)
		return false;
	return (
		value.repositories.every(
			(repository) =>
				isRecord(repository) &&
				typeof repository.fullName === "string" &&
				REPOSITORY_STATUS.has(String(repository.status)),
		) &&
		value.todos.every(
			(todo) =>
				isRecord(todo) &&
				typeof todo.id === "string" &&
				typeof todo.path === "string" &&
				typeof todo.branch === "string" &&
				typeof todo.line === "number" &&
				typeof todo.text === "string",
		)
	);
}

/** 从磁盘读取并校验 TODO JSON 文件。 */
export async function validateFile(path: string): Promise<boolean> {
	const value: unknown = JSON.parse(await readFile(path, "utf8"));
	return validateArtifact(value);
}

if (process.argv[1]?.endsWith("validate.ts")) {
	const path = process.argv.slice(2).find((argument) => argument !== "--");
	if (!path) {
		console.error("Usage: pnpm todo:validate -- <artifact.json>");
		process.exitCode = 2;
	} else {
		validateFile(path)
			.then((valid) => {
				if (!valid) process.exitCode = 1;
				console.log(valid ? "valid" : "invalid");
			})
			.catch((error) => {
				console.error(error instanceof Error ? error.message : "validation failed");
				process.exitCode = 1;
			});
	}
}
