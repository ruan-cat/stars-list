# AGENTS.md

本文档为 AI 编码代理（Claude Code、WorkBuddy 等）提供本仓库的开发指导。

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

在我与你沟通并要求你具体实施更改时，难免会遇到很多模糊不清的事情。

请你**深度思考**这些`遗漏点`，`缺漏点`，和`冲突相悖点`，**并主动的向我问询这些你不清楚的实施细节**。请主动使用 claude code 内置的 `AskUserQuestion` 工具，将你不清楚的内容设计成一些列问题，并询问我，向我索要细节，或着与我协作沟通。

我会与你共同补充细化实现细节。我们会先迭代出一轮完整完善的实施清单，然后再由你亲自落实实施下去。

信息充分且低风险的小改动，可先说明采用的假设，再直接执行。

## 编写测试用例规范

1. 请你使用 vitest 的 `import { test, describe } from "vitest";` 来编写。我希望测试用例格式为 describe 和 test。
2. 测试用例的文件格式为 `*.test.ts` 。
3. 测试用例的目录一般情况下为 `**/tests/` ，`**/src/tests/` 格式。
4. 在对应 monorepo 的 tests 目录内，编写测试用例。如果你无法独立识别清楚到底在那个具体的 monorepo 子包内编写测试用例，请直接咨询我应该在那个目录下编写测试用例。
5. 每个行为先写失败测试，再实现最小通过版本；测试必须覆盖成功、失败和边界路径。

## 沟通协作要求

### `计划模式`

在`计划模式`下，请你按照以下方式与我协作：

1. 你不需要考虑任何向后兼容的设计，允许你做出破坏性的写法。请先设计一个合适的方案，和我沟通后再修改实施。
2. 如果有疑惑，请询问我。
3. 完成任务后，请告知我你做了那些破坏性变更。

请注意，在绝大多数情况下，我不会要求你以这种 `计划模式` 来和我协作。

### 避免越权修改

- 避免出现直接修改全局 skills 技能目录的情况。注意时刻明确自己所在的任务工作目录，没有明确的允许时，不允许直接修改全局技能目录。
- 只在当前项目范围内维护项目技能。
- 交付时说明改动范围、验证证据和剩余风险，不用“应该可以”替代实际结果。

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

## 编码前思考、简洁优先、精准修改与目标驱动执行

本章节整合自 `multica-ai/andrej-karpathy-skills` 对 LLM 编码陷阱的总结，用于降低 AI agent 在写代码、改代码、重构代码时的常见错误。

这些准则偏向**谨慎和可验证**，而不是追求最快动手。遇到拼写修正、显而易见的一行改动、用户已经明确要求“直接做”的简单任务时，仍应遵循“简单任务的高效执行原则”，走最小行动路径。

### 问题背景

LLM 在编码任务中常见的问题不是“不会写代码”，而是会在不该自行决定的地方默默做决定：

- 代替用户做错误假设，然后不加确认地继续执行。
- 隐藏自己的困惑，不主动说明哪里不确定。
- 遇到多种解释时，不呈现分歧和权衡，而是静默选择一种。
- 在应该提出异议时不反驳，导致复杂方案一路推进。
- 喜欢增加抽象、配置项、兼容层和“未来可能有用”的能力。
- 顺手修改相邻代码、注释、格式或命名，制造与任务无关的 diff。
- 删除或改写自己没有充分理解的旧代码，尤其是看似无用但可能承载历史约束的代码。

本章节的目标是把这些风险转化为明确的执行纪律：先澄清，再简化；只改必要内容；每一步都有可验证的成功标准。

### 核心原则概览

| 原则         | 主要解决的问题                             |
| :----------- | :----------------------------------------- |
| 编码前思考   | 错误假设、隐藏困惑、缺少权衡、没有及时澄清 |
| 简洁优先     | 过度工程、抽象泛滥、为了未来场景提前设计   |
| 精准修改     | 无关编辑、顺手重构、删除不理解的代码       |
| 目标驱动执行 | 成功标准模糊、验证不足、靠盲改推进任务     |

