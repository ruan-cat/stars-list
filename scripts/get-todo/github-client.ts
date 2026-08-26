import { ofetch, type FetchOptions } from "ofetch";

import type { Visibility } from "./types.ts";

const API_BASE_URL = "https://api.github.com";
const API_VERSION = "2022-11-28";
const PAGE_SIZE = 100;

export interface GitHubRepository {
	name: string;
	full_name: string;
	private: boolean;
	fork?: boolean;
	archived?: boolean;
	default_branch: string;
	language?: string | null;
}

export interface GitTreeEntry {
	path: string;
	mode: string;
	type: "blob" | "tree" | "commit";
	sha: string;
	size?: number;
	url?: string;
}

export interface GitTreeResponse {
	sha: string;
	url: string;
	tree: GitTreeEntry[];
	truncated: boolean;
}

export interface GitBlobResponse {
	content: string;
	encoding: "base64" | "utf-8";
	sha: string;
	size: number;
}

export class GitHubHttpError extends Error {
	public readonly status: number;

	public constructor(status: number, message: string) {
		super(`GitHub request failed with status ${status}: ${message}`);
		this.name = "GitHubHttpError";
		this.status = status;
	}
}

export interface GitHubClientOptions {
	token?: string;
	apiBaseUrl?: string;
	requester?: (path: string, options?: FetchOptions) => Promise<{ data: unknown; headers: Headers }>;
	maxRetries?: number;
	sleep?: (milliseconds: number) => Promise<void>;
	timeout?: number;
}

export interface GitHubClient {
	getJson<T>(path: string, options?: FetchOptions): Promise<T>;
	listOwnedRepositories(owner: string): Promise<GitHubRepository[]>;
	branchExists(fullName: string, branch: string): Promise<boolean>;
	selectBranch(fullName: string): Promise<string | null>;
	getRecursiveTree(fullName: string, branch: string): Promise<GitTreeResponse>;
	getTree(fullName: string, treeSha: string): Promise<GitTreeResponse>;
	getBlobText(fullName: string, sha: string): Promise<{ content: string; size: number; sha: string }>;
}

function parseRetryDelay(error: unknown, attempt: number): number {
	const response = (error as { response?: Response })?.response;
	const retryAfter = response?.headers.get("retry-after");
	if (retryAfter) {
		const seconds = Number(retryAfter);
		if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
	}
	return Math.min(30_000, 500 * 2 ** attempt);
}

function getStatus(error: unknown): number | null {
	const status = (error as { response?: { status?: number } })?.response?.status;
	return typeof status === "number" ? status : null;
}

function toSafeError(error: unknown): GitHubHttpError {
	const status = getStatus(error) ?? 0;
	return new GitHubHttpError(status, status === 0 ? "network error" : "request rejected");
}

/** 创建 GitHub REST API 客户端。 */
export function createGitHubClient(options: GitHubClientOptions = {}): GitHubClient {
	const maxRetries = options.maxRetries ?? 3;
	const sleep =
		options.sleep ?? ((milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));
	const headers: Record<string, string> = {
		Accept: "application/vnd.github+json",
		"X-GitHub-Api-Version": API_VERSION,
		"User-Agent": "ruan-cat-stars-list-todo-scanner",
	};
	if (options.token) headers.Authorization = `Bearer ${options.token}`;
	const client = ofetch.create({
		baseURL: options.apiBaseUrl ?? API_BASE_URL,
		headers,
		timeout: options.timeout ?? 20_000,
	});
	const requestRaw = async <T>(
		path: string,
		requestOptions: FetchOptions = {},
	): Promise<{ data: T; headers: Headers }> => {
		if (options.requester) return (await options.requester(path, requestOptions)) as { data: T; headers: Headers };
		const response = await client.raw<T>(path, { ...requestOptions, retry: 0 } as never);
		return { data: response._data as T, headers: response.headers };
	};

	async function requestWithRetry<T>(
		path: string,
		requestOptions: FetchOptions = {},
	): Promise<{ data: T; headers: Headers }> {
		for (let attempt = 0; ; attempt += 1) {
			try {
				return await requestRaw<T>(path, requestOptions);
			} catch (error) {
				const status = getStatus(error);
				if ((status === 403 || status === 429) && attempt < maxRetries) {
					await sleep(parseRetryDelay(error, attempt));
					continue;
				}
				throw toSafeError(error);
			}
		}
	}

	async function getJson<T>(path: string, requestOptions: FetchOptions = {}): Promise<T> {
		return (await requestWithRetry<T>(path, requestOptions)).data;
	}

	async function listOwnedRepositories(owner: string): Promise<GitHubRepository[]> {
		const repositories: GitHubRepository[] = [];
		for (let page = 1; ; page += 1) {
			const endpoint = options.token
				? `/user/repos?per_page=${PAGE_SIZE}&affiliation=owner&sort=full_name&page=${page}`
				: `/users/${encodeURIComponent(owner)}/repos?type=owner&per_page=${PAGE_SIZE}&sort=full_name&page=${page}`;
			const response = await requestWithRetry<GitHubRepository[]>(endpoint, {
				retry: 0,
			});
			repositories.push(...(response.data ?? []));
			const link = response.headers.get("link") ?? "";
			if (!/rel="next"/.test(link)) break;
		}
		return repositories.filter((repository) =>
			repository.full_name.toLowerCase().startsWith(`${owner.toLowerCase()}/`),
		);
	}

	async function branchExists(fullName: string, branch: string): Promise<boolean> {
		try {
			await getJson(`/repos/${fullName}/branches/${encodeURIComponent(branch)}`);
			return true;
		} catch (error) {
			if (error instanceof GitHubHttpError && error.status === 404) return false;
			throw error;
		}
	}

	async function selectBranch(fullName: string): Promise<string | null> {
		try {
			const branches = await getJson<Array<{ name: string }>>(`/repos/${fullName}/branches?per_page=100`);
			const names = new Set(branches.map((branch) => branch.name));
			return ["dev", "main", "master"].find((branch) => names.has(branch)) ?? null;
		} catch (error) {
			if (error instanceof GitHubHttpError && error.status === 404) return null;
			throw error;
		}
	}

	async function getRecursiveTree(fullName: string, branch: string): Promise<GitTreeResponse> {
		return getJson<GitTreeResponse>(`/repos/${fullName}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
	}

	async function getTree(fullName: string, treeSha: string): Promise<GitTreeResponse> {
		return getJson<GitTreeResponse>(`/repos/${fullName}/git/trees/${encodeURIComponent(treeSha)}`);
	}

	async function getBlobText(fullName: string, sha: string): Promise<{ content: string; size: number; sha: string }> {
		const blob = await getJson<GitBlobResponse>(`/repos/${fullName}/git/blobs/${encodeURIComponent(sha)}`);
		const content =
			blob.encoding === "base64"
				? Buffer.from(blob.content.replace(/\s/g, ""), "base64").toString("utf8")
				: blob.content;
		return { content, size: blob.size, sha: blob.sha };
	}

	return { getJson, listOwnedRepositories, branchExists, selectBranch, getRecursiveTree, getTree, getBlobText };
}

export function visibilityOf(repository: GitHubRepository): Visibility {
	return repository.private ? "private" : "public";
}
