# CLAUDE.md

本文档为 Claude Code (claude.ai/code) 提供本仓库的开发指导。

## 本项目的技能表

- `record-bug-fix-memory`
  - 路径：`.agents/skills/fix-bug/record-bug-fix-memory/SKILL.md`
  - 用途：在 bug 已经定位并修复后，记录事故结论、排错经验、AI 记忆更新、复盘摘要和本地 MCP 记忆。
  - 触发时机：用户要求记录经验教训、补充 AI 记忆、写事故记录或同步本地 MCP 记忆时；bug 修复完成后也应主动参考。
  - 参考作用：提供仓库特有事故模式、验证证据和可复用修复结论的沉淀入口。
  - 约束：只负责记忆沉淀，不承担调试和修复；详细案例写入同目录独立日期文件，不把事故正文堆进 SKILL.md。
  - **存储架构**：双层存储。SKILL.md 只放流程指导和摘要索引，详细案例存储在同目录下的独立 `YYYY-MM-DD-{slug}.md` 文件中。
  - **阅读方式**：使用此技能前先读 SKILL.md，再根据“案例索引”按需读取独立案例文件。
  - **写入方式**：新增经验时创建独立案例文件并更新索引，禁止将完整事故正文写入 SKILL.md。

- `shadcn-vue`
  - 路径：`.agents/skills/shadcn-vue/SKILL.md`
  - 用途：TodoDashboard UI 组件的 shadcn-vue + tailwindcss 标准方案指导，含 Tailwind v4 接入 VitePress、Teek 令牌桥接、弹层动画红线。
  - 触发时机：创建/修改 `docs/.vitepress/theme/components/ui/` 组件，或为 TodoDashboard 写样式、调整弹层动画、桥接主题变量时必须先读。
  - 参考作用：沉淀 context7 拉取的 shadcn-vue 官方最佳实践与本仓库的落地决策（design.md D1~D7）。
  - 约束：弹层动画必须成对（open/closed）或不用，禁止 enter-only；颜色一律走语义令牌，禁止硬编码色值；普通文档页渲染像素不得变化。

## 主动问询实施细节

实施更改前主动识别遗漏点、缺漏点和冲突点。信息不足或存在多种解释时，使用 AskUserQuestion 与用户协作补充实施清单；信息充分且低风险的小改动可说明假设后直接执行。

## 编写测试用例规范

- 优先使用 Vitest 的 `describe` 与 `test` 组织测试，测试文件使用 `*.test.ts`。
- 测试放在对应 monorepo 子包的 `tests/` 或 `src/tests/` 目录；无法判断归属时先询问用户。
- 每个行为先写失败测试，再实现最小通过版本；测试必须覆盖成功、失败和边界路径。

## 沟通协作要求

- 计划模式下先设计并沟通方案，完成后说明破坏性变更。
- 不得擅自修改全局 skills 目录；只在当前项目范围内维护项目技能。
- 交付时说明改动范围、验证证据和剩余风险，不用“应该可以”替代实际结果。

## 终端操作注意事项（防卡住）

- Windows PowerShell 避免超过 200 字符的超长命令；参数多时拆分执行。
- 优先使用 `pnpm run`，避免用 `npx` 引发 `Terminate batch job (Y/N)?` 交互。
- 长任务首次等待 10–15 秒无进展就止损并换方案，最多两次状态检查。
- 建议超时：git 5–10 秒，commit 10 秒，build/test 30 秒，install 60 秒。

## 简单任务的高效执行原则

- 简单、明确、低风险的任务不创建额外任务列表、不写报告、不反复确认。
- 多文件、多模块或用户明确要求跟踪时，才使用计划和进度记录。
- 用户已经给出明确文件或命令时，优先处理该范围，不扩大扫描和修改边界。
- 用户说“直接做”“按要求做”时停止无关侦察，回到最小行动路径。

## 编码前思考、简洁优先、精准修改与目标驱动执行

- 先显式说明会影响实现路径的假设；存在分歧时列出权衡并询问。
- 只写解决当前目标所需的最少代码，不为未确认的未来场景增加抽象、配置或兼容层。
- 只修改与用户请求、实现请求所需调整或本次改动产生的清理直接相关的文件。
- 先定义成功标准，再用测试、构建、校验或浏览器证据验证；失败时先定位根因，不连续盲改。
- 保护工作区已有改动；完成前检查 diff、路径、格式和验证输出。

