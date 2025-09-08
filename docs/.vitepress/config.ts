import {
	setUserConfig,
	setGenerateSidebar,
	addChangelog2doc,
	copyReadmeMd,
} from "@ruan-cat/vitepress-preset-config/config";

import { description } from "../../package.json";

// 为文档添加自动生成的changelog
addChangelog2doc({
	// 设置changelog的目标文件夹
	target: "./docs",
	// 设置changelog顶部的yaml数据。通常是排序
	data: {
		order: 1000,
		dir: {
			order: 1000,
		},
	},
});

// 将 README.md 文件移动到指定要求的位置内，并重命名为 index.md
copyReadmeMd("./docs");

const userConfig = setUserConfig(
	{
		title: "阮喵喵的github star列表",
		description,
		/**
		 * 设置base路径，用于部署到github pages时，设置正确的访问路径
		 * TODO: 在 @ruan-cat/vitepress-preset-config/config 内，实现自动设置base路径。根据包名来实现拆分设置。
		 * 判断当前环境是否在github actions内，如果是，则设置为 /stars-list/ 。
		 */
		base: "/stars-list/",
		themeConfig: {},
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

// @ts-ignore
userConfig.themeConfig.sidebar = setGenerateSidebar({
	documentRootPath: "./docs",
});

export default userConfig;
