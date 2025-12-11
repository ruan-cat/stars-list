---
order: 8000
---

# 杂项提示词

开发本站用的提示词，仅供参考。

## 001 starred

请深度思考。

1. 请阅读 .github\workflows\schedules.yml 工作流文件。
2. starred 是一个 Python 包， schedules.yml 工作流就是使用了该包实现 github stars 信息读取的。请帮我查询该包的命令行参数信息，我希望搞懂全部能用的命令行参数配置。

## 002 设计一个按照 markdown 二级标题拆分文档数据的 typescript 脚本

1. 完整的，全面的阅读以下文档。了解清楚要被拆分拆解的文档文本结构。
   - `https://ruan-cat.github.io/stars-list/topics.md`
   - `docs/topics/index.md`
2. 文档结构包含了很多二级标题。
3. 在 `docs` 内制作一个 typescript 脚本，实现文档数据拆分。
4. 在 `docs\.vitepress\config.ts` 内，在 `setUserConfig` 函数调用前执行该脚本提供的处理函数。

### 脚本读取二级标记数据并新建文件的实现流程

1. 直接阅读 `docs/topics/index.md` 文件。
2. 读取全部的二级标题，根据二级标题作为全部的 `topics` 主题。
3. 读取的二级标题内，排除掉 `Contents` 和 `License` 这两个标题，这两个标题不是有意义的 `topics` 主题。
4. 根据你获取到的主题，在 `docs/topics/index.md` 内读取每个段落的正文。
5. 根据 topics 主题，在 `docs\topics` 目录内新建以 topics 主题命名的 markdown 文档。
   - 新建文档，其正文就是读取的每个 `docs/topics/index.md` 段落的正文。
   - 每一个 `docs/topics/[topics].md` 文档的一级标题，就是对应的 topics 名称。
   - 每一个 `docs/topics/[topics].md` 文档的结构只有两个：
     - 以 topics 命名的一级标题。
     - 正文

### 代码编写要求

1. 脚本编写到 `docs` 目录内。
2. 为 typescript 脚本。
3. 控制台输出用 consola 来输出信息。
4. 必须使用 `consola.withTag` 的方式创建 `logger`，并直接使用 `logger` 来输出打印日志。即：

```typescript
// 获取依赖包的包名 版本号
import { name as packageName, version as packageVersion } from "../package.json";
// 用包名作为日志的标签前缀
const logger = consola.withTag(packageName);
// 然后无条件的开始输出包的信息
logger.info(`${packageName} v${packageVersion} is running...`);
```

## 003 制作一个标题数据格式调整脚本

1. 制作一个 typescript 脚本。
2. 阅读 `docs\topics\index.md` 文档。实现标题文本的重新编写。
3. 仅仅只阅读这一小块文本，即一级标题：

```markdown
# Awesome Stars [![Awesome](https://awesome.re/badge.svg)](https://github.com/sindresorhus/awesome)
```

4. 将一级标题的文本格式改写，改写成如下格式：

```markdown
# Awesome Stars

[![Awesome](https://awesome.re/badge.svg)](https://github.com/sindresorhus/awesome)
```

你只需要将 barge 徽章从一级标题内换到下面一行即可。并在中间保留一行空行。

### 代码编写要求 spec

1. 在 docs 内编写脚本。
2. typescript 脚本。不是 javascript。
3. 代码格式和风格，模仿 `docs\split-topics.ts` 。
4. 其他的代码编写风格 spec 规格，请阅读 `openspec\changes\archive\2025-12-11-add-topic-splitting-script\specs\development-guidelines\spec.md` 文档。

### 脚本使用规范要求 spec

1. 在 `docs\.vitepress\config.ts` 的 `splitTopics` 函数之前，在 `copyReadmeMd` 之后调用。
