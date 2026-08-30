# VitePress GitHub TODO Tree Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> [!WARNING]
> **2026-08-30 纠偏声明（覆盖本文的 Tech Stack 组件部分）：** 本文 Tech Stack 中的"shadcn-vue/Reka UI"按"手写 reka-ui primitives + scoped CSS"执行，该路线已作废并判定为错误（连续两起生产事故：Portal scoped 样式失效、Presence 弹层残留）。组件层现行方案为 shadcn-vue + tailwindcss 标准体系，见 `openspec/changes/2026-8-30-use-shadcn-vue/`（proposal/design/specs/tasks）。本文的 Vue Query 数据层、tree model 与验收流程仍然有效。

**Goal:** 在 VitePress 内交付一个采用 A「Explorer 密集型」布局的 GitHub TODO 浏览页面，使用 Vue Query 读取、缓存和刷新公开 artifact。

**Architecture:** 保留现有 Git-first 扫描器作为 artifact 生产者；新增一个纯浏览器消费层。artifact client 负责安全读取和 schema 校验，Vue Query 负责 30 分钟有效缓存、localStorage 恢复、去重和取消，tree model 负责平面 TODO 到 Explorer 层级的转换，Vue 组件负责筛选、折叠、详情和降级状态。

**Tech Stack:** VitePress 1.x、Vue 3、TypeScript/tsx、`@tanstack/vue-query`、shadcn-vue/Reka UI、现有 Teek 主题变量、Node `node:test`、agent-browser。

## 当前阶段（2026-08-26）

- UI 实现阶段：基本完成（Tree、Inspector、Iconify、Resizable、Select、清空入口、页面插件排除）。
- 当前进入：功能检查阶段。
- 已有 Codex Chrome 证据：刷新按钮可执行、Select 可打开/选择/清空、Resizable 可拖拽且受最小宽度约束、artifact 本地读取成功。
- 尚待完成：跨筛选组合回归、localStorage 恢复、取消/失败降级、移动端与亮暗主题完整检查。

## Global Constraints

- 只读取 `VITE_GITHUB_TODO_ARTIFACT_URL`，默认 raw GitHub URL；不调用 GitHub REST API。
- 不在浏览器暴露 PAT，不触发 workflow，不写回 GitHub 或仓库 JSON。
- Vue Query `staleTime` 固定为 30 分钟；合法旧快照最多保留 7 天作为失败降级。
- 查询键固定为 `['github-todo-artifact', artifactUrl]`。
- A 布局固定为仓库 → 分支 → 目录 → 文件 → TODO 行；左侧操作必须驱动右侧详情。
- 主题颜色使用 Teek/VitePress 语义变量，并显式设置继承元素的 `color`。
- 所有生产代码先有失败测试或可复现的浏览器验收，再实现最小通过版本。

### Task 1: 安装 Vue Query 与 shadcn-vue 基础依赖

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `docs/.vitepress/theme/query-client.ts`
- Test: `docs/.vitepress/theme/query-client.test.ts`

**Interfaces:**

- Produces `createTodoQueryClient(): QueryClient`，默认配置 `staleTime=30*60*1000`、`gcTime=7*24*60*60*1000`。
- Produces `installTodoQuery(app: App): void`，注册 `VueQueryPlugin`。

- [x] Step 1: 写失败测试，断言 QueryClient 默认 stale/gc 配置和插件安装入口。
- [x] Step 2: 运行 `pnpm exec tsx --test docs/.vitepress/theme/query-client.test.ts`，确认在实现前失败。
- [x] Step 3: 安装 `@tanstack/vue-query`、`@tanstack/query-persist-client-core`、`@tanstack/query-sync-storage-persister`、`reka-ui`、`class-variance-authority`、`clsx`、`tailwind-merge`、`lucide-vue-next`，实现 QueryClient 工厂和插件安装。
- [x] Step 4: 重新运行聚焦测试，确认通过；执行 `pnpm install --frozen-lockfile --offline` 验证锁文件一致。

### Task 2: Artifact client、schema 校验与持久化快照

**Files:**

- Create: `docs/.vitepress/theme/todo-artifact.ts`
- Create: `docs/.vitepress/theme/todo-persistence.ts`
- Test: `docs/.vitepress/theme/todo-artifact.test.ts`
- Test: `docs/.vitepress/theme/todo-persistence.test.ts`

**Interfaces:**

- `resolveArtifactUrl(env: Record<string, string | undefined>): string`
- `fetchTodoArtifact(url: string, signal?: AbortSignal): Promise<TodoScanArtifact>`
- `isTodoScanArtifact(value: unknown): value is TodoScanArtifact`
- `readPersistedArtifact(key: string, now?: number): PersistedArtifact | null`
- `writePersistedArtifact(key: string, artifact: TodoScanArtifact, now?: number): void`

- [x] Step 1: 写失败测试覆盖默认 raw URL、环境变量覆盖、schemaVersion/type 错误、AbortSignal 传递、30 分钟有效/7 天保留和非法 JSON 不落盘。
- [x] Step 2: 运行两个聚焦测试并确认按预期失败。
- [x] Step 3: 实现轻量 schema 校验、fetch 错误归一化、localStorage 安全读写和过期标记。
- [x] Step 4: 运行聚焦测试并确认所有缓存/错误分支通过。

### Task 3: Tree model、筛选与折叠状态

**Files:**

- Create: `docs/.vitepress/theme/todo-tree.ts`
- Test: `docs/.vitepress/theme/todo-tree.test.ts`

**Interfaces:**

