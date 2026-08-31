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

## F6 [superseded] OpenSpec 仅完成基线，主体迁移未实施（早期结论）

初次审核时 `openspec instructions apply --change "2026-8-30-use-shadcn-vue" --json` 返回 20 项任务中仅 3 项完成、17 项剩余；随后按用户确认新增可访问性任务 3.7，再新增三环境浏览器验收任务 2.5、4.5–4.7，当前总计 24 项、完成 3 项、剩余 21 项。`tasks.md` 的 2.1–5.2 仍全部未勾选。当前 `package.json` 没有 `tailwindcss` / `@tailwindcss/vite`，`docs/.vitepress/config.ts` 未接入 Tailwind，且不存在 `components.json`。因此该 change 只能判定为规划完成，不能验收或归档。

## F7 [active] 基线截图与量化口述缺少可复核元数据

`evidence/` 目录原有 8 张 PNG，但没有采集命令、URL、浏览器/版本、时间戳哈希或 DOM 断言；`agent-progress.md` 只口述一次 sweep 和“17/17”。已新增 `evidence/manifest.md` 作为三环境证据模板，但旧截图仍未完成登记。当前独立复跑 `pnpm todo:test` 为 30/30，说明原数字已过时。后续必须补 fresh 浏览器/CDP 证据、断言输出和回归记录，不能以截图文件存在替代验收。

## F8 [resolved] artifact 基线的仓库数口径存在误导风险

`artifacts/github-todos/ruan-cat.json` 当前为 `repositoryCount=78`、`scannedRepositoryCount=51`、`todoCount=699`、`errorCount=0`；仓库状态还包含 skipped、unauthorized 与 branch_unavailable。`spec.md` 已明确 complete 仅表示扫描流程完整度，`TodoStatusBar` 已展示总数、已扫描、跳过、未授权、分支不可用、失败和错误计数；仍需用三环境浏览器证据验证文案实际可见。

## F9 [resolved] 设计与规格可执行性缺口已补齐

原先 D2、D3 与 spec 缺少可执行的 CSS 隔离、token、键盘/焦点/禁用/竞态和组合筛选口径；本轮已在 `design.md`、`spec.md` 与 `tasks.md` 补齐。后续只需按新增条款产出实现和浏览器证据，不得回退为截图口述。

## F10 [resolved] Prettier 格式化上游技能源文件（用户已授权）

定向执行 `pnpm exec prettier --experimental-cli --check .agents/skills/shadcn-vue/SKILL.md skills-lock.json` 曾返回 exit 1（2 个文件格式警告）。用户已明确授权后续直接用 Prettier 格式化 `.agents/skills/shadcn-vue/**` 与 `skills-lock.json`，且不新增 ignore 配置、不重跑 skills 安装器或 hash 关系校验。该风险作为已确认流程决策保留，不再阻断实现。

## F11 [active] 三环境 agent-browser 证据尚未完成

当前已在 `spec.md`、`design.md`、`tasks.md` 和 `evidence/manifest.md` 固定 dev/preview/production 的启动命令、URL、headed Chrome session、统一交互矩阵、截图命名、元数据、断言和失败回滚门禁。production 首页/topics/prompts 已完成参考采集，但没有重构前 fresh baseline；dev 启动被执行器策略拒绝，preview 尚未执行。任务 4.5–4.7 必须逐项产出 manifest 记录后才能勾选。

## F12 [resolved] Tailwind 基础设施已接入

`package.json` 已加入 `tailwindcss@4.3.3` 与 `@tailwindcss/vite@4.3.3`；`docs/.vitepress/config.ts` 的 Vite 插件数组已接入 `tailwindcss()`。新增 `docs/.vitepress/theme/tw.css` 仅导入 `tailwindcss/theme.css` 与 `tailwindcss/utilities.css`，并通过 `@theme inline` 桥接 VitePress 语义令牌，未引入 preflight；由 `TodoDashboard.vue` 入口加载。

## F13 [active] components.json 已就绪，浏览器门禁仍未完成

截至 2026-08-31，`components.json` 已通过 CLI 生成并由 `info --json` 验证，Select、Button、Input、Resizable 已切换为官方生成子组件，Todo\* 视觉层已完成静态 Tailwind 迁移；3.5/3.7 已补 1280/720px dev 滚动与 CSSRules 证据，但仍缺亮暗主题、完整交互矩阵及 preview/production headed Chrome 证据，不能把局部运行时通过等同于整条 shadcn-vue 迁移完成。

## F14 [active] 并行构建会竞争 VitePress 临时目录

