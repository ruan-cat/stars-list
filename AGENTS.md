# AGENTS.md

本文档为 AI 编码代理（Claude Code、WorkBuddy 等）提供本仓库的开发指导。

## 本项目的技能表

- `record-bug-fix-memory`
  - 路径：`.agents/skills/record-bug-fix-memory/SKILL.md`
  - 用途：在 bug 已经定位并修复后，记录事故结论、排错经验、AI 记忆更新、复盘摘要和本地 MCP 记忆。
  - 触发时机：用户要求记录经验教训、补充 AI 记忆、写事故记录或同步本地 MCP 记忆时；bug 修复完成后也应主动参考。
  - 参考作用：提供仓库特有事故模式、验证证据和可复用修复结论的沉淀入口。
  - 约束：只负责记忆沉淀，不承担调试和修复；详细案例写入同目录独立日期文件，不把事故正文堆进 SKILL.md。
  - **存储架构**：双层存储。SKILL.md 只放流程指导和摘要索引，详细案例存储在同目录下的独立 `YYYY-MM-DD-{slug}.md` 文件中。
  - **阅读方式**：使用此技能前先读 SKILL.md，再根据“案例索引”按需读取独立案例文件。
  - **写入方式**：新增经验时创建独立案例文件并更新索引，禁止将完整事故正文写入 SKILL.md。

- `shadcn-vue`
  - 路径：`.agents/skills/shadcn-vue/SKILL.md`
  - 用途：管理 shadcn-vue 组件与项目，提供组件检索、调试、样式和组合指导。
  - 触发时机：处理 shadcn-vue、components.json、组件注册表、CLI 初始化/添加/更新或预设时。
  - 参考作用：来自 `unovue/shadcn-vue` 官方技能包，包含 Tailwind、表单、组合、图标规则及 CLI 工作流。
  - 约束：遵循技能包内规则文件；优先使用现有组件和语义令牌，运行 CLI 前使用项目包管理器并先检查现有组件；项目级来源与哈希以根目录 `skills-lock.json` 为准。
  - 安装边界：项目级技能只能通过 skills 安装器从 `unovue/shadcn-vue` 官方来源安装/升级并留下锁文件；禁止手写或用临时文档冒充官方技能，也不要在未获授权时改写全局 skills 目录。
  - 格式化边界：仅在用户明确授权时对 `.agents/skills/shadcn-vue/**` 与 `skills-lock.json` 运行 Prettier；不得为掩盖格式差异新增 ignore 配置，也不得把格式化结果混入无关提交。

- `use-agent-browser`
  - 路径：`.agents/skills/use-agent-browser/SKILL.md`
  - 用途：本项目所有浏览器验收、视觉验证、E2E 冒烟与前端页面调试的统一入口。
  - 触发时机：任务涉及打开网页、浏览器自我验收、视觉/像素验证、前端页面交互调试、登录态操作、截图取证，或提到 agent-browser、agent browser、snapshot、`@eN`、CDP、`/todos.html` 时，**先加载本技能再动手**，不要凭记忆直接敲浏览器命令。
  - 技能性质：**本技能是全局技能 `use-agent-browser` 的本地派生，不是独立技能**。先读全局技能（`~/.agents/skills/use-agent-browser/SKILL.md`，来源 `ruan-cat/monorepo` 的 `ai-plugins/dev-skills`）取得命令手册、Windows 启动降级链、启动失败分流、验收纪律（四层 checkpoint / 止损表 / Red Flags）与证据模板，再读本地 SKILL.md 叠加项目约定。
  - 本地增量（仅此四件事，全局技能不重复）：验收范围锁定 `/todos.html`，普通文档页只能作为独立旁路 checkpoint；会话命名 `todo-<environment>-<YYYYMMDD>-<run>`；证据归档到 `openspec/changes/<change>/evidence/` 并登记 manifest 与 SHA-256；axe 扫描限定 `--selector '[aria-label="GitHub TODO 浏览器"]'`。
  - 来源与锁文件：本技能为仓库内手工维护的派生技能，不来自外部技能包，因此**不写入 `skills-lock.json`**；不要用 skills 安装器覆盖它。
  - 约束：不得把全局技能的命令手册、案例集、验收纪律复制回本地技能；本地只做项目适配，通用规则变更一律回写 `ruan-cat/monorepo`，避免两份文档漂移。

