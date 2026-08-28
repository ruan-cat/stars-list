# 2026-08-28 TODO 快照接口在生产环境不可用与 Select 弹层高度失效

## 1. 问题现象

- 用户反馈：VitePress 站点的 todos 页面上，"刷新快照"按钮的接口请求"完全不能用"；仓库下拉框"没有高度限制"。
- dev 服务器与 curl 直连 `raw.githubusercontent.com` 均返回 200，构建、单测全部通过，问题只在用户的浏览器环境出现。

## 2. 实际根因

两个独立的 bug 叠加：

1. `resolveArtifactUrl` 在生产浏览器环境返回 `DEFAULT_ARTIFACT_URL`（`raw.githubusercontent.com`）。该域名在部分国内网络环境下不可达，浏览器请求会直接失败；而 curl/Git Bash 走了终端代理，测出来永远是 200，掩盖了真实情况。实际上 `get-todo.yml` 早已把 artifact 复制进 `docs/public/artifacts/` 并随站点发布到 GitHub Pages，同源路径 `/stars-list/artifacts/github-todos/ruan-cat.json` 完全可用，只是代码从未使用它。
2. `ui/Select.vue` 的弹层经 `SelectPortal` 渲染到组件根节点之外，scoped 样式属性匹配不到 portaled 的 `.ui-select__viewport`，导致 `max-height: 320px` 从未生效。同文件里 `.ui-select__content`/`.ui-select__item` 早已用 `:global()` 声明，唯独 viewport 漏了。

## 3. 关键误导点

- 用 curl 验证 raw URL 可达 → 得出"接口没问题"的错误结论。浏览器 fetch 不走终端代理，curl 结果不能代表浏览器环境。
- dev 环境一直走 `/artifacts/...` 本地中间件（200），导致"刷新功能在本地看起来正常"，误判为生产专属问题。
- CSS 规则写了、构建不报错 → 误以为"高度限制已实现"。scoped 样式对 Portal 内容静默失效，没有任何构建期信号。

## 4. 有效修复

- `resolveArtifactUrl`：浏览器端（存在 `location`）一律返回基于 `BASE_URL` 的同源路径（dev 为 `/artifacts/...`，Pages 为 `/stars-list/artifacts/...`），仅 SSR/构建期回退 raw URL；`VITE_GITHUB_TODO_ARTIFACT_URL` 环境变量覆盖优先级最高。
- `ui/Select.vue`：`.ui-select__viewport` 规则改为 `:global(.ui-select__viewport)`。
- 顺带修复的关联布局缺陷：树/平铺列表需要 `height: 100%` 才能在 `overflow:hidden` 的 SplitterPanel 内产生内部滚动条；dashboard 高度测量锚点必须取"状态栏底边"而不是"dashboard 顶边"。

## 5. 验证方式

- `pnpm exec tsx --test docs/.vitepress/theme/*.test.ts`：17 个用例全过，含新增的 BASE_URL 同源路径用例。
- CDP headless Chrome 实测：dev 下刷新点击产生第二次 `/artifacts/...` 200 请求；线上构建后同样验证。`Select` 打开后 `getComputedStyle(.ui-select__viewport).maxHeight === "320px"` 且 `clientHeight 320 < scrollHeight 772`。
- 布局：`docScrollH === innerH === 1000`（整页零滚动），树内部 `scrollHeight 861 > clientHeight 497`。

## 6. 后续约束

- 涉及浏览器网络请求的验证必须用真实浏览器（CDP/无头 Chrome），不能只凭 curl。
- VitePress 站点内请求仓库自有静态资源时，一律走同源 `BASE_URL` 路径，禁止在生产代码里直连 `raw.githubusercontent.com`。
- Reka UI（shadcn-vue）经 Portal 渲染的弹层样式必须用 `:global()`，写完要在真实浏览器里 `getComputedStyle` 确认生效。
