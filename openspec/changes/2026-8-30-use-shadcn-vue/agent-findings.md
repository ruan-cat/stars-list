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
