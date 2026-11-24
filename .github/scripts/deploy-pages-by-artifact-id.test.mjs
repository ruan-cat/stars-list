import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
	buildPagesDeploymentPayload,
	classifyPagesDeploymentStatus,
	deployPagesByArtifactId,
	explainPagesCreateError,
	jitterInterval,
	nextReportingInterval,
	PagesDeploymentFailed,
	requestActionsIdToken,
	resolveDeploymentId,
	shouldRetryPagesCreate,
	waitForPagesDeployment,
} from "./deploy-pages-by-artifact-id.mjs";

test("payload 使用 upload 返回的 artifact id，拒绝名称列举所需的空值", () => {
	const payload = buildPagesDeploymentPayload({
		artifactId: "14912073506",
		buildVersion: "8c47faa10fedb27b925dafb737b93d05f9d1f6ce",
		idToken: "oidc-token",
	});
	assert.equal(payload.artifact_id, 14912073506);
	assert.equal(payload.pages_build_version, "8c47faa10fedb27b925dafb737b93d05f9d1f6ce");
	assert.equal(payload.oidc_token, "oidc-token");
	assert.throws(
		() => buildPagesDeploymentPayload({ artifactId: "", buildVersion: "sha", idToken: "oidc" }),
		/artifact_id/,
	);
	assert.throws(
		() => buildPagesDeploymentPayload({ artifactId: "12345678901234567890", buildVersion: "sha", idToken: "oidc" }),
		/安全整数/,
	);
});

test("创建接口只在产物暂时不可读或服务端错误时重试", () => {
	assert.equal(shouldRetryPagesCreate(404, "Not Found"), true);
	assert.equal(shouldRetryPagesCreate(500, "oops"), true);
	assert.equal(shouldRetryPagesCreate(undefined, "socket hang up"), true);
	assert.equal(shouldRetryPagesCreate(429, "rate limit"), true);
	assert.equal(shouldRetryPagesCreate(400, "No artifact found"), true);
	assert.equal(shouldRetryPagesCreate(400, "bad request"), false);
	assert.equal(shouldRetryPagesCreate(403, "Forbidden"), false);
});

test("状态机只把 succeed 当成功，终态不再轮询", () => {
	assert.equal(classifyPagesDeploymentStatus("succeed").kind, "success");
	assert.equal(classifyPagesDeploymentStatus("success").kind, "pending");
	assert.equal(classifyPagesDeploymentStatus("deployment_failed").kind, "fatal");
	assert.equal(classifyPagesDeploymentStatus("queued").kind, "pending");
	assert.equal(classifyPagesDeploymentStatus("deployment_attempt_error").temporary, true);
});

test("deployment id 优先取响应 id", () => {
	assert.equal(resolveDeploymentId({ id: 99, status_url: "https://api.github.com/x/100" }, "sha"), "99");
	assert.equal(
		resolveDeploymentId({ status_url: "https://api.github.com/repos/a/b/pages/deployments/100" }, "sha"),
		"100",
	);
	assert.equal(resolveDeploymentId({}, "sha"), "sha");
});

test("创建失败说明带权限和 Pages 设置入口", () => {
	assert.match(
		explainPagesCreateError({ status: 403, message: "Forbidden", requestId: "ABCD" }, "ruan-cat/stars-list"),
		/pages: write/,
	);
	assert.match(
		explainPagesCreateError({ status: 404, message: "Not Found" }, "ruan-cat/stars-list"),
		/settings\/pages/,
	);
});

test("网络错误后仍用同一个 artifact id 创建 deployment", async () => {
	let posts = 0;
	const result = await deployPagesByArtifactId({
		env: {
			ARTIFACT_ID: "14912073506",
			GITHUB_SHA: "8c47faa10fedb27b925dafb737b93d05f9d1f6ce",
			GITHUB_REPOSITORY: "ruan-cat/stars-list",
			GITHUB_TOKEN: "ghs-test",
			ACTIONS_ID_TOKEN_REQUEST_URL: "https://example.test/token",
			ACTIONS_ID_TOKEN_REQUEST_TOKEN: "request-token",
		},
		fetchImpl: async (url, init) => {
			if (String(url) === "https://example.test/token") {
				return { ok: true, status: 200, json: async () => ({ value: "oidc-token" }) };
			}
			if (init.method === "POST" && String(url).endsWith("/pages/deployments")) {
				posts += 1;
				if (posts === 1) throw new Error("socket hang up");
				return {
					ok: true,
					status: 200,
					headers: { get: () => null },
					text: async () => JSON.stringify({ id: "77", page_url: "https://ruan-cat.github.io/stars-list" }),
				};
			}
			return {
				ok: true,
				status: 200,
				headers: { get: () => null },
				text: async () => JSON.stringify({ status: "succeed" }),
			};
		},
		sleep: async () => {},
		now: () => 0,
		jitter: (interval) => interval,
		timeoutMs: 60_000,
		initialIntervalMs: 1,
		maxIntervalMs: 1,
		maxErrorCount: 2,
		createAttempts: 2,
		log: () => {},
		warn: () => {},
	});
	assert.equal(posts, 2);
	assert.equal(result.deploymentId, "77");
});