多代理同时执行 `pnpm docs:build` 时曾出现 `.vitepress/.temp/plugin-vue_export-helper.*.js` 缺失并 exit 1；停止并行构建后，串行 fresh build exit 0（59.02s）。因果目前判定为共享 `.vitepress/.temp` 并发竞争，后续构建验收必须串行，并在进度记录中保留完整 exit code。

## F15 [resolved] shadcn-vue CLI init/info 的 base schema 不一致

`pnpm dlx shadcn-vue@latest init --template vite --base reka --style nova --icon-library lucide --no-src-dir --no-base-style --no-reinstall --yes` 成功生成 `components.json`，但同版本 `info --json` 报 `Unrecognized key(s): base`。移除 `base` 字段后 `info --json` exit 0，且 `resolvedPaths.ui` 正确指向 `docs/.vitepress/theme/components/ui`；依赖 `reka-ui` 仍由 package.json 保留。后续不要把 `base` 字段重新写回，CLI 的 `--dry-run/--diff/--view` 当前版本也会直接提示未支持。

## F16 [resolved] tsc 需要直接声明 Vite 类型依赖

`pnpm exec tsc --noEmit` 首次因 `serve-artifacts-plugin.ts` 无法解析 `vite` 类型而失败；补充匹配 VitePress 的 `vite@5.4.21` 开发依赖后 exit 0。该依赖同时满足 `@tailwindcss/vite` 的运行时 peer，后续不要只依赖 VitePress 的传递依赖。

## F17 [active] dev 长页面截图存在超时边界

agent-browser headed Chrome 在 `http://127.0.0.1:8080/prompts/` 上可读取 DOM（title=`杂项提示词`、`scrollH=16194`、`scrollW=923`），但 viewport 截图命令在 30 秒内超时；首页/topics 截图成功。后续应保留 timeout 日志并采用分段/降负载截图策略，不能删除失败记录或把 DOM 成功当成视觉截图成功。

## F20 [superseded] shadcn-vue CLI 初次无法识别 VitePress 手工工程

按项目 CLI 指导初次使用 `style=nova` 时，CLI preflight 曾提示无法检测受支持框架并建议 manual 配置；随后改用 registry 可用的 `style=default` 成功生成并由 `info --json` 验证 `components.json`。该早期失败已被后续成功路径取代，保留只用于解释选择 default 的原因。

## F18 [active] TODO 页面截图可能触发 CDP captureScreenshot 超时

Select smoke 的真实交互和 DOM 断言均通过（选中关闭、Escape、外部关闭、`animation=none`、`overflowY=scroll`、`maxHeight=320px`），但打开下拉后的 `agent-browser screenshot` 返回 `CDP command timed out: Page.captureScreenshot`。该现象与长列表渲染/截图负载有关，不能把 DOM 通过升级为视觉截图通过；后续需采用分段或降负载截图策略。

## F19 [resolved] vue-tsc 会把第三方插件资源错误纳入检查

为给 CLI 生成的 `.vue` 导出补类型检查而临时安装 `vue-tsc` 后，检查失败在 `vitepress-plugin-llms` 的 `?raw` SVG 和无类型 utils 导入；撤销该依赖、在 `docs/.vitepress/env.d.ts` 增加 `*.vue` 声明后，项目 `pnpm exec tsc --noEmit` exit 0。当前阶段不把 vue-tsc 作为门禁，待后续若引入需先限定 include/exclude。

## F21 [resolved] headed Chrome 启动存在间歇性 DevToolsActivePort 失败

独立复核代理在一次最新工作区尝试中返回 exit 3，未生成 `DevToolsActivePort`；清理确认归属本次运行的旧 dev 进程后，以 headed Chrome session `shadcn-tw-mobile-e3381299a1aa` 冷启动成功，并完成 1280×900/720×900 CSSRules、computed style 和截图复验。该间歇性环境故障仍须保留启动日志，若再次发生不得将静态门禁升级为视觉通过。

## F22 [resolved] preset 覆盖 vite.plugins 导致 Tailwind utilities 未生成

运行时复核发现 `setUserConfig()` 内部 `handlePlugins()` 会重建并覆盖传入的 `userConfig.vite.plugins`，导致 `tailwindcss()` 与 `serveArtifacts()` 虽写在配置入参中却未执行；构建 exit 0 但 CSS 只含 `@theme`/`@tailwind utilities` 字面量，`.h-full` 等类缺失。已改为在 `setUserConfig()` 返回后追加本项目插件，并在 `tw.css` 显式声明 `@source "./components/**/*.vue"` 与 utilities 入口；冷构建后 CSSRules 与 headed Chrome computed style 均确认工具类生效。

