# 2026-08-31 OpenSpec shadcn-vue 任务工件验收审核

> 本审核由 Codex（主代理）协调探索、编辑和复核代理完成。结论只基于当前工作区、OpenSpec CLI、项目测试和官方技能检索结果；不把截图或结构校验当成功能完成证明。

## 1. 结论

当前 change **仍不通过最终验收，不得归档**。规划工件结构有效，实施已部分推进但浏览器与部署门禁尚未闭环。初次审核时 CLI 报告总任务 20、完成 3、剩余 17；按用户确认补充可访问性与三环境浏览器验收任务后，当前总任务为 24、完成 14、剩余 10。

## 2. 完整性与实现证据

- 已完成：`tasks.md` 1.1–1.3（基线截图、量化指标、spec 固化）。
- 已完成：2.1、2.2、2.4、2.5、3.1–3.4、3.6–3.7、4.3，并有 CLI/tsc/test/build/Prettier/ headed Chrome 证据；3.5、2.3、4.1–4.2、4.4–4.7、5.1–5.2 仍未闭环。
- 当前源码已接入 Tailwind v4、官方 shadcn-vue 生成子组件和业务视觉迁移；仍保留少量树连接线/过渡 scoped 微调，且缺少 900/720px 与三环境 headed Chrome 的真实证据，不能把构建通过当作视觉/交互完成。
- `openspec validate ... --strict` 只证明工件格式有效，不能证明实现或场景通过。

## 3. 证据质量与口径问题

- `evidence/` 有 8 张 PNG，但缺少采集 URL、浏览器版本、fresh 运行日志、DOM/滚动/卸载断言及哈希，无法独立复核。
- 当前 `pnpm todo:test` 实测 30/30 通过；工件中“17/17”是过时口述，不能作为本轮回归证据。
- artifact 当前 `repositoryCount=78`、`scannedRepositoryCount=51`、`todoCount=699`、`errorCount=0`，并有 skipped/branch_unavailable 项；“78 个仓库 complete”需要明确统计口径。
- 定向 `pnpm exec prettier --experimental-cli --check .agents/skills/shadcn-vue/SKILL.md skills-lock.json` 曾为 exit 1。用户已确认允许 Prettier 直接格式化上游技能目录与锁文件，不新增 ignore 配置，也不重跑 skills 安装器/hash 关系校验；该风险已记录为接受的流程约束。
- 规格尚未覆盖键盘导航、焦点回收、禁用态、刷新竞态、组合筛选边界等可访问性和边界行为。

## 4. 官方技能修正证据

通过 `npx skills find shadcn-vue` 找到 `unovue/shadcn-vue@shadcn-vue`（约 4.1K installs）；Context7 解析到官方库 `/unovue/shadcn-vue`，并返回 CLI、Vite + Tailwind v4、Select/Input/Button 与 `@theme inline` 文档。随后以项目级命令安装官方技能包，`pnpm dlx skills list --json` 显示：

```log
name=shadcn-vue
scope=project
source=unovue/shadcn-vue
sourceType=github
```

根目录已生成 `skills-lock.json`，记录 `source=unovue/shadcn-vue`、`skillPath=skills/shadcn-vue/SKILL.md` 与 `computedHash`；原手写同路径内容已被官方多文件技能包替换。`AGENTS.md` 与 `CLAUDE.md` 的技能表已做增量更新；仓库不存在 `GEMINI.md`。

## 5. 重新进入实施前的门槛

1. 按 `tasks.md` 顺序完成 3.5、3.7，并用官方 CLI/模板证据记录非标准 `docs/.vitepress` 路径处理。
2. 为普通文档页像素不变、双主题、三种关闭路径和无页面双滚动补 fresh 浏览器/CDP 证据。
3. 修正 artifact 统计文案和 spec 边界场景，补齐失败/竞态/键盘可访问性验证。
4. 只有任务逐项有命令或浏览器输出后，才可勾选 4.x/5.x 并运行归档流程。

## 6. 本轮验收协议加固

用户确认后，已将 agent-browser + Google Chrome headed 的三环境验收协议写入 proposal/spec/design/tasks，并新增 `evidence/manifest.md` 模板：

- dev：`pnpm docs:dev -- --host 127.0.0.1 --port 8080` → `http://127.0.0.1:8080/todos.html`
- preview：`pnpm docs:build` + `pnpm docs:preview -- --host 127.0.0.1 --port 4173` → `http://127.0.0.1:4173/todos.html`
- production：`https://ruan-cat.github.io/stars-list/todos.html`

统一要求记录 headed Chrome/agent-browser session、viewport、URL、命令、DOM/网络断言、截图哈希，并在生产失败时停止验收、回滚后复验。上述三环境正式矩阵尚未完成，相关任务仍保持未勾选；已有生产/dev 普通文档参考截图和局部 Select/Resizable DOM smoke 不能替代它们。

## 7. 基础设施推进记录

