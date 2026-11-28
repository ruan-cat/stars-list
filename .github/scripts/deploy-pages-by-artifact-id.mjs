/**
 * 用 upload-pages-artifact 返回的 artifact id 创建 GitHub Pages deployment。
 *
 * actions/deploy-pages 通过 ListArtifacts 按名称查找 github-pages。
 * 产物刚刚 finalized 时，这个列举会间歇性返回 0 条；按 id 读取同一产物是稳定的。
 * 状态轮询与 actions/deploy-pages v5 的 deployment.js 对齐，成功状态只有 succeed。
 */

import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const FINAL_DEPLOYMENT_STATUS = {
	deployment_failed: "Pages deployment 进入终态 deployment_failed。",
	deployment_content_failed:
		"产物无法部署。确认站点不含硬链接、符号链接，且总体积小于 10GB。（deployment_content_failed）",
	deployment_cancelled: "Pages deployment 已取消。（deployment_cancelled）",
	deployment_lost: "Pages deployment 没有回报最终状态。（deployment_lost）",
};

const TEMPORARY_DEPLOYMENT_STATUS = {
	unknown_status: "暂时无法读取 deployment 状态，继续查询。（unknown_status）",
	not_found: "deployment 尚未可读，继续查询。（not_found）",
	deployment_attempt_error: "deployment 暂时失败，Pages 会自动重试，继续查询。（deployment_attempt_error）",
};

/**
 * Pages deployment 已进入不可恢复状态。
 */
export class PagesDeploymentFailed extends Error {
	/**
	 * @param {string} message 失败说明
	 */
	constructor(message) {
		super(message);
		this.name = "PagesDeploymentFailed";
	}
}

/**
 * @param {string | undefined} artifactId upload-pages-artifact 的 artifact_id 输出
 * @param {string | undefined} buildVersion 与 deploy-pages 相同，使用 GITHUB_SHA
 * @param {string | undefined} idToken OIDC token，只放进请求体
 * @returns {{ artifact_id: number, pages_build_version: string, oidc_token: string }}
 * @example buildPagesDeploymentPayload({ artifactId: "14912073506", buildVersion: "abc", idToken: "oidc" })
 */
export function buildPagesDeploymentPayload({ artifactId, buildVersion, idToken }) {
	const normalizedId = typeof artifactId === "string" ? artifactId.trim() : "";
	if (!/^[1-9]\d*$/.test(normalizedId)) {
		throw new Error(`artifact_id 必须是正整数字符串，实际收到: ${artifactId ?? ""}`);
	}
	const id = Number(normalizedId);
	if (!Number.isSafeInteger(id)) {
		throw new Error(`artifact_id 超出安全整数范围: ${normalizedId}`);
	}
	if (typeof buildVersion !== "string" || buildVersion.length === 0) {
		throw new Error("pages_build_version 为空");
	}
	if (typeof idToken !== "string" || idToken.length === 0) {
		throw new Error("OIDC token 为空");
	}
	return {
		artifact_id: id,
		pages_build_version: buildVersion,
		oidc_token: idToken,
	};
}

/**
 * @param {number | undefined} status HTTP 状态
 * @param {string | undefined} message 响应说明
 * @returns {boolean}
 * @example shouldRetryPagesCreate(404, "Not Found")
 */
export function shouldRetryPagesCreate(status, message) {
	if (status === undefined || status === 404 || status === 408 || status === 429) return true;
	if (typeof status === "number" && status >= 500) return true;
	if (status === 400 && typeof message === "string" && /artifact/i.test(message)) return true;
	return false;
}

/**
 * @param {string | undefined} status Pages deployment status
 * @returns {{ kind: "success" | "fatal" | "pending", message: string, temporary: boolean }}
 * @example classifyPagesDeploymentStatus("succeed")
 */
export function classifyPagesDeploymentStatus(status) {
	if (status === "succeed") {
		return { kind: "success", message: "Pages deployment 已成功", temporary: false };
	}
	if (typeof status === "string" && Object.hasOwn(FINAL_DEPLOYMENT_STATUS, status)) {
		return { kind: "fatal", message: FINAL_DEPLOYMENT_STATUS[status], temporary: false };
	}
	if (typeof status === "string" && Object.hasOwn(TEMPORARY_DEPLOYMENT_STATUS, status)) {
		return { kind: "pending", message: TEMPORARY_DEPLOYMENT_STATUS[status], temporary: true };
	}
	return { kind: "pending", message: `当前状态: ${status ?? "unknown"}`, temporary: false };
}

