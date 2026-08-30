# agent-findings

## F1 [active] Reka Portal 弹层禁止 enter-only 动画

Reka Presence 关闭时按计算样式 `animationName` 决定是否等待 `animationend`；enter-only 动画（只在 `[data-state=open]` 声明）在关闭时可能残留弹层并附带 `disableOutsidePointerEvents` 拦截全页。证据：`.agents/skills/fix-bug/record-bug-fix-memory/2026-08-29-select-presence-animation-leftover.md`。动作：重构中弹层动画成对（open+closed）或不用（design.md D6），回归必测三种关闭路径的 DOM 卸载。

## F2 [active] scoped CSS 无法命中 Reka Portal 内容

`SelectContent/SelectItem` 渲染在组件树外的 portal 容器，scoped 属性匹配不到，样式必须 `:global()` 或全局块。证据：`2026-08-28-todo-artifact-same-origin-url-and-portal-scoped-css.md`。动作：Tailwind 方案天然规避（工具类直接写在元素上），旧坑不再适用，但定制滚动条等仍需确认落点。

## F3 [active] shadcn-vue CLI 对非标准 srcDir 的适配未验证

VitePress 站点 srcDir 为 `docs/`，CLI 默认假设标准 Vue 工程结构。`components.json` 的 aliases 需手工指向 `docs/.vitepress/theme`。若 CLI init 失败，按官方组件模板手工落盘（内容一致），不阻塞主链路。证据：design.md Risks 节。

## F4 [resolved] artifact 生产 URL 曾指向 raw.githubusercontent 导致部分网络不可用

已改为同源 `BASE_URL` 路径（`resolveArtifactUrl`），`get-todo.yml` 同步复制到 `docs/public/`。证据：`2026-08-28-todo-artifact-same-origin-url-and-portal-scoped-css.md`。重构不得触碰 `resolveArtifactUrl` 语义。

## F5 [active] Reka 触发器存在 10px 指针位移守卫（测试注意项）

弹层打开后 Reka 注册 document 级 pointerup 守卫：位移 ≤10px 时 preventDefault（抑制 click 合成）。自动化用合成事件（无坐标）会触发瞬开瞬关假象。动作：交互测试一律用真实坐标（CDP Input 带坐标 / computer-use），合成 dispatchEvent 只用于 DOM 级机制验证。
