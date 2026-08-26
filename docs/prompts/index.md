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

## 004 <!-- 已完成 2026-8-26 codex正在做 --> 设计一个检查指定 github user 用户仓库全部 TODO 待办任务的工作流

这是一个产品调研、技术方案调研，和落地任务设计的任务：

我需要你做一个对 `https://github.com/ruan-cat` 用户，也就是我的仓库信息专项收集的执行函数方案。

我要你以 node 的方式，通过接口请求的方式，实现对指定用户全部开源或闭源项目的信息收集。按照特定的文本查询正则，来获取信息，并制作格式化数据。

### 需要收集的信息

1. 按照特定文本规则，根据 TODO 这个关键词获取的文本。
2. 该文本所在：
   - repo 仓库名称
   - path 完整的相对根目录的文件路径
   - git 分支名称
   - line number 所在的文件行数

### 要收集的信息以及正则规则管理

你需要收集形如这样的`文本信息`：

1. 在 markdown 内的二级标题

你提取的文本是： `持续推进二期 AI 项目改造`

```markdown
## 006 <!-- TODO: 2026-8-24 codex 正在做 --> 持续推进二期 AI 项目改造
```

你提取的文本是： 换接口请求模型为 `claude-sonnet-5[1m]` ，并做出其他相应的改动

```markdown
### <!-- TODO: ZCode正在做 --> 换接口请求模型为 `claude-sonnet-5[1m]` ，并做出其他相应的改动
```

提取文本为： 调研合适的 nitro 接口生成接口请求信息表的工具

```markdown
## 005 <!-- TODO: --> 调研合适的 nitro 接口生成接口请求信息表的工具
```

提取的文本为： 尝试更换付款方式的虚拟卡为美国卡

```markdown
## <!-- TODO: --> 尝试更换付款方式的虚拟卡为美国卡
```

4. 在 markdown 内裸露的单行且无内容的 TODO。

```markdown
<!-- TODO: -->
```

在这种情况下，你提取下面最近的一行，通常是这样的：

```markdown
<!-- TODO: -->

回到本项目，针对 `docs\plan\2026-8-25-up-to-latest-nitro` 文件。

更新上述报告的主体。上述报告的主体是以 `D:\code\ruan-cat\learn-nitro-starter-with-vercel` 的身份写的，不是以 `D:\store\WorkBuddy\2026-6-30-common` 的身份写的。
```

这个时候你提取的是这一行： 回到本项目，针对 `docs\plan\2026-8-25-up-to-latest-nitro` 文件。

5. 在 markdown 内裸露的单行且有内容的 TODO。

```markdown
<!-- TODO: 后面再考虑提供更好看的动效 现在暂时没有需求 -->
```

你提取这一行： 后面再考虑提供更好看的动效 现在暂时没有需求

6. 在 markdown 内嵌入某行的 TODO。

```markdown
1. <!-- TODO: 可接受的优化 --> **先降低默认输出成本。** 默认 stdout 只返回摘要；增加显式完整审计开关。摘要至少包含 `Mode`、`CandidateCount`、候选 PID、阻断原因聚合、WorkBuddy 分组、停止结果、验证结果和是否存在 respawn。
```

你提取的是这一行： 可接受的优化

7. 在其他格式文件的 TODO。

```scss
// TODO: 实现图标变化的动效
```

你提取的是： 实现图标变化的动效

```typescript
/**
 * http的接口传参方式
 * @description
 * 用于控制接口请求时的参数传递方式
 * @see https://www.cnblogs.com/jinyuanya/p/13934722.html
 *
 * @description
 * 警告 该配置目前失去意义
 *
 * 该配置目前不再被使用了 不会被任何函数使用 配置起来属于无意义内容
 *
 * 未来会被删除 并重新整理对应的接口生成成果
 *
 * TODO: 准备删除该工具
 */
export type HttpParamWay =
	// 路径传参
	| "path"
	// query传参
	| "query"
	// body传参
	| "body";
```

你提取的是： 准备删除该工具