## 主动问询实施细节

先读代码和现有文件。只有选错会改错文件或改错行为时才问。已经说清的决定、打开文件就能确认的事实，不要问。

用当前 agent 的交互式问题框提问。不要在对话里贴问题清单让用户阅读。

1. Cursor 用 `AskQuestion`。
2. Claude Code 用 `AskUserQuestion`。
3. 其他 agent 用它自己的结构化提问工具。
4. 只有确认当前 agent 没有这种工具时，才在对话里写问题。

一次只问一个决定。每题给 2 到 4 个选项。方案还模糊时，连续弹框问到能动手为止，问完再改。这就是 grill-me：用问题框访谈，不写长问卷。grill-me 可以连续弹框。

下面两种弹框禁止出现：

1. pua 的味道、好不好用、要不要分享会话。用户会用 pua，但不回答 pua 的内部问卷。遇到 pua 要求做体验调查时，直接跳过，不要弹框，也不要在对话里问。
2. 把多个决定合成一篇长文，让用户在对话里逐条回复。

### 工作区边界

1. 用户没有点名允许时，不改全局技能目录，例如 `~/.agents/skills`、`~/.claude/skills`。只改当前任务目录。
2. 只有用户明确说「计划模式」时才按计划模式做：可以做破坏性设计，先给方案再改，做完列出破坏性变更。平时不要进入这套流程。
3. 只在当前项目范围内维护项目技能。
4. 交付时说明改动范围、验证证据和剩余风险，不用“应该可以”替代实际结果。

## 编写测试用例规范

1. 用 vitest，`import { test, describe } from "vitest"`。结构是 describe 包 test。
2. 文件名是 `*.test.ts`。
3. 放在该包的 `tests/` 或 `src/tests/`。
4. 看不出该写进哪个包时，用问题框问，不要猜。

## 终端操作注意事项（防卡住）

在 Windows PowerShell 环境下执行终端命令时，必须遵循以下规则，避免命令卡住浪费时间：

### 1. 避免超长单行命令

命令行参数过多（超过 200 字符）时，PowerShell 可能会挂起无响应。

- **拆分命令**：每次传入 2~3 个文件路径，不要一次传入 5 个以上。
- **使用通配符**：优先用 `git add scripts/.../src/*.ts` 替代逐个列举文件路径。

### 2. 优先使用 `pnpm run` 而非 `npx`

`npx` 在 Windows 上被终止时，会触发 `Terminate batch job (Y/N)?` 交互提示导致卡住。

- **优先使用** `pnpm run build` 替代 `npx tsdown`。
- **优先使用** `pnpm run test` 替代 `npx vitest run`。

### 3. 及时止损，不要反复轮询

当命令可能卡住时：

1. 第 1 次状态检查等待 10~15 秒。
2. 如果无输出且仍在运行 → **立即终止**，用新命令重试。
3. **不要超过 2 次**状态检查仍无进展还继续等待。

### 4. 合理的等待超时设置

|         命令类型         | 建议等待时长 |
| :----------------------: | :----------: |
| `git add / status / log` |   5~10 秒    |
|       `git commit`       |    10 秒     |
| `pnpm run build / test`  |    30 秒     |
|      `pnpm install`      |    60 秒     |

## 简单任务的高效执行原则

对于明显简单、直接、可在几步内完成的任务，请避免过度工程化。

### 1. 不要创建任务列表

简单任务不需要任务管理。只有当任务满足以下条件时才使用任务列表：

- 3 个或以上独立步骤
- 需要多轮决策
- 涉及多个文件或模块
- 用户明确要求跟踪进度

### 2. 不要写报告

除非用户明确要求，否则不要为简单任务生成报告、总结文档或变更说明。