随后已完成 tasks 2.1–2.2、2.4–2.5、3.1–3.4、3.6–3.7、4.3、5.1：安装 `tailwindcss@4.3.3` 与 `@tailwindcss/vite@4.3.3`，在 VitePress 注册 Tailwind 插件，新增无 preflight 的 `theme/tw.css` 并由 TodoDashboard 入口加载；通过 CLI 生成并修正 `components.json`、Select、Button、Input、Resizable 官方子组件和 `evidence/manifest.md`。Todo\* 静态视觉迁移已完成，补上状态统计、连接线、焦点 ring、刷新焦点恢复和组合筛选测试；修复 preset 覆盖 `vite.plugins` 导致 Tailwind utilities 未生成的问题，并补充 `@source`/显式 utilities 入口；新增 Vitest + Vue Test Utils + happy-dom 组件测试，`pnpm test:components` 7/7 通过；Select 外点关闭改为监听 close-auto-focus 并以双 RAF/延迟兜底恢复焦点，fresh preview headed Chrome 三路径通过；串行 fresh `pnpm docs:build` exit 0（61.29s），本轮变更文件 Prettier check exit 0。一次并行构建出现 `.vitepress/.temp` 临时文件竞争，已记录为 F14，后续构建验收必须串行。当前总任务 24 项，完成 15 项，剩余 9 项；2.3、3.5、4.1–4.2、4.4–4.7、5.2 仍不得提前勾选。

## 8. 2026-08-31 工件加固与未验证门禁

- 状态栏现在明确显示总仓库、已扫描、跳过、未授权、分支不可用、失败、错误和扫描完整度；无 artifact 时只显示加载/错误/暂无数据，不伪造零值。
- 3.5 业务组件均改用 Tailwind 语义类；`ui/` 目录已无 `<style scoped>`，Select 只保留 Portal 必需的全局滚动规则，TreeToggle 已去除旧 VP 变量样式。
- 组合筛选新增仓库+分支+类型交集测试；树/平铺行加入 focus-visible ring；刷新结束后恢复真实触发按钮焦点；详情区采用父面板隐藏溢出、子区唯一滚动的结构。
- 独立 reviewer 仍将刷新竞态和三环境 headed Chrome 完整视觉矩阵列为未验证门禁；一次 Chrome 自动启动出现 `DevToolsActivePort` exit 3，清理旧 dev 进程后已在新 session 成功复验 900/720px，F21 作为间歇性风险保留，禁止伪造其余未完成门禁。

## 9. 2026-08-31 基线视觉复核：TodoTree marker 回归

用户指出当前截图左侧出现基线不存在的黑色圆点。直接读取 `evidence/01-tree-initial.png` 后确认基线确实无 marker；Chrome computed style 进一步证明是 VitePress `.vp-doc ul` 覆盖普通 Tailwind `list-none/p-0`。已使用 `!list-none !p-0 !m-0` 修复，冷启动 dev 复验 `listStyle=none`、`paddingLeft=0`，并将无点截图与实际 PNG 尺寸登记到 `evidence/manifest.md` §12。原 1600×1000 基线与当前 929×869 截图不做直接像素结论，2.3/4.4 仍待同 viewport before/after。

## 10. 2026-08-31 preview 局部矩阵与 hydration 警告边界

preview 已用 headed Chrome 完成下拉选中/清空、Escape/外点关闭与焦点回收、树/平铺/详情、刷新 disabled/aria-busy/焦点恢复、亮暗主题截图和 artifact HTTP 200 验证；证据登记在 manifest §13。reload 后的 `Hydration completed but contains mismatches` 在普通首页同样出现，按全站基线警告记录；TODO 专属 `InvalidStateError` 未重现。完整 spec 矩阵、无新增 console 证明和 production 部署仍未完成，不能勾选 4.6 或最终验收任务。

## 11. 既有截图未先读取的流程纠偏

用户复核指出，验收时若只看 fresh 截图而不先打开 `evidence/01-tree-initial.png` 等既有图片，就可能漏掉“项目不应出现的黑色列表圆点”。该流程缺口已写入 `evidence/manifest.md` §3.1 与 `tasks.md` 4.1：每个环境开始前先读取对应 PNG，登记绝对路径、尺寸、SHA-256 和可见事实；同视口对照前不得把 DOM、构建或截图存在本身当作视觉通过。`01-tree-initial.png` 明确记录为无 marker 基线，出现额外圆点、缩进、滚动条或布局漂移时必须停止验收并留存失败证据。

## 12. init-ai-md 增量更新记录

按 `init-ai-md` 的章节扫描结果，`AGENTS.md` 与 `CLAUDE.md` 原内容一致，均已存在项目技能表；本轮仅增量补充 `shadcn-vue` 的官方来源、skills 安装器锁文件边界、Prettier 授权边界，并确认 `GEMINI.md` 不存在且未创建。当前执行器未提供可用的 AskUserQuestion 交互工具，因此依据用户已明确授权的“按 init-ai-md 更新 AI 记忆文档”要求，对两份原本一致的文件应用相同精准补丁；未全量替换、未改全局 skills、未新增 ignore 配置。
