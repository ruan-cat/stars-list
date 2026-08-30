## Why

TodoDashboard 的 UI 组件（Select/Button/Input/Resizable 等）是在 2026-08-26 工件中按"shadcn-vue/Reka UI primitives"的模糊表述**手写**的 reka-ui 包装层，缺少 shadcn-vue 官方组件经过实战检验的样式与动画模式。该路径已连续引发两起生产事故（Portal 内 scoped 样式静默失效、Presence 误等 animationend 导致弹层残留遮挡全页交互）。用户于 2026-08-30 明确纠偏：废弃手写 Reka UI 方案，迁移到正规的 shadcn-vue + tailwindcss 标准方案，并要求 tailwindcss 兼容识别 Teek 主题变量体系。

## What Changes

- 引入 **Tailwind CSS v4**（`tailwindcss` + `@tailwindcss/vite`）到 VitePress 文档构建，仅作用于 TodoDashboard 应用型页面范围。
- 通过 shadcn-vue CLI 初始化 `components.json` 与 CSS 变量设计体系，并**桥接 Teek/VitePress 语义变量**（`--vp-c-*` / `--tk-*` 映射到 shadcn 的 `--color-*` 令牌），保证亮/暗主题与站点一致。
- **重写** `docs/.vitepress/theme/components/ui/` 下的 Select、Button、Input、Resizable 系列，从手写 reka-ui 包装替换为 shadcn-vue 标准组件实现。
- TodoDashboard 业务组件（TodoTree、TodoFlatList、TodoDetails、TodoStatusBar、TodoFilters、TodoDashboard）保留业务逻辑，视觉层改写为 Tailwind 工具类。
- 重构必须满足本 change `specs/todo-dashboard-explorer/spec.md` 的全部验收需求，并以 `evidence/` 目录中采集的 8 张现状截图与量化指标为视觉基线，**不允许丢失任何既有功能与视觉效果**。

## Capabilities

### New Capabilities

- `todo-dashboard-explorer`：GitHub TODO Explorer 应用型页面的完整行为契约（筛选、树形/平铺视图、详情面板、下拉交互、快照刷新、主题与响应式表现）。此前该页面无任何 spec 级约束，本次补齐并以现状为验收基线。

### Modified Capabilities

- 无（`build-automation`、`development-guidelines` 的需求不因本次变更而改变）。

## Impact

- **依赖**：新增 `tailwindcss`、`@tailwindcss/vite`、`shadcn-vue` CLI 开发依赖；`reka-ui` 保留（shadcn-vue 的底层引擎）。
- **构建**：`docs/.vitepress/config.ts` 的 vite plugins 需接入 `@tailwindcss/vite`；新增主题层 CSS 文件。
- **代码**：`docs/.vitepress/theme/components/ui/**` 全部重写；`docs/.vitepress/theme/components/Todo*.vue` 样式层改写；`docs/.vitepress/theme/style.css` 增加设计令牌桥接。
- **风险**：VitePress 站点全局引入 Tailwind 可能影响既有文档页样式（需用 preflight 策略隔离）；回归基线以 `evidence/` 截图与本 change spec 需求为准。