## 使用 superpower 技能的个人偏好

- `brainstorming`、`writing-plans`、`executing-plans` 生成的 `docs\\superpowers\\specs` 和 `docs\\superpowers\\plans` 必须使用简体中文。
- 不得擅自给 superpower 工件添加“已完成”状态；只有真实实施、验证并得到用户确认后才更新状态。
- superpower 流程默认不执行 git commit；只有用户明确要求提交时，才暂存本轮相关文件并提交。
- `executing-plans` 默认在当前分支工作，不擅自创建或切换 worktree。

## 文档读取策略

- 首次只读目录和标题结构；Markdown 先查看 `^##` 标题，再按任务读取相关章节。
- JSON/YAML/TOML 先看顶层键和相关字段，不为确认单个字段倾倒全文。
- 更新文档使用精准插入/替换，保留用户自定义内容；编辑后复读修改位置并执行差异检查。

## 获取技术栈对应的上下文

处理特定技术栈时主动读取官方文档和项目现有配置。Claude Code/Agent Skills 参考：

- 编写语法与格式：https://code.claude.com/docs/zh-CN/skills
- 最佳实践：https://platform.claude.com/docs/zh-CN/agents-and-tools/agent-skills/best-practices
- 规范文档：https://agentskills.io/home

## GitHub Actions 与 Prettier 维护规范

- GitHub Actions 中的格式化检查以仓库根 `prettier.config.mjs` 和 `package.json` 的 `format` 命令为唯一配置来源。
- workflow 应使用 `pnpm/action-setup`、锁定 Node/pnpm 版本，先安装依赖，再运行 `pnpm exec prettier --experimental-cli --check` 覆盖本次变更文件。
- JSONC 风格文件（例如 `.vscode/extensions.json`）必须通过精确 parser override 处理，不得把所有 `*.json` 强制当作 JSONC。
- 格式化 workflow 只负责检查或报告，不自动提交无关格式化结果；失败时输出可定位的文件路径和行号。

## 项目概述

这是一个 VitePress 文档站点，用于自动生成和展示按主题分类的 GitHub stars 列表。项目使用 GitHub Actions 实现自动化，并部署到 GitHub Pages。根目录 `README.md` 是手工维护的项目说明文档，构建时会自动复制为站点首页 `docs/index.md`。

## 代码/编码格式要求

### 1. markdown 文档的 table 编写格式

每当你在 markdown 文档内编写表格时，表格的格式一定是**居中对齐**的，必须满足**居中对齐**的格式要求。

### 2. markdown 文档的 vue 组件代码片段编写格式

错误写法：

1. 代码块语言用 vue，且不带有 `<template>` 标签来包裹。

```vue
<wd-popup v-model="showModal">
  <wd-cell-group>
    <!-- 内容 -->
  </wd-cell-group>
</wd-popup>
```

2. 代码块语言用 html。

```html
<wd-popup v-model="showModal">
	<wd-cell-group>
		<!-- 内容 -->
	</wd-cell-group>
</wd-popup>
```

正确写法：代码块语言用 vue ，且带有 `<template>` 标签来包裹。

```vue
<template>
	<wd-popup v-model="showModal">
		<wd-cell-group>
			<!-- 内容 -->
		</wd-cell-group>
	</wd-popup>
</template>
```

### 3. javascript / typescript 的代码注释写法

代码注释写法应该写成 jsdoc 格式。而不是单纯的双斜杠注释。比如：

不合适的双斜线注释写法如下：

```ts
// 模拟成功响应
export function successResponse<T>(data: T, message: string = "操作成功") {
	return {
		success: true,
		code: ResultEnum.Success,
		message,
		data,
		timestamp: Date.now(),
	};
}
```

合适的，满足期望的 jsdoc 注释写法如下：

```ts
/** 模拟成功响应 */
export function successResponse<T>(data: T, message: string = "操作成功") {
	return {
		success: true,
		code: ResultEnum.Success,
		message,
		data,
		timestamp: Date.now(),
	};
}
```

### 4. unocss 配置不应该创建过多的 shortcuts 样式类快捷方式

