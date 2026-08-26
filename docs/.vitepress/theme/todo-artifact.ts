import type { TodoScanArtifact } from "../../../scripts/get-todo/types.ts";

export type { TodoScanArtifact };

export const DEFAULT_ARTIFACT_URL =
	"https://raw.githubusercontent.com/ruan-cat/stars-list/main/artifacts/github-todos/ruan-cat.json";

export class TodoArtifactError extends Error {
	constructor(
		message: string,
		public readonly cause?: unknown,
	) {
		super(message);
		this.name = "TodoArtifactError";
	}
}

export function resolveArtifactUrl(env: Record<string, string | undefined>): string {
	const configured = env.VITE_GITHUB_TODO_ARTIFACT_URL?.trim();
	if (configured) return configured;
	if (typeof location !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
		return "/artifacts/github-todos/ruan-cat.json";
	}
	return DEFAULT_ARTIFACT_URL;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

export function isTodoScanArtifact(value: unknown): value is TodoScanArtifact {
	if (!isRecord(value) || value.schemaVersion !== 1 || typeof value.generatedAt !== "string") return false;
	if (!isRecord(value.scan) || !isRecord(value.summary)) return false;
	const scan = value.scan;
	const summary = value.summary;
	if (
		typeof scan.owner !== "string" ||
		scan.repositoryScope !== "owner" ||
		!Array.isArray(scan.branchStrategy) ||
		!scan.branchStrategy.every((item) => typeof item === "string")
	)
		return false;
	if (
		!(["authenticated", "public-only"] as unknown[]).includes(scan.authMode) ||
		!(["complete", "partial", "failed"] as unknown[]).includes(scan.completeness)
	)
		return false;
	if (
		!Array.isArray(scan.extensions) ||
		!scan.extensions.every((item) => typeof item === "string") ||
		typeof scan.maxFileBytes !== "number"
	)
		return false;
	const summaryKeys = [
		"repositoryCount",
		"scannedRepositoryCount",
		"todoCount",
		"unresolvedEmptyTodoCount",
		"skippedFileCount",
		"errorCount",
	];
	if (!summaryKeys.every((key) => typeof summary[key] === "number")) return false;
	if (
		!Array.isArray(value.repositories) ||
		!Array.isArray(value.todos) ||
		!Array.isArray(value.errors) ||
		!value.errors.every((item) => typeof item === "string")
	)
		return false;
	if (
		!value.repositories.every(
			(repo) =>
				isRecord(repo) &&
				typeof repo.fullName === "string" &&
				typeof repo.todoCount === "number" &&
				Array.isArray(repo.errors),
		)
	)
		return false;
	if (
		!value.todos.every(
			(todo) =>
				isRecord(todo) &&
				typeof todo.id === "string" &&
				typeof todo.repo === "string" &&
				typeof todo.path === "string" &&
				typeof todo.branch === "string" &&
				typeof todo.line === "number" &&
				typeof todo.kind === "string" &&
				typeof todo.text === "string" &&
				typeof todo.htmlUrl === "string",
		)
	)
		return false;
	return true;
}

export async function fetchTodoArtifact(url: string, signal?: AbortSignal): Promise<TodoScanArtifact> {
	let response: Response;
	try {
		response = await fetch(url, { signal, cache: "no-store", headers: { accept: "application/json" } });
	} catch (error) {
		if (error instanceof TodoArtifactError) throw error;
		throw new TodoArtifactError("Failed to fetch TODO artifact", error);
	}
	if (!response.ok)
		throw new TodoArtifactError(`Failed to fetch TODO artifact: HTTP ${response.status} ${response.statusText}`);
	let value: unknown;
	try {
		value = await response.json();
	} catch (error) {
		throw new TodoArtifactError("TODO artifact response was not valid JSON", error);
	}
	if (!isTodoScanArtifact(value)) throw new TodoArtifactError("TODO artifact schema is invalid or unsupported");
	return value;
}
