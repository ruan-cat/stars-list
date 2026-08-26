# GitHub TODO Tree UI 验证记录

## 结果

- `pnpm docs:build`：通过，输出 `building client + server bundles`、`rendering pages`、`build complete in 48.78s`。
- 聚焦契约/纯函数测试：12/12 通过（QueryClient、artifact schema/fetch、持久化、tree model）。
- Prettier：新增 UI/Query 文件与样式检查通过。
- `git diff --check`：目标变更范围通过。
- `pnpm todo:test`：29/29 通过。
- Live Preview：`http://localhost:4173/todos.html` 可加载，页面显示 GitHub TODO Tree、刷新按钮、搜索框、仓库/分支/kind 三个 Reka Select 组合框。
- 公开 artifact 当前返回 HTTP 404，页面正确进入“无法读取快照”降级状态；这证明错误态可见，但不等同于真实 artifact 成功读取。

## 组件验收

本地 `docs/.vitepress/theme/components/ui/` 提供 Button、Input、Select primitives，底层依赖 `reka-ui`；TodoDashboard/TodoFilters 已使用这些组件，不引入运行时远端组件。

## 未完成/风险

- 真实 GitHub artifact 当前不存在或不可访问，尚未声称真实数据树成功。
- agent-browser 在默认启动参数下 Chrome 退出，改用 `--args --no-sandbox` 后可运行。
- 构建仍有既有 iconfont unresolved 与大 chunk 警告，不阻断构建。
- 初次验证时仓库未提供 `tsconfig.json`，因此 tsc 仅输出帮助；后续已补齐配置并重新通过类型检查（见下方闭环记录）。

## 后续闭环（2026-08-26）

- 新增仓库根 `tsconfig.json` 与 `docs/.vitepress/env.d.ts`；`pnpm exec tsc --noEmit` 现已通过。
- 使用 Windows 本地 fixture 扫描入口生成 `artifacts/github-todos/ruan-cat.json`：扫描 1 个 fixture 仓库，得到 10 条 TODO；`pnpm todo:validate -- artifacts/github-todos/ruan-cat.json` 返回 `valid`。
- 为本地 Preview 镜像生成物到 `docs/public/artifacts/github-todos/ruan-cat.json`，用 `VITE_GITHUB_TODO_ARTIFACT_URL=/artifacts/github-todos/ruan-cat.json` 构建预览。
- agent-browser 真实读取本地 artifact 返回 HTTP 200；状态栏显示 `10 可见 TODO / 1 个仓库 / complete`，展开 `ruan-cat/fixture` 后显示 `dev 10`，选中仓库后右侧显示“当前节点包含 10 项 TODO”。
- 修复空筛选值被误判为有效过滤器的问题，并新增回归测试。
- 修复本地 dev 未继承环境变量时回退 raw URL 的问题：本地 hostname 自动使用 `/artifacts/github-todos/ruan-cat.json`；独立 dev 浏览器验证显示 10 条 TODO。
