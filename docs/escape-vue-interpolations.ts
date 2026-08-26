/** 将提示归档中的 Vue moustache 文本保留为字面量，避免 SSR 求值。 */
export function escapeVueInterpolations(html: string): string {
	return html.replaceAll("{{", "&#123;&#123;").replaceAll("}}", "&#125;&#125;");
}
