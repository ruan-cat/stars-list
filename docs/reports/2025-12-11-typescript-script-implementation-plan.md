<!-- 一次性提示词 已完成 -->

# 2025-12-11 TypeScript 脚本实施计划

## 1. 项目概述

本项目旨在创建一个 TypeScript 脚本，自动将 `docs/topics/index.md` 文件中的二级标题内容拆分为单独的 markdown 文件，以便在 VitePress 中生成更好的导航结构。

## 2. 需求分析

### 2.1 输入文件

- **文件路径**: `docs/topics/index.md`
- **文件大小**: 约 261KB
- **内容结构**: 包含多个二级标题（##）的 markdown 文件

### 2.2 输出文件

- **输出目录**: `docs/topics/`
- **文件格式**: `[topic-name].md`
- **文件结构**:

  ```markdown
  # Topic Name

  - [repo-link](url) - description
  - [repo-link](url) - description
  ```

### 2.3 排除的标题

以下两个二级标题**不应**被拆分为单独文件：

1. `## Contents` - 目录部分
2. `## License` - 许可证部分

### 2.4 标题命名规则

- 使用小写字母和连字符（如：`ai`, `ai-agents`, `data-visualization`）
- 文件名为：`[topic].md`
- 一级标题为首字母大写格式（如：`# Ai`, `# Ai Agents`, `# Data Visualization`）

## 3. 技术实现方案

### 3.1 核心算法设计

#### 3.1.1 二级标题提取

使用正则表达式匹配所有二级标题：

```typescript
const headingRegex = /^##\s+([a-z0-9-]+)\s*$/gim;
```

#### 3.1.2 内容提取逻辑

1. 按二级标题位置将文件内容分段
2. 提取每个标题后的内容（到下一个标题或文件结束）
3. 排除 "Contents" 和 "License" 标题

#### 3.1.3 文件生成流程

```plain
读取 docs/topics/index.md
  ↓
提取所有二级标题
  ↓
过滤排除标题
  ↓
遍历每个标题
  ↓
提取内容
  ↓
生成文件名
  ↓
写入 docs/topics/[name].md
```

### 3.2 脚本结构

#### 3.2.1 主要函数

```typescript
/**
 * 拆分 topics 文件的主函数
 * @example
 * splitTopics();
 */
export function splitTopics(): void {
	// 实现代码
}

/**
 * 从 markdown 内容中提取所有二级标题
 * @param content - markdown 文件内容
 * @returns 标题数组
 */
function extractHeadings(content: string): string[] {
	// 实现代码
}

/**
 * 提取指定标题下的内容
 * @param content - markdown 文件内容
 * @param heading - 目标标题
 * @returns 标题下的内容
 */
function extractContent(content: string, heading: string): string {
	// 实现代码
}

/**
 * 生成一级标题（首字母大写）
 * @param heading - 原始标题
 * @returns 格式化后的一级标题
 */
function formatTitle(heading: string): string {
	// 实现代码
}
```

#### 3.2.2 辅助函数

```typescript
/**
 * 检查是否为需要排除的标题
 * @param heading - 标题名称
 * @returns 是否需要排除
 */
function isExcluded(heading: string): boolean {
	return heading === "Contents" || heading === "License";
}

/**
 * 确保目录存在
 * @param dirPath - 目录路径
 */
function ensureDirectory(dirPath: string): void {
	// 实现代码
}
```

### 3.3 依赖管理

#### 3.3.1 现有依赖检查

```bash
# 检查 consola 是否已安装
pnpm list consola
```

#### 3.3.2 依赖安装（如需要）

```bash
# 安装 consola
pnpm add consola
```

## 4. 文件清单

### 4.1 新建文件

| 序号 | 文件路径                      | 说明                            |
| :--- | :---------------------------- | :------------------------------ |
| 1    | `docs/split-topics.ts`        | 拆分脚本主文件                  |
| 2    | `docs/topics/[topic-name].md` | 生成的 topic 文件（约 100+ 个） |

### 4.2 修改文件

