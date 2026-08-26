/** GitHub TODO 扫描器的共享数据类型。 */

export type Visibility = "public" | "private";

export type TodoKind =
	| "markdown-heading"
	| "markdown-inline"
	| "markdown-standalone"
	| "source-comment"
	| "unresolved_empty_todo";

export interface ParseTodoInput {
	path: string;
	content: string;
	sha: string;
	branch: string;
	repo: string;
	visibility: Visibility;
	language: string | null;
	htmlUrl: string;
}

export interface TodoMatch {
	id: string;
	repo: string;
	path: string;
	branch: string;
	line: number;
	kind: TodoKind;
	text: string;
	todoAnnotation: string;
	rawLine: string;
	sha: string;
	htmlUrl: string;
	visibility: Visibility;
	language: string | null;
	source?: "api" | "degit" | "git-fallback";
	commitSha?: string;
	manifestStale?: boolean;
	cacheStatus?: "hit" | "miss" | "fallback";
	fork?: boolean;
}

export interface ParseResult {
	matches: TodoMatch[];
}

export type AuthMode = "authenticated" | "public-only";
export type Completeness = "complete" | "partial" | "failed";
export type RepositoryStatus = "scanned" | "unauthorized" | "branch_unavailable" | "failed" | "skipped";

export interface RepositoryScan {
	fullName: string;
	visibility: Visibility;
	selectedBranch: string | null;
	status: RepositoryStatus;
	todoCount: number;
	errors: string[];
	fork?: boolean;
	archived?: boolean;
	commitSha?: string | null;
	source?: "degit" | "git-fallback";
	cacheStatus?: "hit" | "miss" | "fallback";
	skipReason?: "fork";
}

export interface TodoScanArtifact {
	schemaVersion: 1;
	generatedAt: string;
	scan: {
		owner: string;
		repositoryScope: "owner";
		branchStrategy: string[];
		authMode: AuthMode;
		transport?: "api" | "degit";
		manifestStale?: boolean;
		completeness: Completeness;
		extensions: string[];
		maxFileBytes: number;
	};
	summary: {
		repositoryCount: number;
		scannedRepositoryCount: number;
		todoCount: number;
		unresolvedEmptyTodoCount: number;
		skippedFileCount: number;
		errorCount: number;
	};
	repositories: RepositoryScan[];
	todos: TodoMatch[];
	errors: string[];
}

export type ManifestSource = "github-api" | "manual" | "cache";

export interface ManifestRepository {
	fullName: string;
	visibility: Visibility;
	fork: boolean;
	archived: boolean;
	selectedBranch: string | null;
	lastKnownCommitSha: string | null;
	lastFetchedAt: string | null;
}

export interface RepositoryManifest {
	schemaVersion: 1;
	owner: string;
	generatedAt: string;
	source: ManifestSource;
	manifestStale: boolean;
	repositories: ManifestRepository[];
}