### 格式匹配黑名单

```markdown
## 015 <!-- TODO: -->
```

你什么都不提取。不要做任何识别和处理。

### 制作用 tsx 直接驱动的 typescript 脚本

你需要制作一揽子用 tsx + typescript + node 执行的脚本，来实现需求。在 `scripts\get-todo` 目录内编写你的脚本。
这些脚本的有效交付物应该是一个巨大的 json 文件。至于这个 json 文件存储在哪里，由你来给出设计。

### 未来可能的使用场景

1. 直接在 window 环境内，我点击根包内已经封装好的命令来完成信息收集。生成出 json 文件。
2. 在 github workflow 内，通过每天执行一次 tsx 执行的脚本，获取到脚本信息。
3. 未来可能直接在 vitepress 内，通过纯异步请求的方式完成信息获取，并根据交付物直接刷新 vitepress 站点内的 vue 组件，实现页面更新。实现用户点击按钮，就即时获取到最新数据的效果。

### 验收与校验方式

你自己设计。按理说在 window 内执行一次脚本就行了。你设计。

---

### 2026-8-26 沟通

你说的对，我们的 token 这样获取：

如果你发现在本地 window 执行的时候，没有可以用的环境变量获取到个人级别的环境变量，那么你就默认只查询开源仓库，不查询私人仓库。
如果你在 github workflow 内运行时，那么你必须要查询私有和公开仓库，因为给 github workflow 肯定会给你提供 user token。
运行时优先读取 GITHUB_TOKEN，兼容我现有的 GITHUB_PAT_TOKEN

---

你说的对，branch 分支的查询细节我没有考虑清楚。

分支扫描策略如下：

1. 优先扫描名为 dev 的开发分支。因为我的主分支经常不更新。
2. 目标 repo 仓库没有 dev 分支时，默认查询 main master 分支。即主分支。

---

你考虑的很好。我们现在只按照这样的方式来做查询。我们只查询 `TODO` ，只查询大写的 TODO。就这 4 个大写字母。
允许 TODO 后有冒号和空白。
`todo: 修复` 是不识别的。这是小写。
TODOLIST 不识别。这不是单独的文本。
TODO: 是识别的。特别是大写字母且带有冒号的。

---

采用“向下跳过空白行，取第一条非空文本行；遇到下一个标题、代码围栏或另一个 TODO 就停止并记录 unresolved_empty_todo，避免误把结构行当待办”的规则
我确认

---

顺便更新 .github\workflows\schedules.yml 的 git commit message 写法，按照我常见的 git-commit 技能的指导，来完成 git commit message 的字符串模板编写。就像你在 .github\workflows\get-todo.yml 写的一样。

### 2026-8-26 思考配额受限的问题

我们受限于 github api 的配额问题，这是我们之前调研没想到的。我们还有哪些方案，可以跳过这个 github api 配额问题的？用本地浅克隆形式的 git clone 或者是 degit 方案，可以实现基于本地文件的快速查询么？
这个方案在本地 window 和云端 github workflow 都合适吗？

## 005 <!-- TODO: codex 正在做 --> 实现基于 vitepress vue 页面的功能

你做的很好，请你完成上下文压缩，我准备开始新的任务了。

新任务：我要实现 vitepress 内提供一个特定按钮，点击按钮就能主动实现请求，获取待办信息，并且适当的更新文件。
在 vitepress 页面内，我点击按钮，就能经可能的获取数据。然后完成最新的信息更新。

接口请求我要求用 vue-qurey 这个包完成适当的请求去重、中断、和缓存的要求。
在 vitepress 获取的信息，是最新获取的信息。你把网站现存的 artifacts\github-todos 工件信息，和最新由用户手动获取的信息，做好 merge 对象合并，确保能显示数据。因为我要考虑接口请求失败后的页面降级显示效果。

本地和生产环境的浏览器测试，用 agent browser 来实现。

---