在你做样式迁移的时候，**不允许滥用** unocss 的 shortcuts 功能。不要把那么多样式类都设计成公共全局级别的快捷方式。

### 5. vue 组件编写规则

1. vue 组件命名风格，使用短横杠的命名风格，而不是大驼峰命名。
2. 先 `<script setup lang="ts">`、然后 `<template>`、最后是 `<style scoped>` 。
3. 每个 vue 组件的最前面，提供少量的 html 注释，说明本组件是做什么的。

### 6. jsdoc 注释的 `@example` 标签不要写冗长复杂的例子

1. 你应该积极主动的函数编写 jsdoc 注释的 `@example` 标签。
2. 但是 `@example` 标签不允许写复杂的例子，请写简单的单行例子。完整的函数使用例子，你应该择机在函数文件的附近编写 md 文档，在文档内给出使用例子。

### 7. 页面 vue 组件必须提供注释说明本组件的`业务名`和`访问地址`

比如以下的这几个例子：

```html
<!--
  房屋申请列表页
  功能：显示房屋申请列表，支持搜索和筛选

  访问地址: http://localhost:9000/#/pages-sub/property/apply-room
-->
```

```html
<!--
  房屋申请详情页
  功能：显示房屋申请详细信息，支持验房和审核操作

  访问地址: http://localhost:9000/#/pages-sub/property/apply-room-detail
  建议携带参数: ?ardId=xxx&communityId=xxx

  http://localhost:9000/#/pages-sub/property/apply-room-detail?ardId=ARD_002&communityId=COMM_001

-->
```

每个页面都必须提供最顶部的文件说明，说明其业务名称，提供访问地址。

### 4. markdown 的多级标题要主动提供序号

对于每一份 markdown 文件的三级标题，你都应该要：

1. 主动添加**数字**序号，便于我阅读文档。
2. 主动**维护正确的数字序号顺序**。如果你处理的 markdown 文档，其手动添加的序号顺序不对，请你及时的更新序号顺序。

## 报告编写规范

在大多数情况下，你的更改是**不需要**编写任何说明报告的。但是每当你需要编写报告时，请你首先遵循以下要求：

- 报告地址： 默认在 `docs\reports` 文件夹内编写报告。
- 报告文件格式： `*.md` 通常是 markdown 文件格式。
- 报告文件名称命名要求：
  1. 前缀以日期命名。包括年月日。日期格式 `YYYY-MM-DD` 。
  2. 用小写英文加短横杠的方式命名。
- 报告的一级标题： 必须是日期`YYYY-MM-DD`+报告名的格式。
  - 好的例子： `2025-12-09 修复 @ruan-cat/commitlint-config 包的 negation pattern 处理错误` 。前缀包含有 `YYYY-MM-DD` 日期。
  - 糟糕的例子： `构建与 fdir/Vite 事件复盘报告` 。前缀缺少 `YYYY-MM-DD` 日期。
- 报告日志信息的代码块语言： 一律用 `log` 作为日志信息的代码块语言。如下例子：

  ````markdown
  日志如下：

  ```log
  日志信息……
  ```
  ````

- 报告语言： 默认用简体中文。
- 报告所使用的 agent 工具说明：在报告最前面说明当前报告由哪个 agent 工具完成。
- 报告所使用的 AI 模型说明：在报告最前面说明当前报告由哪个 AI 模型完成。

## 常用开发命令

### 文档开发

```bash
# 启动本地开发服务器
pnpm docs:dev

# 构建生产版本文档
pnpm docs:build

# 本地预览生产版本
pnpm docs:preview

# 构建 GitHub Pages 版本（包含正确的 base 路径）
pnpm docs:build-in-github-page
# 或
pnpm build
```

### GitHub TODO 扫描与工件

```bash
# 本地 Windows 全量扫描（需要 GITHUB_PAT_TOKEN；Git-first/degit）
pnpm todo:scan -- --owner ruan-cat --transport degit --refresh-manifest --manifest scripts/get-todo/repositories.json --output artifacts/github-todos/ruan-cat.json

# 离线 fixture（只验证 parser/CLI）
pnpm todo:scan -- --owner ruan-cat --fixture scripts/get-todo/fixtures --output artifacts/github-todos/ruan-cat.json

# 校验结果
pnpm todo:validate -- artifacts/github-todos/ruan-cat.json

# scanner 全量测试
pnpm todo:test
```