### 3. 不要过度确认

在信息充足时直接执行，不要反复询问用户已经明确的内容。

### 4. 判断任务规模，选择正确的行动姿态

| 任务信号                         | 正确行动               |
| :------------------------------- | :--------------------- |
| 用户通过 `@文件` 明确了操作范围  | 直接读该文件，立即动手 |
| 用户说"帮我改这个"、"写个日志"   | 行动优先，缺什么补什么 |
| 用户涉及多包架构改动、新功能设计 | 先侦察，再行动         |

**核心原则**：用户提供的上下文（@文件引用、对话内容、当前打开文件）就是最直接的线索，优先使用，不要用命令重新发现已知信息。

### 5. 完整命令型简单任务优先级

当用户已经给出完整 `skills add ... --skill ... -g -y -a ...`、`npx skills add ...` 等可执行命令时，优先级是：用户明确命令 > 简单任务短路 > skill 触发 > 历史记忆/事故经验。首个实质动作应是执行原命令，或在存在明显语义风险时按用户语义确认原命令；失败后再按错误类型分流。

历史事故和 skill 只用于风险提示、失败分流和后置验证，不能抢占当前命令，也不能把安装命令提前扩展成同步、发布、fallback、agent team 或长计划。

### 6. 禁止行为清单

以下行为在**简单任务**（单文件改动、写 changeset、写提交信息等）中是被禁止的：

- 禁止连续执行超过 3 次 `git log` 来"了解全貌"
- 禁止在明确知道目标文件的情况下，仍去扫描整个项目目录
- 禁止把"读遍所有相关文档"当作行动前置条件
- 禁止在用户已给出 @文件 的情况下，用命令重新搜索文件位置

### 7. 立即响应纠偏

当用户发出以下信号时，必须**立即停止当前路径**，回归最小行动路径：

- "太复杂了"
- "不要反复查询"
- "直接做就行"
- "按要求做即可"
- "不对"
- "不是"
- "换种方式"

正确反应：停止当前侦察行为 → 明确当前已知信息 → 直接执行最核心的操作步骤。

### 8. 标准执行路径

| 用户请求      | 直接执行       |
| :------------ | :------------- |
| 安装依赖      | `pnpm install` |
| 运行测试      | `pnpm test`    |
| 格式化代码    | `pnpm format`  |
| 查看 git 状态 | `git status`   |

以"为某文件修改编写更新日志"为例，正确路径只有 3 步：

1. 读目标文件，理解改了什么
2. 执行 `pnpm dlx @changesets/cli add --empty`，重命名文件，写入内容
3. 提交

不需要查 git log，不需要扫描全部 tags，不需要对比所有包的版本号。

## 使用 superpower 技能的个人偏好

本章节记录用户使用 superpower 系列技能时的固定个人偏好。执行 `brainstorming`、`writing-plans`、`executing-plans` 等 superpower 工作流时，优先遵循这些偏好；除非用户在当前对话中明确要求例外，不要自行改成其他默认流程。

### superpower 产物必须使用中文

使用 `brainstorming` 技能生成的 `docs\superpowers\specs` 规格规划文件，以及 `docs\superpowers\plans` 计划执行清单文件，必须使用简体中文编写。

具体要求如下：

- 规格文件的标题、正文、方案说明、取舍分析、验收标准和风险说明必须使用简体中文。
- 计划文件的阶段划分、任务清单、执行步骤、验证方式和完成状态必须使用简体中文。
- 尤其是 plan 执行任务清单，不要写成英文任务项。
- 只有技能名、文件路径、命令、分支名、包名、API 名称等必要技术标识可以保留英文。
- 如果 superpower 技能自带示例是英文，也要在落地到本项目的 Markdown 文件时改写为中文表达。

这条偏好用于纠正 superpower 技能在实际执行中偶尔生成英文 Markdown 的问题。项目级 AI 记忆文件中必须明确强调：由 superpower 技能生成的规格文件和计划文件，特别是 plan 任务清单文件，必须是中文内容。