1. 只做“重新读取现有 artifact”（无需后端，但不是真正刷新）。我们只是做 vitepress 层面上的主动获取最新内容，确实不能直接修改 github 仓库内的文件工件。我这边可以接受这样的边界，在 vitepress 内点击刷新时，获取的数据是一次性的，并且存储在浏览器里面。并不能，也不要去更新 github 仓库内的实体 todo 信息表 json 文件；
2. 实现本仓库的 VitePress 页面、vue-query 查询/突变层和 endpoint 契约。我们不做额外的服务端，没必要复杂化，不认为这个项目还要涉及到服务端业务。很麻烦。
3. 适当更新文件，我说错了，我仔细思考了一下，我们不实际去更新文件。我刚才说的不对。不合适。如果在 vitepress 层面上更新文件，那么要做 github push 的，这个对于 vitepress 功能来说不合适。
4. vue-query 依赖与缓存。当然要增加插件。我要持久化的行为，持久化到 localStorage。这个要的。你设计合适的持久化时间吧。毕竟我要考虑 github api 限流限额的情况，所以实际上这个行为并不是高频执行的接口，允许你设计稍微长一点的缓存时间；
5. 生产验证目标。按照你说的来做吧；

---

统一抽象为 VITE_GITHUB_TODO_ARTIFACT_URL 环境变量
合并优先级，按你说的；
按照你说的，新建独立的 todo 页面。这里的涉及到前端设计，你用合适的工具完成前端设计。
数据缓存 30min。
Vue Query API 边界分工，由你来设计，我同意；

---

提供公开 raw GitHub URL 作为默认值。允许覆盖。按你说的设计；
我说的是 vue-qurey 的接口数据，缓存 30min 作为有效期。
沿用现有 Teek 主题的色彩/暗色模式。做一个合适的，能够筛选仓库，路径，分支，树形图的复杂 vue 组件。我希望你去参考 `FanaticPythoner.better-todo-tree` 这款 vscode 插件的界面设计。我做那么多，其实就是希望实现一个云端形式的 FanaticPythoner.better-todo-tree ，便于我控制。了解进度。至于实现的组件库，我这边想做出尝试和改变，我们大胆的使用 nuxt 和 shadcn/ui 的组件库来实现页面效果。而不是我常用的 element-plus ，我想尝试新的组件库挑战；
接收轻量级 schema 检查。

---

采用 nuxt 生态提供的通用形式组件库，采用 shadcn-vue 组件库；
使用你的 superpower 能力，打开浏览器，给我绘制合适的视觉 UI 设计与交互方案，让我提前做出判断和选择。
另外，我要求你在本项目内存储你设计的 html 设计稿原型，也 git 提交。

---

本地生成/维护 shadcn-vue 风格组件，底层使用 Reka UI，不引入运行时远端依赖”执行。

---

我有问题，现在 GitHub Pages 部署 和 GitHub TODO 扫描 Workflow，都会产生文件。一个是 pnpm build 的时候，执行的文件拆分，所以生产环境一直都是产生新的 markdown 的，一直会修改 markdown 的。只不过我过了那么久，本地从来没有 build 过，所以才出现一大堆的 markdown 修改。是不是这样理解？

GitHub TODO 扫描 Workflow，产生了 artifacts\github-todos 的工件，这些工件会被另外一个工作流 build 的时候，被识别么？两个工作流都在修改文件，最后实际 build 的时候能获取到另外一部分的信息么？

这两个工作流的工件，是不是事实上错位啊？比如 build page 的工作流，可能拿到的是稍微旧一点的 TODO 工件啊？

### 持续完成 vitepress vue 的测试和生产环境 github workflow 测试

你能确定我们的云端 github workflow 任务，能够完成全量的信息获取么？你有做测试么？你能做主动的触发并联调测试么？
我现在授权你 git commit。
你对全部内容做分门别类编写提交信息，然后 git commit，然后 git push，rebase 到 main 分支。并且用 github MCP 或者 gh cli 完成 github workflow 的主动触发，校验检查 github workflow 的任务工件生成效果。是否能完成开源和闭源仓库的 TODO 信息获取。