## F23 [resolved] VitePress 文档列表样式覆盖 TodoTree marker

基线 `evidence/01-tree-initial.png` 的仓库树没有黑色圆点，但 Tailwind 迁移后的截图出现圆点。Chrome computed style 显示 `.todo-tree-root > ul` 的 `listStyle=disc`、`paddingLeft=20px`，原因是 VitePress `.vp-doc ul` 选择器 specificity 高于普通 `list-none/p-0`。已对 TodoTree 列表使用 `!list-none !p-0 !m-0`，冷启动 dev DOM 复验为 `listStyle=none`、`paddingLeft=0`，并更新 marker 修复截图与 manifest；不得用这张截图替代 1600×1000 的普通文档像素基线。

## F24 [active] preview 存在全站 hydration mismatch 基线警告

preview headed Chrome 对 `/todos.html` reload 后记录 `Hydration completed but contains mismatches`；同一 session 访问普通首页并清空 console 后出现相同警告，说明目前更像 VitePress 全站既有基线而非 TodoDashboard 专属新增。TODO 页此前出现的 `InvalidStateError: Transition was aborted because of invalid state` 在 hydration 闸门和最新交互复验中未重现。4.6 仍需把该基线警告与 TODO 新增 console 错误分开登记，不能简单宣称 console=0。

## F25 [active] production 仍为旧部署，当前提交未进入 Pages

只读核验显示本地 HEAD `c90abb1a16cadfdd9eedcd6dfd36ac3c78e84966`，`origin/main=1c468f4`，最新 Pages deployment `6176611081` 的 head SHA 为 `1c468f4`；production URL HTTP 200、资源均可达，但线上 CSS/HTML hash 与本地构建不同。仓库内没有可自证的 Flex 流量器配置，4.7 必须在授权 push/main 合并后取得 Pages workflow 与外部切流/回滚回执，不能用 production 200 代替。

## F26 [active] production headed Chrome 直连/启动未形成可回放会话

对 production URL 的第一次 headed Chrome 访问返回 `net::ERR_CONNECTION_CLOSED`；第二次独立 session 在 Chrome 启动阶段返回 exit 3，未生成 `DevToolsActivePort`。同一时段 PowerShell `Invoke-WebRequest` 可得 HTTP 200，说明脚本可达性不能证明真实浏览器可交互。4.7 必须保留这两次失败日志，待浏览器网络/进程环境恢复后重试，禁止以 HTTP 200 或本地 preview 证据代替 production Chrome。

## F27 [resolved] Select 外点焦点已由新会话复验

旧 session 的外点关闭证据显示焦点落在 BODY，与 spec 要求冲突；已在 `ui/Select.vue` 增加 `pointer-down-outside`/`interact-outside` 监听、`update:open` 关闭处理和 aria-label DOM fallback。修复后 headed Chrome session `shadcn-focus-fix4-e3381299a1aa` 证明外点/选中/Escape 均为 `aria-expanded=false`、Portal options=0、activeElement=`aria-label=仓库`；manifest §18 已记录，3.2 可重新勾选。

## F28 [resolved] Reka close-auto-focus 在真实外点默认行为后覆盖触发器焦点

fresh preview headed Chrome 复验发现，旧的 `nextTick + 单帧` 调度在真实坐标点击外部后仍会把焦点留在 BODY；这是可复现的真实浏览器缺陷，不是 happy-dom 假阳性。修复改为监听 `close-auto-focus` 并 `preventDefault()`，统一用 `nextTick → 双 requestAnimationFrame → focus → 0ms fallback` 单次调度，清理卸载 timer。session `shadcn-preview-fix-e3381299a1aa` 在外点、选中、Escape 三路径均确认 Portal 卸载且焦点回仓库触发器；初始 console 仅有全站既有 hydration mismatch，未出现新 InvalidStateError。后续以 manifest §20 为准。

## F29 [resolved] 组件层回归缺少 SFC 测试底座

项目原先只有 `node:test` 纯 TypeScript 测试，没有 Vue SFC mount 环境，导致 3.7 的键盘、焦点、首次失败和刷新竞态无法自动证明。已新增最小 Vitest + `@vue/test-utils` + happy-dom 基础设施与 `test:components` 脚本，组件测试 7/7 通过；happy-dom 无法可靠模拟 Reka 真实 `pointerdown-outside`，该边界由 manifest §20/§21 的 headed Chrome 真实坐标证据承担。