/**
 * @param {number} current 当前间隔
 * @param {number} max 上限
 * @returns {number}
 * @example nextReportingInterval(5000, 30000)
 */
export function nextReportingInterval(current, max) {
	return Math.min(Math.round(current * 1.5), max);
}

/**
 * @param {number} interval 基础间隔
 * @param {() => number} [random] 0 到 1 的随机数
 * @returns {number}
 * @example jitterInterval(5000, () => 0.5)
 */
export function jitterInterval(interval, random = Math.random) {
	const jitter = interval * 0.2;
	return Math.round(interval - jitter + random() * jitter * 2);
}

/**
 * @param {{ id?: string | number, status_url?: string } | null | undefined} deployment 创建响应
 * @param {string} buildVersion 查不到 id 时的回退
 * @returns {string}
 * @example resolveDeploymentId({ status_url: "https://api.github.com/repos/a/b/pages/deployments/99" }, "sha")
 */
export function resolveDeploymentId(deployment, buildVersion) {
	if (deployment?.id !== undefined && deployment.id !== null && String(deployment.id).length > 0) {
		return String(deployment.id);
	}
	const fromUrl = deployment?.status_url?.split("/").pop();
	if (fromUrl) return fromUrl;
	return buildVersion;
}

/**
 * @param {{ status?: number, message?: string, requestId?: string }} error 创建失败
 * @param {string} repository owner/repo
 * @returns {string}
 * @example explainPagesCreateError({ status: 403, message: "Forbidden" }, "ruan-cat/stars-list")
 */
export function explainPagesCreateError(error, repository) {
	const status = error.status;
	let message = `创建 Pages deployment 失败（HTTP ${status ?? "unknown"}）。`;
	if (error.requestId) message += ` Request ID ${error.requestId}。`;
	if (status === 400) message += ` 响应: ${error.message ?? ""}`;
	else if (status === 403) message += " 确认 GITHUB_TOKEN 有 pages: write。";
	else if (status === 404) {
		message += ` 确认已启用 GitHub Pages: https://github.com/${repository}/settings/pages`;
	} else if (typeof status === "number" && status >= 500) message += " Pages 服务端错误。";
	else if (error.message) message += ` 响应: ${error.message}`;
	return message;
}

/**
 * @param {NodeJS.ProcessEnv} env Actions 环境
 * @param {typeof fetch} fetchImpl HTTP 实现
 * @returns {Promise<string>}
 */
export async function requestActionsIdToken(env, fetchImpl) {
	const tokenUrl = env.ACTIONS_ID_TOKEN_REQUEST_URL;
	const requestToken = env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
	if (!tokenUrl || !requestToken) {
		throw new Error("缺少 OIDC 环境变量。确认 deploy job 权限包含 id-token: write。");
	}
	const response = await fetchImpl(tokenUrl, {
		headers: {
			Authorization: `bearer ${requestToken}`,
		},
	});
	if (!response.ok) {
		throw new Error(`申请 OIDC token 失败: HTTP ${response.status}`);
	}
	const body = await response.json();
	if (typeof body?.value !== "string" || body.value.length === 0) {
		throw new Error("OIDC token 响应没有 value");
	}
	return body.value;
}

/**
 * @param {object} options 轮询参数
 * @returns {Promise<{ status?: string }>}
 */
export async function waitForPagesDeployment(options) {
	const start = options.now();
	let interval = options.initialIntervalMs;
	let errorCount = 0;
	let errorInterval = 0;

	while (true) {
		await options.sleep(options.jitter(interval + errorInterval));
		try {
			const deployment = await options.getStatus(options.deploymentId);
			const classified = classifyPagesDeploymentStatus(deployment?.status);
			if (classified.kind === "success") {
				options.log(classified.message);
				return deployment;
			}
			if (classified.kind === "fatal") {
				throw new PagesDeploymentFailed(classified.message);
			}
			if (classified.temporary) options.warn(classified.message);
			else options.log(classified.message);
			errorInterval = 0;
			interval = nextReportingInterval(interval, options.maxIntervalMs);
		} catch (error) {
			if (error instanceof PagesDeploymentFailed) throw error;
			errorCount += 1;
			const message = error instanceof Error ? error.message : String(error);
			options.warn(`查询 deployment 状态失败（${errorCount}/${options.maxErrorCount}）: ${message}`);
			if (errorInterval < 15_000) errorInterval = (errorInterval << 1) | 1;
			if (errorCount >= options.maxErrorCount) {
				await cancelQuietly(options);
				throw new Error(
					`查询 Pages deployment 状态失败次数达到 ${options.maxErrorCount}，已取消 deployment ${options.deploymentId}`,
				);
			}
		}

		if (options.now() - start >= options.timeoutMs) {
			await cancelQuietly(options);
			throw new Error(`Pages deployment 超时（${options.timeoutMs} ms），已取消 deployment ${options.deploymentId}`);
		}
	}
}