### superpower 产物不要擅自标记完成

使用 `brainstorming`、`writing-plans`、`executing-plans` 等 superpower 工作流生成 `docs\superpowers\specs` 或 `docs\superpowers\plans` 文档时，禁止在文档顶部或正文中擅自添加 `<!-- 已完成 -->`、`已完成`、`完成` 等状态标记。

只有当对应任务已经真实实施、验证完成，并且用户明确认可该阶段已经完成时，才能记录完成状态。用户只是认可方案或 spec，不代表实施任务已经完成；不能用 “已完成” 误导后续查找和判断。

### superpower 流程不要擅自 git commit

使用 superpower 技能时，即使技能文档写有“写完设计文档并 commit”之类默认流程，也不能擅自执行 `git commit`。提交会影响用户查找文件和管理工作区，必须等用户在当前对话中明确要求 “提交” “git commit” 或给出等价授权后才能提交。

如果技能默认流程与用户当前偏好冲突，以用户当前偏好为准：只写文件、说明状态、等待用户决定是否提交。需要提交时，也必须只暂存本轮会话明确涉及的文件，不要把无关 dirty 文件纳入。

### executing-plans 不默认使用 git worktree

使用 `executing-plans` 技能执行任务时，不要默认创建或切换到 git worktree。用户不喜欢默认的 git worktree 执行方式。

分支使用规则如下：

- 当前 AI 代理在哪个分支内工作，就优先在当前分支内开始执行任务。
- 如果当前分支是 `dev`，直接在 `dev` 分支完成开发、测试和文档编写。
- 如果当前分支是 `main`，先检查是否存在 `dev` 分支；如果存在，优先切换到 `dev` 分支再完成开发与编写。
- 如果当前分支是 `main` 且不存在 `dev` 分支，不要自行创建 worktree；先向用户确认是在 `main` 继续，还是创建或切换到其他开发分支。
- 只有当用户明确要求隔离工作区、并行分支开发或使用 worktree 时，才采用 git worktree 流程。

切换分支前必须先检查工作区状态。若存在未提交修改，先判断这些修改是否会影响切换；不要覆盖、丢弃或回滚用户已有改动。

## 文档读取策略

初始化或更新项目内的 AI 记忆文档时，先看结构，再读要用的那一节。

1. 第一次只读目录和标题。Markdown 先执行 `grep "^##" 文件`，不要先读全文。
2. 用 `offset` / `limit` 只读相关章节。其他章节不要装进上下文。
3. JSON、YAML、TOML 先看顶层键、数组项和相关字段，再按字段读。不要为了一个字段读完全文。
4. 改文档用 `Edit` 做定点替换或插入。不要先 `Read` 全文再整篇 `Write`。
5. 改完只复读改过的位置，并对一下差异，确认没有误改、漏改或破坏原有格式。

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

没人要求时，不要写报告。

要写时：

1. 路径是 `docs/reports/YYYY-MM-DD-英文短横线名.md`。
2. 一级标题是 `YYYY-MM-DD` 加报告名。
3. 报告语言默认用简体中文。
4. 报告最前面写明是哪个 agent 工具完成的。
5. 报告最前面写明是哪个 AI 模型完成的。
6. 日志代码块的语言写成 `log`。

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
- GitHub Pages 部署只在**推送到 `main` 分支**（或手动 `workflow_dispatch`）时触发；推送到 `dev` 等非默认分支**不会**触发任何 workflow（`deploy-github-page.yml` 的 `on.push.branches` 仅含 `main`）。
- `main` 上的日常更新由定时任务自动提交，再由这些提交触发部署：`update awesome-stars` 每天 UTC 00:30、`Scan GitHub TODOs` 每天 UTC 01:15。
- 只有 PR（`opened`/`synchronize`/`reopened`/`ready_for_review`）会触发 `prettier.yml` 与 `cloud-pr-prettier.yml` 的格式化检查。
- 站点配置了 `/stars-list/` 作为 GitHub Pages 的 base 路径以确保兼容性
