import {
	setUserConfig,
	setGenerateSidebar,
	addChangelog2doc,
	copyReadmeMd,
} from "@ruan-cat/vitepress-preset-config/config";

import { description } from "../../package.json";
import { splitTopics } from "../split-topics";
import { adjustTitleFormat } from "../adjust-title-format";
import { shouldGenerateDerivedDocs } from "../derived-docs";
import { escapeVueInterpolations } from "../escape-vue-interpolations";

if (shouldGenerateDerivedDocs(process.env)) {
	// 为文档添加自动生成的changelog
	addChangelog2doc({ target: "./docs" });
	// 将 README.md 文件移动到指定要求的位置内，并重命名为 index.md
	copyReadmeMd("./docs");
	// 调整标题格式并拆分 topics 文件
	adjustTitleFormat();
	splitTopics();
}

const userConfig = setUserConfig(
	{
		title: "阮喵喵的github star列表",
		description,
		themeConfig: {
			editLink: { pattern: "https://github.com/ruan-cat/stars-list/blob/dev/docs/:path" },
			socialLinks: [{ icon: "github", link: "https://github.com/ruan-cat/stars-list" }],
		},
	},
	{
		plugins: {
			llmstxt: {
				// 忽略首页复制粘贴的 README.md 内容
				ignoreFiles: ["index.md"],
			},
		},
	},
);

// TODO Explorer 是应用型页面，不需要文档页的 Copy/Download 工具条。
// preset 会在默认 markdown.config 中注入该组件；在保留其他 markdown 插件的前提下，
// 只针对 todos.md 的渲染结果移除这一个注入节点。
const defaultMarkdownConfig = userConfig.markdown?.config;
if (defaultMarkdownConfig) {
	userConfig.markdown = {
		...userConfig.markdown,
		config(md) {
			defaultMarkdownConfig(md);
			const render = md.renderer.render.bind(md.renderer);
			md.renderer.render = (tokens, options, env) => {
				const html = render(tokens, options, env);
				if (env?.relativePath === "todos.md") {
					return html.replace(/<CopyOrDownloadAsMarkdownButtons\s*\/>/g, "");
				}
				if (env?.relativePath === "prompts/index.md") return escapeVueInterpolations(html);
				return html;
			};
		},
	};
}

// @ts-ignore
userConfig.themeConfig.sidebar = setGenerateSidebar({
	documentRootPath: "./docs",
});

export default userConfig;
