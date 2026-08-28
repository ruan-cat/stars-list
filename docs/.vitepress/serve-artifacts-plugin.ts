import { readFile } from "node:fs/promises";
import { join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";

/** 仓库根目录 artifacts 目录的绝对路径 */
const artifactsRoot = fileURLToPath(new URL("../../artifacts", import.meta.url));

const MIME_TYPES: Record<string, string> = {
	".json": "application/json; charset=utf-8",
	".md": "text/markdown; charset=utf-8",
	".txt": "text/plain; charset=utf-8",
};

/**
 * 提供 /artifacts/** 本地静态文件的中间件。
 *
 * VitePress 的 dev/preview 服务器只服务 docs 目录，仓库根目录 artifacts 不可达，
 * 导致页面在 localhost 下按 resolveArtifactUrl 请求 /artifacts/github-todos/ruan-cat.json 时 404。
 * 生产环境 artifact 由 raw.githubusercontent.com 提供，本插件仅覆盖本地开发与预览。
 */
async function artifactsRequestHandler(req: IncomingMessage, res: ServerResponse, next: () => void): Promise<void> {
	const url = req.url ?? "";
	if (!url.startsWith("/artifacts/")) {
		next();
		return;
	}
	const relativePath = decodeURIComponent(url.slice("/artifacts/".length).split("?")[0]);
	const filePath = normalize(join(artifactsRoot, relativePath));
	if (!filePath.startsWith(artifactsRoot + sep)) {
		res.statusCode = 403;
		res.end("Forbidden");
		return;
	}
	try {
		const data = await readFile(filePath);
		const extension = relativePath.slice(relativePath.lastIndexOf("."));
		res.setHeader("content-type", MIME_TYPES[extension] ?? "application/octet-stream");
		res.setHeader("cache-control", "no-store");
		res.statusCode = 200;
		res.end(data);
	} catch {
		res.statusCode = 404;
		res.end(`artifact not found: ${relativePath}`);
	}
}

/** 在本地 dev 与 preview 服务器上注册 artifacts 静态文件服务 */
export function serveArtifacts(): Plugin {
	return {
		name: "serve-local-artifacts",
		configureServer(server) {
			server.middlewares.use(artifactsRequestHandler);
		},
		configurePreviewServer(server) {
			server.middlewares.use(artifactsRequestHandler);
		},
	};
}