### 编码前思考

不要假设，不要隐藏困惑，要把关键权衡摆出来。

在开始实现前，先检查自己是否真的理解了任务：

- 明确说明当前假设。只要假设会影响实现路径，就不要把它藏在心里。
- 如果存在多种解释，列出这些解释，并说明各自会导致什么实现差异。
- 如果需求不清楚，停下来指出不清楚的点，向用户询问。
- 如果用户提出的方案明显复杂、风险高或与目标不匹配，应该礼貌指出，并给出更简单的替代方案。
- 如果只是小范围、低风险、目标明确的任务，可以说明采用的合理默认假设，然后直接执行。

不要用“我先实现一个通用版本”来掩盖需求不清。通用版本通常意味着你正在替用户决定未确认的未来需求。

### 简洁优先

用能解决当前问题的最少代码完成任务，不要写推测性功能。

执行时遵循这些约束：

- 不添加用户没有要求的功能。
- 不为只使用一次的逻辑创建抽象。
- 不为了“灵活性”添加未要求的配置项、插件点、策略对象或兼容层。
- 不为实际上不可能发生的场景堆错误处理。
- 不为了展示完整架构而扩大文件、模块或 API 的边界。
- 如果你写了 200 行，但 50 行就能清楚解决问题，应该主动收缩实现。

判断是否过度复杂，可以问自己：

- 资深工程师会不会认为这比需求本身重很多？
- 当前抽象是否已经有两个以上真实调用方？
- 这个配置项是否已经被用户或现有系统明确需要？
- 这段错误处理是否对应真实可达的失败路径？
- 如果明天删除这个功能，当前设计是否会留下大量无意义结构？

简洁不是草率。简洁意味着实现边界清楚、依赖少、验证直接、后续读者容易判断为什么需要这些代码。

### 精准修改

只触碰必须触碰的内容，只清理自己造成的问题。

编辑已有代码时，必须尊重当前系统的局部风格和历史边界：

- 不要顺手“改进”相邻代码、注释、格式或命名。
- 不要重构没有坏、也不在任务范围内的代码。
- 匹配已有代码风格，即使你个人更喜欢另一种写法。
- 看到无关死代码时，可以在总结中提及，不要擅自删除。
- 不要把格式化整个文件当作完成小改动的副作用。
- 不要因为读不懂旧逻辑就删除它；读不懂时应先调查或询问。

当你的改动制造了孤儿代码时，应清理这些由你造成的遗留物：

- 删除因为本次改动而变成未使用的导入。
- 删除因为本次改动而变成未使用的变量、函数或类型。
- 删除因为本次改动而失效的局部注释或测试数据。

不要清理本次任务之前就已经存在的死代码，除非用户明确要求。

最终自检标准：每一行 diff 都应该能直接追溯到用户请求、实现该请求所需的必要调整，或本次改动产生的必要清理。

### 目标驱动执行

先定义成功标准，再循环验证直到达成。

不要只把用户的话理解成“要做什么”，还要把它转化成“怎样证明已经做好”。例如：

| 用户指令   | 更好的目标表达                               |
| :--------- | :------------------------------------------- |
| 添加验证   | 为无效输入补测试，再让测试通过               |
| 修复 bug   | 先写出能复现问题的测试或最小复现，再让它通过 |
| 重构某模块 | 保证重构前后现有测试通过，行为不变           |
| 优化构建   | 给出构建命令、耗时或错误消失的验证证据       |
| 更新文档   | 检查链接、路径、命令和示例是否与实际文件一致 |

多步骤任务应使用简短计划，并为每一步绑定验证方式：