| 序号 | 文件路径                    | 修改内容                                       |
| :--- | :-------------------------- | :--------------------------------------------- |
| 1    | `docs/.vitepress/config.ts` | 在 setUserConfig 调用前添加 splitTopics() 调用 |
| 2    | `package.json`              | 如有需要，添加 consola 依赖                    |

## 5. 详细实施步骤

### 5.1 步骤 1：创建拆分脚本

#### 5.1.1 创建文件

```bash
# 在 docs 目录下创建 split-topics.ts
touch docs/split-topics.ts
```

#### 5.1.2 实现代码

```typescript
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import consola from "consola";

// 获取包信息
import { name as packageName, version as packageVersion } from "../package.json";

const logger = consola.withTag(packageName);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TOPICS_DIR = resolve(__dirname, "topics");
const INDEX_FILE = resolve(__dirname, "topics", "index.md");

const EXCLUDED_HEADINGS = ["Contents", "License"];

/**
 * 拆分 topics 文件，为每个二级标题创建单独的 markdown 文件
 * @example
 * splitTopics();
 */
export function splitTopics(): void {
	logger.info(`${packageName} v${packageVersion} splitTopics is running...`);

	try {
		// 确保 topics 目录存在
		ensureDirectory(TOPICS_DIR);

		// 读取 index.md 文件
		if (!existsSync(INDEX_FILE)) {
			logger.error(`Index file not found: ${INDEX_FILE}`);
			return;
		}

		const content = readFileSync(INDEX_FILE, "utf-8");
		const headings = extractHeadings(content);

		logger.info(`Found ${headings.length} headings in total`);

		// 过滤并处理每个标题
		const validHeadings = headings.filter((heading) => !isExcluded(heading));

		logger.info(`Processing ${validHeadings.length} valid topics...`);

		for (const heading of validHeadings) {
			processTopic(content, heading);
		}

		logger.success(`Successfully created ${validHeadings.length} topic files`);
	} catch (error) {
		logger.error("Failed to split topics:", error);
	}
}

/**
 * 从 markdown 内容中提取所有二级标题
 * @param content - markdown 文件内容
 * @returns 标题数组
 */
function extractHeadings(content: string): string[] {
	const headingRegex = /^##\s+([a-z0-9-]+)\s*$/gim;
	const headings: string[] = [];
	let match: RegExpExecArray | null;

	while ((match = headingRegex.exec(content)) !== null) {
		headings.push(match[1]);
	}

	return headings;
}

/**
 * 检查是否为需要排除的标题
 * @param heading - 标题名称
 * @returns 是否需要排除
 */
function isExcluded(heading: string): boolean {
	return EXCLUDED_HEADINGS.includes(heading);
}

/**
 * 处理单个 topic，提取内容并创建文件
 * @param content - 原始 markdown 内容
 * @param heading - topic 标题
 */
function processTopic(content: string, heading: string): void {
	try {
		const topicContent = extractContent(content, heading);
		if (!topicContent) {
			logger.warn(`No content found for topic: ${heading}`);
			return;
		}

		const fileName = `${heading}.md`;
		const filePath = resolve(TOPICS_DIR, fileName);

		// 创建一级标题和内容
		const title = formatTitle(heading);
		const fileContent = `# ${title}\n\n${topicContent}\n`;

		writeFileSync(filePath, fileContent, "utf-8");
		logger.info(`Created: ${fileName}`);
	} catch (error) {
		logger.error(`Failed to process topic "${heading}":`, error);
	}
}

/**
 * 提取指定标题下的内容
 * @param content - markdown 文件内容
 * @param heading - 目标标题
 * @returns 标题下的内容
 */
function extractContent(content: string, heading: string): string {
	const headingRegex = new RegExp(`^##\\s+${heading}\\s*$`, "im");
	const nextHeadingRegex = /^##\s+[a-z0-9-]+\s*$/im;

	const headingMatch = headingRegex.exec(content);
	if (!headingMatch) {
		return "";
	}

	const startIndex = headingMatch.index + headingMatch[0].length;
	const remainingContent = content.slice(startIndex);

	// 查找下一个二级标题
	const nextMatch = nextHeadingRegex.exec(remainingContent);
	const endIndex = nextMatch ? nextMatch.index : remainingContent.length;

	// 提取内容并去除首尾空白
	return remainingContent.slice(0, endIndex).trim();
}