/**
 * 创建 deployment，并在 id 短暂不可读时只重试创建接口。
 * @param {object} options 创建参数
 * @returns {Promise<{ pageUrl: string, deploymentId: string }>}
 */
export async function deployPagesByArtifactId(options) {
	const env = options.env;
	const fetchImpl = options.fetchImpl ?? fetch;
	const log = options.log ?? console.log;
	const warn = options.warn ?? console.warn;
	const repository = env.GITHUB_REPOSITORY ?? "";
	const [owner, repo] = repository.split("/");
	if (!owner || !repo || repository.split("/").length !== 2) {
		throw new Error(`GITHUB_REPOSITORY 无效: ${repository}`);
	}
	if (!env.GITHUB_TOKEN) throw new Error("GITHUB_TOKEN 为空");
	const api = (env.GITHUB_API_URL || "https://api.github.com").replace(/\/$/, "");

	const idToken = await requestActionsIdToken(env, fetchImpl);
	const payload = buildPagesDeploymentPayload({
		artifactId: env.ARTIFACT_ID,
		buildVersion: env.GITHUB_SHA,
		idToken,
	});
	log(`使用 artifact_id=${payload.artifact_id} 创建 Pages deployment，不按名称列举产物。`);

	const created = await createDeploymentWithRetry({
		api,
		owner,
		repo,
		repository,
		token: env.GITHUB_TOKEN,
		payload,
		fetchImpl,
		sleep: options.sleep ?? defaultSleep,
		log,
		attempts: options.createAttempts ?? 8,
	});
	const pageUrl = typeof created.page_url === "string" ? created.page_url : "";
	const deploymentId = resolveDeploymentId(created, payload.pages_build_version);
	writePageUrl(env.GITHUB_OUTPUT, pageUrl);
	log(`已创建 deployment ${deploymentId}${pageUrl ? `，page_url=${pageUrl}` : ""}`);
	options.onCreated?.({
		deploymentId,
		cancel: () => cancelPagesDeployment({ api, owner, repo, token: env.GITHUB_TOKEN, deploymentId, fetchImpl }),
	});

	await waitForPagesDeployment({
		deploymentId,
		getStatus: () => getPagesDeploymentStatus({ api, owner, repo, token: env.GITHUB_TOKEN, deploymentId, fetchImpl }),
		cancel: () => cancelPagesDeployment({ api, owner, repo, token: env.GITHUB_TOKEN, deploymentId, fetchImpl }),
		sleep: options.sleep ?? defaultSleep,
		now: options.now ?? Date.now,
		jitter: options.jitter ?? jitterInterval,
		timeoutMs: options.timeoutMs ?? 600_000,
		initialIntervalMs: options.initialIntervalMs ?? 5_000,
		maxIntervalMs: options.maxIntervalMs ?? 30_000,
		maxErrorCount: options.maxErrorCount ?? 10,
		log,
		warn,
	});

	return { pageUrl, deploymentId };
}

/**
 * @param {string} ms 毫秒
 * @returns {Promise<void>}
 */
function defaultSleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

/**
 * @param {object} options 取消参数
 * @returns {Promise<void>}
 */
async function cancelQuietly(options) {
	try {
		await options.cancel(options.deploymentId);
		options.warn(`已取消 deployment ${options.deploymentId}`);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		options.warn(`取消 deployment 失败: ${message}`);
	}
}

/**
 * @param {object} options 创建重试参数
 * @returns {Promise<Record<string, unknown>>}
 */
