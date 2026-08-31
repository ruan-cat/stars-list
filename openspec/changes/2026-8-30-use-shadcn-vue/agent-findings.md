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

## F6 [active] OpenSpec 仅完成基线，主体迁移未实施

初次审核时 `openspec instructions apply --change "2026-8-30-use-shadcn-vue" --json` 返回 20 项任务中仅 3 项完成、17 项剩余；随后按用户确认新增可访问性任务 3.7，当前总计 21 项、完成 3 项、剩余 18 项。`tasks.md` 的 2.1–5.2 仍全部未勾选。当前 `package.json` 没有 `tailwindcss` / `@tailwindcss/vite`，`docs/.vitepress/config.ts` 未接入 Tailwind，且不存在 `components.json`。因此该 change 只能判定为规划完成，不能验收或归档。

## F7 [active] 基线截图与量化口述缺少可复核元数据

`evidence/` 目录有 8 张 PNG，但没有采集命令、URL、浏览器/版本、时间戳哈希或 DOM 断言；`agent-progress.md` 只口述一次 sweep 和“17/17”。当前独立复跑 `pnpm todo:test` 为 30/30，说明原数字已过时。后续必须补 fresh 浏览器/CDP 证据、断言输出和回归记录，不能以截图文件存在替代验收。

## F8 [active] artifact 基线的仓库数口径存在误导风险

`artifacts/github-todos/ruan-cat.json` 当前为 `repositoryCount=78`、`scannedRepositoryCount=51`、`todoCount=699`、`errorCount=0`；仓库状态还包含 26 个 skipped 与 1 个 branch_unavailable。spec 首屏同时写“699 可见 TODO、78 个仓库、complete”，未说明 78 包含未扫描项，不能据此宣称 78 个仓库全部完成扫描。验收需展示 scanned/skipped/branch_unavailable 口径或修正文案。

## F9 [active] 设计与规格仍有未决可执行性缺口

`design.md` D2 仅写“禁用 preflight 或以 layer 限定”，没有可执行 CSS 配置和普通文档页像素验证方法；D3 的 token 只给 5 个示例，未列出 `--tk-*` 的实际映射；spec 未覆盖键盘导航、焦点回收、禁用态、刷新竞态及组合筛选边界。即使后续代码迁移完成，也必须先补齐这些验收口径再归档。

## F10 [resolved] Prettier 格式化上游技能源文件（用户已授权）

定向执行 `pnpm exec prettier --experimental-cli --check .agents/skills/shadcn-vue/SKILL.md skills-lock.json` 曾返回 exit 1（2 个文件格式警告）。用户已明确授权后续直接用 Prettier 格式化 `.agents/skills/shadcn-vue/**` 与 `skills-lock.json`，且不新增 ignore 配置、不重跑 skills 安装器或 hash 关系校验。该风险作为已确认流程决策保留，不再阻断实现。
