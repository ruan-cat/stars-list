/**
 * @fileoverview 调整标题格式的脚本
 * 将 docs/topics/index.md 中的一级标题格式进行调整，将徽章移到下一行
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { consola } from "consola";

// 获取包信息
import { name as packageName, version as packageVersion } from "../package.json";

const logger = consola.withTag(packageName);

const SOURCE_FILE = join(process.cwd(), "./docs/topics/index.md");

/**
 * 主函数：调整标题格式
 * 读取源文件，将一级标题中的徽章移到下一行，并保留空行
 * @example
 * adjustTitleFormat();
 */
export function adjustTitleFormat(): void {
	logger.info(`${packageName} v${packageVersion} adjustTitleFormat is running...`);

	try {
		// 读取源文件内容
		logger.info(`Reading file: ${SOURCE_FILE}`);
		const content = readFileSync(SOURCE_FILE, "utf-8");

		// 调整标题格式
		const adjustedContent = adjustTitle(content);

		// 如果内容有变化，写入文件
		if (adjustedContent !== content) {
			writeFileSync(SOURCE_FILE, adjustedContent, "utf-8");
			logger.success("Successfully adjusted title format");
		} else {
			logger.info("Title format is already correct, no changes needed");
		}
	} catch (error) {
		logger.error("Failed to adjust title format:", error);
		throw error;
	}
}

/**
 * 调整标题格式
 * @param content - markdown 文件内容
 * @returns 调整后的内容
 */
function adjustTitle(content: string): string {
	// 匹配一级标题和徽章（考虑可能有注释行在前）
	const titlePattern = /^(#\s+Awesome Stars)\s+(\[!\[Awesome\]\(https:\/\/awesome\.re\/badge\.svg\)\]\(https:\/\/github\.com\/sindresorhus\/awesome\))/m;

	// 检查是否匹配
	const match = content.match(titlePattern);
	if (match) {
		logger.info("Found title pattern, adjusting format...");
		return content.replace(titlePattern, "$1\n\n$2");
	}

	logger.info("Title pattern not found");
	return content;
}

// 如果直接运行此文件，执行调整操作
if (import.meta.url === `file://${process.argv[1]}`) {
	adjustTitleFormat();
}