- `todo:scan` 使用 `degit`，按 `dev → main → master` 选分支，默认排除 fork；失败仓库写入 artifact 的 `repositories[].status/errors`，不会静默丢失。
- 私有仓库本地使用 `GITHUB_PAT_TOKEN`；GitHub Actions 使用 `TODO_SCAN_PAT` Secret（`GITHUB_` 前缀被 GitHub 保留），workflow 将它映射为 `GITHUB_TOKEN`。API Bearer 仅用于清单，Git transport 使用不进 argv 的 Basic `x-access-token:<PAT>` extraheader。`branch_unavailable` 是无目标分支，不等于认证失败。
- 配置 Actions Secret 使用 `gh secret set TODO_SCAN_PAT --repo ruan-cat/stars-list`；不要创建 `GITHUB_PAT_TOKEN` Secret（GitHub 会拒绝 `GITHUB_` 前缀）。
- `get-todo.yml` 的 checkout 必须 `persist-credentials: false`，避免 checkout header 与扫描器 Git Basic header 重复。
- `artifacts/github-todos/ruan-cat.json` 是 VitePress TODO 页面运行时读取的数据源；`complete/partial` 必须结合 summary 与 errors 解读。
- 本地文档命令默认不生成派生 Markdown；需要刷新时显式设置 `GENERATE_DERIVED_DOCS=true`。GitHub Actions 会自动生成。

### 代码质量

```bash
# 格式化所有代码文件
pnpm format

# 使用 taze 更新依赖
pnpm up-taze
```

### Git 操作

```bash
# 获取并清理远程分支
pnpm git:fetch

# 将 dev 分支 rebase 到 main 并推送
pnpm git:dev-2-main

# 将 main 分支 rebase 到 dev
pnpm git:main-2-dev
```

## 架构与核心组件

### 文档结构

- `docs/` - 主文档目录
  - `index.md` - 主页（从 README.md 自动生成）
  - `topics/index.md` - 按主题分类的 stars
  - `prompts/index.md` - 开发提示词和任务
  - `.vitepress/config.ts` - VitePress 配置
  - `.vitepress/theme/` - 自定义主题配置

### 自动化与工作流程

- `.github/workflows/schedules.yml` - 每日自动执行：
  - 运行 starred 工具按仓库主题分类生成 stars 列表（唯一的 starred 步骤）
  - 将更改提交回仓库
  - 不再输出任何内容到根目录 README.md；按编程语言分类的输出已下线
- `.github/workflows/deploy-github-page.yml` - 推送时部署到 GitHub Pages

### 配置文件

- `prettier.config.mjs` - 使用 OXC 解析器格式化 JS/TS 的 Prettier 配置
- `commitlint.config.cjs` - 使用 @ruan-cat/commitlint-config 的提交信息校验
- `taze.config.ts` - 依赖更新配置
- `.czrc` - 用于约定式提交的 Commitizen 配置

## 关键技术细节

### VitePress 配置

- 使用 `@ruan-cat/vitepress-preset-config` 实现标准化配置
- 根据文档结构自动生成侧边栏
- 包含变更日志生成和 README.md 复制功能
- 自定义主题附加样式

### GitHub Stars 处理

- 使用 `starred` Python 包生成分类列表
- 仅保留按仓库主题分类（在 `docs/topics/index.md`）；按编程语言分类已下线，不再生成
- 通过 GitHub Actions 每日自动更新

### 开发工作流

- 需要 Node.js >=22.14.0
- 使用 pnpm 作为包管理器
- 使用 cz-git 进行约定式提交
- 使用 OXC 解析器增强 Prettier 对 JS/TS 的支持
- 打印宽度：120，使用制表符：true，单引号：false（JSX：true）

## 重要说明

- `docs/topics/index.md` 与 `docs/topics/*.md` 是自动生成的 - 请勿手动编辑这些文件
- `docs/index.md` 在构建时从根目录 README.md 复制生成（已在 .gitignore 中忽略）；修改站点首页请直接编辑根目录 README.md
- 项目使用 `@ruan-cat/*` 包的自定义预设系统
- 任何分支推送都会自动触发 GitHub Pages 部署
- 站点配置了 `/stars-list/` 作为 GitHub Pages 的 base 路径以确保兼容性