test("OIDC 请求不附加 audience，与 deploy-pages 的 getIDToken() 一致", async () => {
	const calls = [];
	const token = await requestActionsIdToken(
		{
			ACTIONS_ID_TOKEN_REQUEST_URL: "https://example.test/token",
			ACTIONS_ID_TOKEN_REQUEST_TOKEN: "request-token",
		},
		async (url, init) => {
			calls.push({ url: String(url), authorization: init.headers.Authorization });
			return {
				ok: true,
				json: async () => ({ value: "oidc-token" }),
			};
		},
	);
	assert.equal(token, "oidc-token");
	assert.equal(calls[0].url, "https://example.test/token");
	assert.equal(calls[0].authorization, "bearer request-token");
});

test("轮询在 queued 之后收到 succeed 即返回，不取消 deployment", async () => {
	const statuses = ["queued", "succeed"];
	let cancelled = false;
	const result = await waitForPagesDeployment({
		deploymentId: "99",
		getStatus: async () => ({ status: statuses.shift() }),
		cancel: async () => {
			cancelled = true;
		},
		sleep: async () => {},
		now: () => 0,
		jitter: (interval) => interval,
		timeoutMs: 60_000,
		initialIntervalMs: 1,
		maxIntervalMs: 10,
		maxErrorCount: 3,
		log: () => {},
		warn: () => {},
	});
	assert.equal(result.status, "succeed");
	assert.equal(cancelled, false);
});

test("终态失败直接抛出，不把 deployment 取消掉", async () => {
	await assert.rejects(
		() =>
			waitForPagesDeployment({
				deploymentId: "99",
				getStatus: async () => ({ status: "deployment_content_failed" }),
				cancel: async () => {
					throw new Error("不应取消");
				},
				sleep: async () => {},
				now: () => 0,
				jitter: (interval) => interval,
				timeoutMs: 60_000,
				initialIntervalMs: 1,
				maxIntervalMs: 10,
				maxErrorCount: 3,
				log: () => {},
				warn: () => {},
			}),
		(error) => error instanceof PagesDeploymentFailed && /10GB/.test(error.message),
	);
});

test("超时后取消 deployment", async () => {
	let clock = 0;
	let cancelled = 0;
	await assert.rejects(
		() =>
			waitForPagesDeployment({
				deploymentId: "99",
				getStatus: async () => ({ status: "queued" }),
				cancel: async () => {
					cancelled += 1;
				},
				sleep: async (ms) => {
					clock += ms;
				},
				now: () => clock,
				jitter: (interval) => interval,
				timeoutMs: 10,
				initialIntervalMs: 6,
				maxIntervalMs: 6,
				maxErrorCount: 5,
				log: () => {},
				warn: () => {},
			}),
		/超时/,
	);
	assert.equal(cancelled, 1);
});

test("部署请求把 artifact id 交给 Pages API，不调用 ListArtifacts", async () => {
	const calls = [];
	const output = join(mkdtempSync(join(tmpdir(), "pages-deploy-")), "output.txt");
	let statusReads = 0;
	const result = await deployPagesByArtifactId({
		env: {
			ARTIFACT_ID: "14912073506",
			GITHUB_SHA: "8c47faa10fedb27b925dafb737b93d05f9d1f6ce",
			GITHUB_REPOSITORY: "ruan-cat/stars-list",
			GITHUB_TOKEN: "ghs-test",
			GITHUB_OUTPUT: output,
			ACTIONS_ID_TOKEN_REQUEST_URL: "https://example.test/token",
			ACTIONS_ID_TOKEN_REQUEST_TOKEN: "request-token",
		},
		fetchImpl: async (url, init) => {
			const href = String(url);
			calls.push({ href, method: init.method, body: init.body });
			if (href === "https://example.test/token") {
				return { ok: true, status: 200, json: async () => ({ value: "oidc-token" }), text: async () => "" };
			}
			if (init.method === "POST" && href.endsWith("/pages/deployments")) {
				return {
					ok: true,
					status: 200,
					headers: { get: () => null },
					text: async () => JSON.stringify({ id: "77", page_url: "https://ruan-cat.github.io/stars-list" }),
				};
			}
			statusReads += 1;
			return {
				ok: true,
				status: 200,
				headers: { get: () => null },
				text: async () => JSON.stringify({ status: statusReads === 1 ? "queued" : "succeed" }),
			};
		},
		sleep: async () => {},
		now: () => 0,
		jitter: (interval) => interval,
		timeoutMs: 60_000,
		initialIntervalMs: 1,
		maxIntervalMs: 1,
		maxErrorCount: 3,
		createAttempts: 2,
		log: () => {},
		warn: () => {},
	});

	assert.equal(result.deploymentId, "77");
	assert.equal(result.pageUrl, "https://ruan-cat.github.io/stars-list");
	assert.equal(readFileSync(output, "utf8"), "page_url=https://ruan-cat.github.io/stars-list\n");
	const deploymentCall = calls.find((call) => call.method === "POST" && call.href.endsWith("/pages/deployments"));
	const body = JSON.parse(deploymentCall.body);
	assert.equal(body.artifact_id, 14912073506);
	assert.equal(body.pages_build_version, "8c47faa10fedb27b925dafb737b93d05f9d1f6ce");
	assert.equal(body.oidc_token, "oidc-token");
	assert.equal(
		calls.some((call) => call.href.includes("ListArtifacts") || call.href.includes("/actions/artifacts")),
		false,
	);
});

test("间隔计算保持 deploy-pages 的退避和抖动边界", () => {
	assert.equal(nextReportingInterval(5000, 30000), 7500);
	assert.equal(nextReportingInterval(25000, 30000), 30000);
	assert.equal(
		jitterInterval(5000, () => 0),
		4000,
	);
	assert.equal(
		jitterInterval(5000, () => 1),
		6000,
	);
});
