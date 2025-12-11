/**
 * @fileoverview 自动拆分 topics 文件的脚本
 * 将 docs/topics/index.md 中的每个二级标题拆分为单独的 markdown 文件
 * 用于改善 VitePress 导航结构和用户体验
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { consola } from "consola";

// 获取包信息
import { name as packageName, version as packageVersion } from "../package.json";

const logger = consola.withTag(packageName);

const SOURCE_FILE = "./docs/topics/index.md";
const OUTPUT_DIR = "./docs/topics";
const EXCLUDED_HEADINGS = ["Contents", "License"];

/**
 * 主函数：拆分 topics 文件
 * 读取源文件，提取每个二级标题并生成单独的 markdown 文件
 * @example
 * splitTopics();
 */
export function splitTopics(): void {
	logger.info(`${packageName} v${packageVersion} splitTopics is running...`);

	try {
		// 读取源文件内容
		const content = readFileSync(SOURCE_FILE, 'utf-8');

		// 提取所有二级标题
		const headings = extractHeadings(content);
		logger.info(`Found ${headings.length} headings in total`);

		// 确保输出目录存在
		ensureDirectory(OUTPUT_DIR);

		// 处理每个标题
		let processedCount = 0;
		for (const heading of headings) {
			if (isExcluded(heading.title)) {
				logger.debug(`Skipping excluded heading: ${heading.title}`);
				continue;
			}

			// 提取标题下的内容
			const sectionContent = extractContent(content, heading);
			if (!sectionContent) {
				logger.warn(`No content found for heading: ${heading.title}`);
				continue;
			}

			// 格式化标题
			const formattedTitle = formatTitle(heading.title);

			// 生成文件名
			const filename = `${heading.anchor}.md`;
			const filepath = join(OUTPUT_DIR, filename);

			// 写入文件
			const fileContent = `# ${formattedTitle}\n\n${sectionContent}`;
			writeFileSync(filepath, fileContent, 'utf-8');

			processedCount++;
			logger.success(`Created: ${filename}`);
		}

		logger.success(`Successfully created ${processedCount} topic files`);
	} catch (error) {
		logger.error('Failed to split topics:', error);
		throw error;
	}
}

/**
 * 提取所有二级标题
 * @param content - markdown 文件内容
 * @returns 标题信息数组
 */
function extractHeadings(content: string): Array<{ title: string; anchor: string; lineIndex: number }> {
	const headings: Array<{ title: string; anchor: string; lineIndex: number }> = [];
	const lines = content.split('\n');

	lines.forEach((line, index) => {
		// 匹配二级标题: ## Title
		const match = line.match(/^##\s+(.+)$/);
		if (match) {
			const title = match[1].trim();
			const anchor = title.toLowerCase().replace(/\s+/g, '-');
			headings.push({ title, anchor, lineIndex: index });
		}
	});

	return headings;
}

/**
 * 提取标题下的内容
 * @param content - 完整文件内容
 * @param heading - 标题信息
 * @returns 标题下的内容（不包含标题本身）
 */
function extractContent(content: string, heading: { title: string; anchor: string; lineIndex: number }): string | null {
	const lines = content.split('\n');
	const startLine = heading.lineIndex + 1;

	// 查找下一个同级或更高级标题
	let endLine = lines.length;
	for (let i = startLine; i < lines.length; i++) {
		const line = lines[i];
		// 匹配 ## 或 # 开头的行（二级或一级标题）
		if (line.match(/^##\s+/) || line.match(/^#\s+/)) {
			endLine = i;
			break;
		}
	}

	// 提取内容并去除首尾空行
	const contentLines = lines.slice(startLine, endLine);
	const trimmedContent = contentLines.join('\n').trim();

	return trimmedContent || null;
}

/**
 * 格式化标题为首字母大写的格式
 * @param title - 原始标题
 * @returns 格式化后的标题
 */
function formatTitle(title: string): string {
	// 将连字符替换为空格
	const spacedTitle = title.replace(/-/g, ' ');

	// 每个单词首字母大写
	return spacedTitle.replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * 检查标题是否应该被排除
 * @param title - 标题文本
 * @returns 是否应该排除
 */
function isExcluded(title: string): boolean {
	return EXCLUDED_HEADINGS.includes(title);
}

/**
 * 确保目录存在
 * @param dirPath - 目录路径
 */
function ensureDirectory(dirPath: string): void {
	if (!existsSync(dirPath)) {
		mkdirSync(dirPath, { recursive: true });
		logger.info(`Created directory: ${dirPath}`);
	}
}

// 如果直接运行此文件，执行拆分操作
if (import.meta.url === `file://${process.argv[1]}`) {
	splitTopics();
}