async function createDeploymentWithRetry(options) {
	let lastError = null;
	for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
		try {
			return await githubRequest({
				api: options.api,
				fetchImpl: options.fetchImpl,
				token: options.token,
				method: "POST",
				path: `/repos/${options.owner}/${options.repo}/pages/deployments`,
				body: options.payload,
			});
		} catch (error) {
			lastError = error;
			const status = error instanceof GitHubApiError ? error.status : undefined;
			const message = error instanceof Error ? error.message : String(error);
			if (attempt >= options.attempts || !shouldRetryPagesCreate(status, message)) break;
			const delay = Math.min(1_000 * 2 ** (attempt - 1), 10_000);
			options.log(
				`创建 deployment 暂时失败（HTTP ${status ?? "network"}），${delay} ms 后重试 ${attempt + 1}/${options.attempts}。`,
			);
			await options.sleep(delay);
		}
	}
	const explained = explainPagesCreateError(
		{
			status: lastError instanceof GitHubApiError ? lastError.status : undefined,
			message: lastError instanceof Error ? lastError.message : String(lastError),
			requestId: lastError instanceof GitHubApiError ? lastError.requestId : undefined,
		},
		options.repository,
	);
	throw new Error(explained);
}

/**
 * @param {object} options 状态查询参数
 * @returns {Promise<Record<string, unknown>>}
 */
function getPagesDeploymentStatus(options) {
	return githubRequest({
		api: options.api,
		fetchImpl: options.fetchImpl,
		token: options.token,
		method: "GET",
		path: `/repos/${options.owner}/${options.repo}/pages/deployments/${encodeURIComponent(options.deploymentId)}`,
	});
}

/**
 * @param {object} options 取消参数
 * @returns {Promise<Record<string, unknown>>}
 */
function cancelPagesDeployment(options) {
	return githubRequest({
		api: options.api,
		fetchImpl: options.fetchImpl,
		token: options.token,
		method: "POST",
		path: `/repos/${options.owner}/${options.repo}/pages/deployments/${encodeURIComponent(options.deploymentId)}/cancel`,
	});
}

/**
 * GitHub API 非 2xx 响应。
 */
class GitHubApiError extends Error {
	/**
	 * @param {string} message 响应说明
	 * @param {number} status HTTP 状态
	 * @param {string | undefined} requestId 请求 id
	 */
	constructor(message, status, requestId) {
		super(message);
		this.name = "GitHubApiError";
		this.status = status;
		this.requestId = requestId;
	}
}

/**
 * @param {object} options 请求参数
 * @returns {Promise<Record<string, unknown>>}
 */
async function githubRequest(options) {
	const api = options.api ?? "https://api.github.com";
	const response = await options.fetchImpl(`${api}${options.path}`, {
		method: options.method,
		headers: {
			Accept: "application/vnd.github+json",
			Authorization: `Bearer ${options.token}`,
			"Content-Type": "application/json",
			"User-Agent": "stars-list-pages-deploy",
			"X-GitHub-Api-Version": "2022-11-28",
		},
		body: options.body ? JSON.stringify(options.body) : undefined,
	});
	const text = await response.text();
	let data = {};
	if (text) {
		try {
			data = JSON.parse(text);
		} catch {
			data = { message: text };
		}
	}
	if (!response.ok) {
		const message = typeof data.message === "string" ? data.message : `GitHub API HTTP ${response.status}`;
		throw new GitHubApiError(message, response.status, response.headers.get("x-github-request-id") ?? undefined);
	}
	return data;
}

/**
 * @param {string | undefined} outputPath GITHUB_OUTPUT
 * @param {string} pageUrl 部署地址
 */
function writePageUrl(outputPath, pageUrl) {
	if (!outputPath || pageUrl.length === 0) return;
	appendFileSync(outputPath, `page_url=${pageUrl}\n`);
}

/**
 * @returns {boolean}
 */
function isDirectRun() {
	const entry = process.argv[1];
	if (!entry) return false;
	return import.meta.url === pathToFileURL(entry).href;
}

if (isDirectRun()) {
	let cancelActive = null;
	const stop = () => {
		const cancel = cancelActive;
		if (!cancel) {
			process.exit(1);
		}
		cancel()
			.catch((error) => {
				console.error(error instanceof Error ? error.message : error);
			})
			.finally(() => {
				process.exit(1);
			});
	};
	process.once("SIGINT", stop);
	process.once("SIGTERM", stop);

	deployPagesByArtifactId({
		env: process.env,
		onCreated({ cancel }) {
			cancelActive = cancel;
		},
	}).catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	});
}