```markdown
1. 调整模板内容 -> 验证：标题层级和语言符合模板规范
2. 同步版本号 -> 验证：相关配置与版本声明一致
3. 更新 changelog -> 验证：版本节、日期、分类和 bullet 可扫读
```

强成功标准可以让 agent 独立推进并及时收敛。弱成功标准，例如“让它能用”“优化一下”“整理一下”，通常会导致反复猜测和返工。

### AI 实践补充

在实际协作中，除了四项核心原则，还应遵循下面的 agent 执行纪律：

- **先识别任务类型**：简单任务直接做；多文件、多包、发布、架构和流程变更先列清范围与验证点。
- **先读最近相关上下文**：读目标文件、相邻模板、现有 changelog 或测试，不要为了“了解全貌”无边界扫描。
- **显式记录关键假设**：假设影响版本号、发布等级、文件落点、兼容策略时，必须告诉用户或请求确认。
- **让每一步能回滚和解释**：每次编辑只覆盖一个清楚意图，避免把内容改写、版本升级、格式整理和无关清理混在一起。
- **失败时先定位根因**：测试、构建、校验失败后，先读错误和相关代码，不要连续盲改。
- **验证证据要具体**：优先给出命令、文件、diff、测试结果、解析结果，而不是“应该可以”。
- **保护用户改动**：工作区已有改动默认属于用户；除非用户明确要求，不要撤销、覆盖、提交或重新暂存这些改动。
- **避免流程压过目标**：技能、规范和流程用于服务任务。如果流程与用户明确意图冲突，应先说明冲突并按用户意图收敛。
- **保持输出可扫读**：面向人类的 changelog、报告、说明文档，要用短句和分组表达，不要把多个原因、文件和效果塞进一条长句。
- **完成前读 diff**：确认改动范围、标题层级、格式、语言和验证结果都符合目标，再声称完成。

### 生效判断

这些准则真正生效时，应该能观察到以下信号：

- diff 更小，且无关文件和无关格式改动明显减少。
- 因过度抽象、过度配置、过度兼容导致的返工减少。
- 澄清问题出现在实现之前，而不是错误实现之后。
- 代码修改更贴近现有风格，局部边界更稳定。
- PR、提交或补丁更干净，每一块改动都有清楚理由。
- 测试、构建、文档检查或手动验证证据更具体。
- 用户纠偏次数减少，任务能围绕可验证目标向前推进。

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

初始化或更新项目内的 AI 记忆文档时，必须遵循渐进式读取，先建立结构认知，再读取任务所需内容。

- 第一次只读目录和标题结构。Markdown 文档先执行 `grep "^##" file`，不要一开始读取全文。
- 根据任务需要，使用 `offset` / `limit` 只读取相关章节；无关章节不加载到上下文中。
- 读取 JSON、YAML、TOML 等结构化文件时，先查看顶层键、数组项和相关字段，再按字段范围读取，禁止为了确认一个字段倾倒整个文件。
- 更新文档时使用 `Edit` 做精准替换或定点插入，不要先 `Read` 全文再整体 `Write`，避免覆盖项目已有内容。
- 编辑后只复读修改位置，并用差异检查确认没有误改、漏改或破坏原有格式。

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
- GitHub Pages 部署只在**推送到 `main` 分支**（或手动 `workflow_dispatch`）时触发；推送到 `dev` 等非默认分支**不会**触发任何 workflow（`deploy-github-page.yml` 的 `on.push.branches` 仅含 `main`）。
- `main` 上的日常更新由定时任务自动提交，再由这些提交触发部署：`update awesome-stars` 每天 UTC 00:30、`Scan GitHub TODOs` 每天 UTC 01:15。
- 只有 PR（`opened`/`synchronize`/`reopened`/`ready_for_review`）会触发 `prettier.yml` 与 `cloud-pr-prettier.yml` 的格式化检查。
- 站点配置了 `/stars-list/` 作为 GitHub Pages 的 base 路径以确保兼容性
