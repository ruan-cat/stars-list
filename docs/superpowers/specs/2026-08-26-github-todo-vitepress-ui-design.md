# VitePress GitHub TODO Tree 页面设计

> 状态：已确认，作为 GitHub TODO 扫描器之后的前端实现工件。正式页面采用 A「Explorer 密集型」方案；HTML 原型只作为视觉参考，不再继续扩展原型功能。

## 1. 目标

在现有 VitePress 站点内增加独立 TODO 页面，读取公开的 `TodoScanArtifact` JSON，在浏览器内提供接近 `FanaticPythoner.better-todo-tree` 的仓库进度浏览体验：仓库、分支、目录、文件和 TODO 行以树形层级呈现，左侧筛选/折叠/选中，右侧同步显示上下文详情。

## 2. 明确边界

- 页面只读取 artifact，不调用 GitHub REST API。
- 页面不持有 PAT，不触发 workflow，不写回 GitHub，不修改仓库内实体 JSON。
- “刷新”只重新读取 artifact，并将结果保存在当前浏览器的 Vue Query 缓存与 `localStorage`。
- artifact 地址统一由 `VITE_GITHUB_TODO_ARTIFACT_URL` 覆盖；未配置时使用 `https://raw.githubusercontent.com/ruan-cat/stars-list/main/artifacts/github-todos/ruan-cat.json`。
- 宿主继续使用 VitePress + Vue；采用 shadcn-vue 的 Reka UI 生态，不引入 Nuxt runtime，也不使用 Element Plus。

## 3. 查询、缓存与合并

使用 `@tanstack/vue-query`：

- `useQuery` 负责首屏读取、请求去重、AbortSignal 传递和内存缓存。
- `useMutation` 负责用户显式刷新；刷新成功后通过 `queryClient.setQueryData` 更新查询缓存并使视图立即响应。
- `staleTime=30 分钟`，表示 30 分钟内数据有效；持久化快照最多保留 7 天，超过有效期显示 stale 标记但仍可作为离线降级数据。
- 查询键固定为 `['github-todo-artifact', artifactUrl]`，避免不同地址共用缓存。
- 轻量校验至少确认 `schemaVersion=1`，并确认 `scan`、`summary`、`repositories`、`todos`、`errors` 类型正确；失败响应不得写入缓存。
- 首次网络成功数据作为最新快照；请求失败时保留最近一次合法快照，显示错误、来源和生成时间，不渲染半截数据。
- 合并按 TODO `id`、仓库 `fullName` 去重，最新快照优先；不把旧快照中已删除的 TODO 强行混回最新结果。

## 4. A「Explorer 密集型」界面

页面路由为 `/todos`，主体由两栏组成：

1. 顶部控制栏：页面标题、数据来源、刷新按钮、亮暗模式按钮。
2. 筛选栏：文本搜索、仓库、分支、TODO 类型；筛选条件保存在浏览器中，但不改变远端数据。
3. 统计栏：可见 TODO 数、仓库数、分支数、最近成功读取时间、stale/partial 状态。
4. 左侧 Explorer：仓库 → 分支 → 目录 → 文件 → TODO 行；节点支持展开/收起、键盘操作和选中态，计数显示当前节点下的 TODO 数。
5. 右侧详情：选中仓库/分支/目录/文件时显示节点摘要；选中 TODO 行时显示文本、类型、仓库、路径、分支、行号、commit、来源和 GitHub 链接。
6. 空状态/错误状态：没有 artifact、schema 不兼容、筛选无结果、网络失败分别给出可行动的提示；失败不得清空旧数据。

Explorer 的视觉密度参考 Better Todo Tree 的编辑器侧栏心智模型，但颜色、边框和字体直接复用 Teek/VitePress 语义变量：`--vp-c-text-*`、`--vp-c-bg-*`、`--vp-c-divider`、`--vp-c-brand-*`、`--tk-*`。组件必须同时声明实际 `color`，不能只改继承变量。

## 5. 组件边界

- `todo-artifact.ts`：URL 解析、fetch、AbortSignal、schema 校验和错误类型。
- `todo-query.ts`：QueryClient、持久化、查询/刷新 composable。
- `todo-tree.ts`：将平面 TODO 记录构造成树，执行过滤、计数、折叠和选中状态。
- `TodoDashboard.vue`：页面编排与响应式状态，不直接解析原始 JSON。
- `TodoFilters.vue`、`TodoTree.vue`、`TodoDetails.vue`、`TodoStatusBar.vue`：单一职责 UI 组件。
- `docs/todos.md`：独立页面入口；主题入口通过 `enhanceApp` 注册 Vue Query 插件和全局组件。

## 6. 可访问性与响应式

- 所有按钮、筛选器和树节点可通过键盘访问，选中节点暴露 `aria-selected`，展开状态暴露 `aria-expanded`。
- 刷新按钮在请求中禁用并提供 `aria-busy`；状态变化放入 `aria-live` 区域。
- 桌面端为树/详情双栏，窄屏切换为树在上、详情在下的单列布局。
- 遵守 `prefers-reduced-motion`，不依赖动画表达关键状态。

## 7. 验收标准

- 构建时不需要 artifact 文件存在于 `docs/`；运行时 URL 可由环境变量覆盖。
- 首次读取、30 分钟 stale、localStorage 恢复、手动刷新、重复点击去重、取消请求、schema 错误和网络失败降级均有可复核证据。
- A 布局中筛选结果数量、树节点计数、右侧详情随交互同步变化。
- Teek 亮/暗主题下标题、统计和 TODO 正文均保持可读对比度。
- `pnpm docs:build`、相关单元/契约测试及 agent-browser 的 Live Preview/构建预览测试通过。