- `buildTodoTree(artifact: TodoScanArtifact): TodoTreeNode[]`
- `filterTodoTree(nodes: TodoTreeNode[], filters: TodoFilters): TodoTreeNode[]`
- `countVisibleTodos(nodes: TodoTreeNode[]): number`
- `toggleTodoNode(state: TodoTreeState, nodeId: string): TodoTreeState`

- [x] Step 1: 写失败测试覆盖仓库/分支/目录/文件/TODO 层级、按文本/仓库/路径/分支/kind 过滤、父节点计数和展开收起。
- [x] Step 2: 运行 `pnpm exec tsx --test docs/.vitepress/theme/todo-tree.test.ts`，确认失败。
- [x] Step 3: 实现纯函数 tree model，按 TODO `id` 稳定排序，保留选中/展开状态且过滤不修改原始 artifact。
- [x] Step 4: 运行测试并确认计数与折叠状态回归通过。

### Task 4: Vue Query composables 与主题注册

**Files:**

- Create: `docs/.vitepress/theme/use-todo-query.ts`
- Modify: `docs/.vitepress/theme/index.ts`
- Modify: `docs/.vitepress/config.ts`
- Test: `docs/.vitepress/theme/use-todo-query.test.ts`

**Interfaces:**

- `useTodoArtifactQuery(): UseQueryReturnType<TodoScanArtifact, TodoArtifactError>`
- `useTodoArtifactRefresh(): { mutate: () => void; isPending: Ref<boolean>; cancel: () => void }`

- [ ] Step 1: 写失败测试覆盖 query key、成功写缓存、刷新成功替换数据、重复刷新复用在途请求、取消请求和失败保留旧数据。
- [ ] Step 2: 运行聚焦测试并确认失败。
- [ ] Step 3: 接入 query client、持久化快照和 composable；在主题 `enhanceApp` 中安装插件。
- [ ] Step 4: 运行测试并执行 `pnpm exec tsc --noEmit` 覆盖新增 TS 文件。

### Task 5: A 密集型 Explorer 页面组件

**Files:**

- Create: `docs/todos.md`
- Create: `docs/.vitepress/theme/components/TodoDashboard.vue`
- Create: `docs/.vitepress/theme/components/TodoFilters.vue`
- Create: `docs/.vitepress/theme/components/TodoTree.vue`
- Create: `docs/.vitepress/theme/components/TodoDetails.vue`
- Create: `docs/.vitepress/theme/components/TodoStatusBar.vue`
- Modify: `docs/.vitepress/theme/index.ts`
- Modify: `docs/.vitepress/theme/style.css`

**Interfaces:**

- `TodoDashboard.vue` consumes `useTodoArtifactQuery`/`useTodoArtifactRefresh` and owns selected node + filters。
- `TodoTree.vue` emits `select(nodeId: string)` and `toggle(nodeId: string)`。
- `TodoDetails.vue` accepts `node: TodoTreeNode | null`。

- [ ] Step 1: 先建立页面失败验收清单：无数据空态、加载态、错误降级、A 双栏、筛选、折叠、右侧同步、亮暗主题和移动单列。
- [ ] Step 2: 运行 `pnpm docs:build`，确认新页面/组件尚未实现时验收失败或缺失。
- [x] Step 3: 用 shadcn-vue/Reka UI primitives 实现组件；所有节点使用 `button`/`aria-expanded`/`aria-selected`，详情链接使用 artifact 的 `htmlUrl`。
- [x] Step 4: 以 Teek 语义变量实现暗/亮主题和 reduced-motion；运行 `pnpm exec prettier --experimental-cli --write` 处理新增文件。
- [x] Step 5: 运行 `pnpm docs:build`，确认页面能被 VitePress 构建。

### Task 6: 浏览器验收与交付报告

**Files:**

- Create: `docs/superpowers/reports/2026-08-26-github-todo-vitepress-ui-verification.md`
- Modify: `package.json` only if adding a browser smoke script

- [ ] Step 1: 启动 VitePress Live Preview，使用 agent-browser 验证首屏 artifact、A Explorer 双栏、树节点折叠/展开和右侧详情联动。
- [ ] Step 2: 验证搜索、仓库、分支、kind 筛选的数量变化，以及 localStorage 刷新后恢复。
- [ ] Step 3: 用 browser route/mock 返回成功、404、非法 schema、延迟响应，验证去重、取消请求、30 分钟 stale 和旧数据降级。
- [x] Step 4: 使用 `pnpm docs:build` + `pnpm docs:preview` 验证构建预览，检查亮暗主题文本对比度和移动端单列布局。
- [x] Step 5: 运行 `pnpm todo:test`、新增纯函数/契约测试、TypeScript 检查、Prettier、`git diff --check`，把实际输出写入报告；不把浏览器 mock 成功写成真实 GitHub artifact 成功。

### Task 7: 功能检查阶段

**目标：** 在 UI 基本稳定后，验证用户可执行的完整交互链路，不把静态渲染或单元测试当成功能完成。

- [x] Step 1: 用 Codex Chrome 点击“刷新快照”，确认按钮 enabled、请求执行后恢复可用，状态保持 `10 可见 TODO / complete`。
- [x] Step 2: 验证仓库/分支/类型下拉可打开、可选择、可清空；已验证类型选择后清空按钮恢复 placeholder。
- [x] Step 3: 验证左右 Resizable handle 的 separator/aria 属性、拖拽改变宽度和最小宽度约束。
- [ ] Step 4: 验证搜索、仓库、分支、kind 组合筛选及无结果空态，确认结果计数和详情同步。
- [ ] Step 5: 验证 localStorage 恢复、刷新取消、HTTP 404/非法 schema/延迟响应下的旧快照降级。
- [ ] Step 6: 验证 375px 移动端单列、亮暗主题对比度、reduced-motion，并将结果补入报告。
