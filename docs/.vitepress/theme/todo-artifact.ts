import type { TodoScanArtifact } from "../../../scripts/get-todo/types.ts";

export type { TodoScanArtifact };

export const DEFAULT_ARTIFACT_URL =
	"https://raw.githubusercontent.com/ruan-cat/stars-list/main/artifacts/github-todos/ruan-cat.json";

/** artifact 在部署产物内的相对路径；get-todo.yml 会把它复制进 docs/public 一起发布到 GitHub Pages */
export const ARTIFACT_PUBLIC_PATH = "artifacts/github-todos/ruan-cat.json";

export class TodoArtifactError extends Error {
	constructor(
		message: string,
		public readonly cause?: unknown,
	) {
		super(message);
		this.name = "TodoArtifactError";
	}
}

/**
 * 依据运行环境解析 artifact 请求地址。
 *
 * 浏览器端始终请求与页面同源的静态路径（dev 由 serve-artifacts 中间件提供，
 * 线上由 GitHub Pages 提供），不依赖 raw.githubusercontent.com——该域名在部分
 * 网络环境下不可达，曾导致线上"刷新快照"的接口请求整体失效。
 * 仅 SSR/构建期（无 location）回退到 DEFAULT_ARTIFACT_URL。
 */
export function resolveArtifactUrl(env: Record<string, string | undefined>): string {
	const configured = env.VITE_GITHUB_TODO_ARTIFACT_URL?.trim();
	if (configured) return configured;
	if (typeof location !== "undefined") {
		const base = (env.BASE_URL ?? "/").replace(/\/+$/, "");
		return `${base}/${ARTIFACT_PUBLIC_PATH}`;
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
