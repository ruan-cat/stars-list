export interface DerivedDocsEnv {
	GITHUB_ACTIONS?: string;
	GENERATE_DERIVED_DOCS?: string;
}

/** 派生 Markdown 只在 CI 或显式请求时生成，避免本地 VitePress 启动改写工作区。 */
export function shouldGenerateDerivedDocs(env: DerivedDocsEnv): boolean {
	return env.GITHUB_ACTIONS === "true" || env.GENERATE_DERIVED_DOCS === "true";
}