/**
 * 生成一级标题（首字母大写）
 * @param heading - 原始标题
 * @returns 格式化后的一级标题
 */
function formatTitle(heading: string): string {
	return heading
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
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
```

### 5.2 步骤 2：集成到 VitePress 配置

#### 5.2.1 修改 `docs/.vitepress/config.ts`

在文件顶部添加导入：

```typescript
import { splitTopics } from "../split-topics";
```

在 `setUserConfig` 调用前执行拆分：

```typescript
// 执行 topics 拆分
splitTopics();

const userConfig = setUserConfig();
// ... 现有配置
```

#### 5.2.2 完整配置示例

```typescript
import {
	setUserConfig,
	setGenerateSidebar,
	addChangelog2doc,
	copyReadmeMd,
} from "@ruan-cat/vitepress-preset-config/config";

import { description } from "../../package.json";
import { splitTopics } from "../split-topics";

// 为文档添加自动生成的changelog
addChangelog2doc({
	// 设置changelog的目标文件夹
	target: "./docs",
});

// 将 README.md 文件移动到指定要求的位置内，并重命名为 index.md
copyReadmeMd("./docs");

// 执行 topics 拆分
splitTopics();

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

// @ts-ignore
userConfig.themeConfig.sidebar = setGenerateSidebar({
	documentRootPath: "./docs",
});

export default userConfig;
```

### 5.3 步骤 3：依赖管理

#### 5.3.1 检查现有依赖

```bash
# 检查 consola 是否已安装
pnpm list consola
```

**预期输出：**

```log
✓ 查看 consola 安装状态
如果已安装，跳过安装步骤
如果未安装，执行安装命令
```

#### 5.3.2 安装依赖（如需要）

```bash
# 安装 consola 作为依赖
pnpm add consola

# 或使用开发依赖（如果在构建时执行）
pnpm add -D consola
```

#### 5.3.3 验证安装

```bash
# 验证 consola 安装
pnpm list consola
```

**预期输出：**

```log
dependencies:
consola ^3.x.x
```

### 5.4 步骤 4：测试验证

#### 5.4.1 启动开发服务器

```bash
# 启动 VitePress 开发服务器
pnpm docs:dev
```

**预期日志输出：**

```log
@ruan-cat-docs/stars-list v0.0.0 splitTopics is running...
Found 150 headings in total
Processing 148 valid topics...
Created: ai.md
Created: ai-agents.md
Created: ajax.md
...
Successfully created 148 topic files
```

#### 5.4.2 验证生成的文件

```bash
# 检查 topics 目录下生成的文件数量
ls docs/topics/ | wc -l
```

**预期输出：**

```plain
149  # 1 个 index.md + 148 个 topic 文件
```

#### 5.4.3 验证文件内容

检查生成的文件格式是否正确：

```bash
# 查看示例文件内容
head -10 docs/topics/ai.md
```

**预期输出：**

```markdown
# Ai

- [vercel/streamdown](https://github.com/vercel/streamdown) - A drop-in replacement for react-markdown, designed for AI-powered streaming.
- [AnandChowdhary/continuous-claude](https://github.com/AnandChowdhary/continuous-claude) - 🔂 Run Claude Code in a continuous loop, autonomously creating PRs, waiting for checks, and merging
  ...
```

#### 5.4.4 验证 VitePress 侧边栏

1. 打开浏览器访问 `http://localhost:5173`
2. 检查侧边栏是否正确显示所有 topics
3. 点击几个 topic 验证链接是否正常工作

## 6. 错误处理

### 6.1 可能的错误场景

| 序号 | 错误场景                          | 处理方式                     |
| :--- | :-------------------------------- | :--------------------------- |
| 1    | `docs/topics/index.md` 文件不存在 | 记录错误日志，优雅退出       |
| 2    | 文件读取权限不足                  | 捕获异常，记录错误信息       |
| 3    | 标题格式不匹配                    | 跳过该标题，继续处理其他标题 |
| 4    | 内容提取失败                      | 记录警告日志，继续执行       |
| 5    | 文件写入失败                      | 记录错误日志，跳过该 topic   |

### 6.2 日志级别

```typescript
logger.info(); // 普通信息，如处理进度
logger.success(); // 成功信息，如文件创建完成
logger.warn(); // 警告信息，如内容为空
logger.error(); // 错误信息，如文件操作失败
```

## 7. 性能考虑

### 7.1 时间复杂度

- 读取文件：O(1)
- 正则匹配：O(n)，n 为文件长度
- 内容提取：O(m)，m 为 topic 数量
- 文件写入：O(m)，每个 topic 一次写入

**总体复杂度：O(n + m)**

### 7.2 内存考虑

- 文件内容一次性读入内存（约 261KB）
- 对于当前文件大小，内存占用可忽略不计
- 如文件更大，可考虑流式读取

### 7.3 优化建议

1. **只读一次文件**：避免重复读取同一文件
2. **批量写入**：减少 I/O 操作次数（当前已实现）
3. **异步处理**：如 topic 数量巨大，可使用 Promise.all 并行处理

## 8. 维护与扩展

### 8.1 代码维护

#### 8.1.1 代码规范

- 使用 TypeScript 提供类型安全
- 添加 JSDoc 注释说明函数功能
- 遵循项目代码风格（双引号、制表符缩进）

#### 8.1.2 更新策略

- 当 `docs/topics/index.md` 更新时，重新运行脚本
- 可考虑添加 Git 钩子，在提交前自动运行

### 8.2 功能扩展

#### 8.2.1 可能的扩展方向

1. **支持三级标题拆分**：如需要更细粒度的拆分
2. **添加 frontmatter**：为每个文件添加元数据
3. **生成索引页**：自动更新 Contents 部分
4. **图片处理**：如有图片，复制到对应目录

#### 8.2.2 配置化

```typescript
// 可提取为配置对象
const config = {
	sourceFile: "docs/topics/index.md",
	outputDir: "docs/topics",
	excludedHeadings: ["Contents", "License"],
	headingLevel: 2, // 支持配置拆分级别
};
```

## 9. 相关文件

### 9.1 输入文件

- `docs/topics/index.md` - 源文件，包含所有 topics

### 9.2 输出文件

- `docs/topics/[topic-name].md` - 生成的 topic 文件

### 9.3 配置文件

- `docs/.vitepress/config.ts` - VitePress 配置
- `docs/split-topics.ts` - 拆分脚本
- `package.json` - 依赖管理

### 9.4 日志文件

- 控制台输出（使用 consola）

## 10. 执行命令汇总

```bash
# 1. 创建脚本文件
echo "Creating docs/split-topics.ts..."

# 2. 检查并安装依赖
pnpm list consola || pnpm add consola

# 3. 启动开发服务器测试
pnpm docs:dev

# 4. 构建生产版本
pnpm docs:build

# 5. 预览构建结果
pnpm docs:preview
```

## 11. 总结

本实施计划详细描述了如何创建一个 TypeScript 脚本，自动拆分 markdown 文件的二级标题内容为单独文件。主要工作包括：

1. **实现拆分逻辑**：读取、解析、过滤、写入
2. **集成到构建流程**：在 VitePress 配置中调用
3. **添加依赖**：确保 consola 可用
4. **验证测试**：检查生成的文件和导航

该方案具有以下优点：

- ✓ **自动化**：无需手动创建文件
- ✓ **可维护**：代码结构清晰，易于扩展
- ✓ **健壮性**：包含错误处理和日志记录
- ✓ **性能**：一次读取，批量处理

预计实施时间：30-60 分钟
预计生成文件数：约 148 个 topic 文件