## F30 [resolved] hydration 后布局锚点未重新测量导致桌面页面溢出

fresh TODO dev session 在 1280×900 首次稳定后发现 `docScrollH=916`、面板底部越过视口；根因是 `viewportReserve` 在 loading 状态测量一次，状态栏拿到 artifact 后高度增加却没有重测。已监听 `isHydrated`、`query.data` 与 `query.error`，在 post-flush nextTick 后重新测量；修复后同一 session `docScrollH=900`、group 高度 `calc(100dvh - 561px)`，窄视口仍切换为 block 并允许自然滚动。

## F31 [resolved] refresh 事件 currentTarget 在真实按钮包装层不可用

真实 headed Chrome 中刷新 pending/恢复状态正常，但 `event.currentTarget` 未落到原生按钮，导致旧实现没有恢复焦点；组件测试的 attachTo mount 未暴露该差异。`restoreRefreshFocus` 已增加按 `aria-label=刷新快照` 查询原生 button 的兜底，fresh dev 复验完成后焦点回收且桌面页面无溢出。

## F32 [active] dev 单 session 的 agent-browser daemon 在 reload 后失联

2026-09-01 dev 验收 session `todo-dev-full-20260901` 在首屏 snapshot/截图成功后执行 `reload`，agent-browser 返回 `Invalid response: EOF while parsing a value`，随后 CLI 报 CDP 连接拒绝；同一时刻 Chrome PID `33236` 仍存活且 `127.0.0.1:9227/json/version` 返回 Chrome 151.0.7922.174，说明故障位于 agent-browser daemon/会话控制面，不足以判定 TODO 页面失败。已停止 dev server、关闭该 session 并精确结束 PID 33236；未新建第二个 session 拼接证据。后续动作：重新验收前先运行 agent-browser doctor/单 session 健康探针；若控制面再次 EOF，记录为环境阻塞并停止该环境，不得静默换 session。

## F33 [active] agent-browser headed 启动在健康探针通过后仍无法建立 Chrome 控制面

2026-09-01 `agent-browser doctor --offline --quick` 返回 7 pass/0 warn/0 fail、无活动 daemon；随后唯一 dev session `todo-dev-20260901-a` 启动 headed Chrome 返回 exit 3 且未生成 `DevToolsActivePort`。按技能仅在同一 session 追加一次 `--no-sandbox` 受控恢复，结果为连接 9227 被拒绝；未创建第三个 session。dev server 与 session 已停止，8080/9227 无监听。该证据只说明当前 agent-browser 启动/控制面阻塞，不说明 TODO 页面功能失败；4.5 保持未完成。后续若要改用手工 Chrome + CDP，需作为明确的替代执行方案重新记录完整生命周期，不能与本次失败 session 拼接。

## F34 [active] 手工 CDP session 的截图与键盘证据仍有边界

2026-09-01 手工隔离 Chrome PID `30252` + CDP `9229` 的唯一 session `todo-dev-cdp-20260901-c` 成功完成首屏、下拉、仓库选择、组合筛选、无匹配、树展开/详情和平铺 DOM；7 张截图已登记到 manifest §24。平铺 PNG capture 首次超时，按一次低负载 JPEG capture 后转换 PNG，保留原始 timeout，不把它写成原生 PNG 通过。该 session 的 `agent-browser press Escape` 没有形成可观察 keydown；合成 Escape 能卸载 Portal 但焦点落 BODY，故键盘焦点路径仍未证明，4.5 不勾选。源码已尝试 document capture listener 修复，但尚未在干净 preview/dev session 验证；不要在当前已停止 session 上继续 HMR 调试。

## F35 [resolved] window capture listener 在干净 preview session 修复 Escape 焦点

2026-09-01 串行 preview build 后，干净 session `todo-preview-fix-20260901-d` 在 Chrome `151.0.7922.174`/agent-browser `0.35.0` 中真实执行 `focus → Enter → ArrowDown → Escape`，确认 `aria-expanded=false`、Portal options=0、activeElement 回到仓库触发器；外点与选中关闭也复验通过。该结果验证 `Select.vue` 的 window capture listener 修复了 F34 的键盘焦点问题，但仍只能作为 4.6 局部证据，不能替代完整矩阵。

## F36 [resolved] dev headed session 需禁止后台遮挡才能执行焦点调度

2026-09-01 最终 dev session 使用隔离 Chrome PID `6976`、CDP `9239` 与 `--disable-backgrounding-occluded-windows --disable-renderer-backgrounding --disable-background-timer-throttling`，`document.visibilityState=visible`。同一 session 真实执行 Escape 后 `aria-expanded=false`、Portal=0、焦点回仓库触发器；此前 hidden tab 的 rAF 不执行导致 BODY 焦点，属于浏览器可见性环境问题。完整 dev 关键路径和首次失败/恢复证据登记在 manifest §26；仍缺重复点击竞态请求计数，4.5 不提前勾选。

## F37 [active] preview 当前源码版本矩阵已近完整，仍缺独立 verifier 与个别截图

2026-09-01 preview session `todo-preview-final-20260901-j` 在可见 headed Chrome 中完成首屏、artifact 首次失败/恢复、四维筛选/无匹配、下拉 21 项与 320px 滚动、树/详情、平铺、Tab/Space/Arrow/Enter/Escape、暗色、720px、刷新 pending/失败/恢复与重复点击 race（两次点击仅 1 个 fetch）。HAR 记录了 HTML/CSS/JS/font/favicon/artifact 的 200 状态（abort 请求状态 0，临时 HAR 已删除）；证据见 manifest §27。仍缺各键盘分支独立截图、初始 hydration warning 的 session 内单独清点和独立 verifier，故 4.6/4.1/4.2 不勾选。

## F38 [active] 独立 reviewer 复核确认 4.5/4.6 不能勾选

独立 reviewer 于 2026-09-01 只读审查当前 HEAD `1068377`、manifest §26/§27 与 `tasks.md:31-36`，结论为 4.5、4.6、4.1、4.2 均不可勾选，且不建议放宽标准。dev 仍缺真实重复点击/乱序响应、同 session 亮色主题、artifact/静态资源全表和独立 verifier；preview 当前源码仍缺各键盘分支独立截图、session 内 hydration warning 单独清点、当前版本外点截图、详情 sticky 深滚动、亮色主题和可复核 HAR（临时 HAR 已删除）。若需调整，只允许用可审计的 request manifest+SHA 替代原始 HAR，并明确记录全站 hydration baseline；不能放宽双主题、当前源码键盘/外点、race、sticky 和每场景截图/DOM/console 要求。

## F39 [active] 修正 dev 无匹配截图断链

独立 reviewer 逐行核验 manifest §26/§27 的 29 个 PNG 引用，发现 §26 原“无匹配”引用 `dev-final-no-match-1280x900-20260901.png` 不存在；其余 28 个文件存在且 SHA-256 匹配。现已将该行改为“部分”：保留最终 dev session 已执行的 `never-match-20260901=0` 断言，但明确最终截图未落盘；现存 `dev-cdp-no-match-1280x900-20260901.png` 属于早期 partial session，不得替代同一 headed session 证据。因此该缺口继续阻塞 4.5/4.1，不启动新 session 仅为补图。

## F40 [active] dev 补证 session 完成但首载故障触发控制面止损

2026-09-01 在单一 session `todo-dev-final-20260901-k-e3381299a1aa`（Chrome 152.0.7977.54、agent-browser 0.35.0、1280×900）中完成亮色/暗色、最终无匹配截图、详情 sticky 深滚动、外点关闭焦点、Space/Arrow/Enter/Escape 分支截图和真实刷新重复点击 `calls=1`。去重网络摘要显示本地核心请求无业务非 2xx（artifact 200、tw.css 304、favicon.svg 200；唯一 404 为浏览器自动 `favicon.ico`），console 无 error。设置 artifact abort 后 reload 时 Chrome 退出 `DevToolsActivePort` exit 3，session 失去 tab；依据 use-agent-browser 止损规则不重启、不换 session、不伪造失败截图，关闭服务并 cleanup dry-run（CandidateCount=0）。本节只作为补证，不能替代首载失败/恢复、乱序响应、完整 Document/CSS/JS 资源表和独立 verifier，4.5/4.1/4.2 保持未勾选。

## F41 [active] 状态栏成功态补齐可访问性播报

独立 reviewer 静态审计指出 `TodoStatusBar` 成功分支没有 `role=status`/`aria-live`，筛选计数变化无法主动播报。按 TDD 先在 `todo-dashboard.component.test.ts` 增加成功态断言，首次运行 7 个测试中 1 个失败；随后仅给 artifact 成功态根节点增加 `role=status` 与 `aria-live=polite`，loading/error 分支继续使用各自的 status/alert 语义。修复后组件测试 7/7、`pnpm exec tsc --noEmit` 和串行 `pnpm docs:build`（66.78s）通过，提交为 `99bf185`（test）与 `416b7cf`（fix）。
