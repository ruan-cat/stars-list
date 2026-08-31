# agent-progress

## 当前 checkpoint

Phase 2（组件迁移）推进中。change `2026-8-30-use-shadcn-vue` 已完成 2.1、2.2、2.4、2.5、3.1–3.4、3.6–3.7、4.3、5.1；3.5 及普通文档页与三环境完整回归仍待真实浏览器门禁。

## 当前 task

当前任务：用户已授权重设计验收协议；`tasks.md`、spec、design、manifest 和 `use-agent-browser` 已统一采用“能力探针 → 产品核心矩阵 → 故障/资源补证 → 独立复核”四层模型。每环境先做 ≤5 分钟能力探针，再只创建一个 headed session；核心 TODO 路径仍是硬门禁，故障/资源允许结构化 `partial/blocked/not-applicable`，控制面失败不得换 session 拼接。4.5/4.6/4.1/4.2 仍保持未勾选，2.3/4.4 为独立旁路门禁，4.7 受 production/Flex 外部回执约束。

## 状态

- 验收基线已固化：`evidence/01~08-*.png`（8 张）+ 量化指标（下拉 overflow-y scroll / gutter 12 / 图标 20 / maxHeight 320px；选中后 content 卸载；筛选 147/699；aria 标注全集）。
- specs 需求 9 组 Requirement（含三环境浏览器验收与证据归档）全部源自现状盘点和本轮纠偏，是重构验收唯一来源。
- 已安装 `tailwindcss@4.3.3`、`@tailwindcss/vite@4.3.3` 与显式 `vite@5.4.21` 类型依赖，并在 VitePress 配置接入插件；新增 `theme/tw.css`（仅 theme/utilities，无 preflight）并由 TodoDashboard 入口加载。shadcn-vue CLI 已生成 `components.json`，修正 schema 后 resolvedPaths.ui 指向目标目录；Select、Button、Input、Resizable 已迁移，Todo\* 视觉层已静态迁移，仍待 3.5/3.7 的真实视觉与交互验收。

## 最近验证摘要

- 2026-08-31 串行 `pnpm docs:build`：exit 0，`build complete in 51.35s`；并行构建曾触发 `.vitepress/.temp` 缺失，已记录为环境竞争，不作为实现缺陷结论。
- `pnpm install --frozen-lockfile --offline --ignore-scripts`：exit 0，锁文件解析一致；`pnpm exec tsc --noEmit` exit 0；`pnpm todo:test` fresh 为 30/30 通过（数据层未动）。
- agent-browser headed Chrome 已采集 production 与 dev 首页/topics 参考截图（session、版本、viewport、URL、SHA-256 已登记）；dev prompts 截图超时但 DOM 可读，2.3 仍未通过。
- `pnpm dlx shadcn-vue@latest info --json`：exit 0，resolvedPaths.ui 正确；同版本 `add --dry-run` 明确提示未支持，已记录 F15。
- `pnpm dlx shadcn-vue@latest docs select`：exit 0；agent-browser headed Chrome Select smoke 验证选中关闭、Escape、外部关闭、清空、Portal 卸载和 `animation=none`/`overflowY=scroll`/`maxHeight=320px`。
- `pnpm dlx shadcn-vue@latest docs button input` 与 `add button input --yes` 完成；`pnpm exec tsc --noEmit` exit 0；串行 `pnpm docs:build` exit 0（51.60s）。
- `pnpm dlx shadcn-vue@latest docs resizable` 与 `add resizable --yes` 完成；Resizable separator/最小宽度 DOM smoke 通过；`pnpm exec tsc --noEmit` exit 0；串行 build exit 0（49.06s）。
- Select/TreeToggle 旧 scoped CSS 已移除，官方 SelectTrigger 重复 Chevron 已修正；TodoTree/TodoFlatList 增加 focus-visible ring，TodoDetails 采用唯一 `overflow-auto`，TodoDashboard 在刷新 pending 结束后恢复触发按钮焦点；`todo-tree.test.ts` 新增仓库+分支+类型交集测试（11/11 通过）。
- 2026-08-31 串行 `pnpm docs:build` exit 0（55.71s）；本轮变更文件 `pnpm exec prettier --experimental-cli --check` exit 0；3.6/4.3 的静态门禁已记录，未替代浏览器门禁。
- 2026-08-31 冷启动 headed Chrome 复验 Tailwind utilities：1280×900 `docScrollH=900`、nav `overflowY=auto`；720×900 group `display=block`、nav `overflowY=visible`、页面自然滚动；CSSRules 含 `.h-full/.overflow-auto/.bg-muted/.text-foreground`，截图和 SHA-256 已登记在 manifest 第 12 节。
- `use-todo-query.test.ts` 2/2 通过：single-flight 刷新守卫合并并发调用，结算后允许下一次请求；`todo-tree.test.ts` 已覆盖搜索+仓库+路径+分支+类型交集和无匹配空树；新增 Vitest + Vue Test Utils + happy-dom 组件套件 `pnpm test:components` 7/7 通过，覆盖 Enter/Space/ArrowUp/ArrowDown/Escape、close-auto-focus、初载失败/重试、刷新 disabled/aria-busy、single-flight 与焦点回收。
- preview headed Chrome 已完成下拉/清空/Escape/外点/树平铺/详情/刷新禁用与焦点恢复、亮暗稳定截图和 artifact HTTP 200；hydration mismatch 与普通首页同为全站基线警告，详情见 manifest §13。
- preview 受控故障注入已完成：fetch 拒绝时显示刷新失败 alert，恢复 fetch/解除 route 后真实刷新显示成功反馈，焦点回到刷新按钮；截图和 SHA-256 见 manifest §16。
- preview 首次加载失败也已受控验证：清空 local/session storage 后在 reload 前 abort artifact，状态栏和页面错误态均显示失败且无伪造统计；解除 route 后刷新恢复，证据见 manifest §16。
- 同 viewport 1600×1000 preview 树形截图与 `evidence/01-tree-initial.png` diff 为 4.60%（73642/1600000），标记参考，不能勾选 2.3/4.4；marker 本身已通过 `listStyle=none`/`paddingLeft=0` 验证。
- Select 外点关闭在 fresh preview headed Chrome 中首次复现焦点落 BODY；随后以 Reka `close-auto-focus` + 双 RAF + 延迟 fallback 修复，新的 `shadcn-preview-fix-e3381299a1aa` session 三路径均 `aria-expanded=false`、Portal options=0、activeElement 为仓库触发器，截图与哈希登记在 manifest §20。
- 组件测试基础设施已分组提交：`bd63e6f`（依赖）与 `87b96ac`（测试）；Select 焦点修复提交 `23166cf`；验收证据提交 `002dd20`。按 init-ai-md 增量规则同步更新 AGENTS/CLAUDE，确认 GEMINI 不存在且未创建。
- TODO 核心 dev fresh session `todo-core-dev-cdp-e3381299a1aa` 已补首屏、下拉滚动、四维组合筛选/无匹配、树详情、平铺、暗色、刷新焦点和 720px 截图；发现并修复 hydration 后 viewportReserve 未重测与 refresh currentTarget 包装层兜底问题，证据见 manifest §23。4.5 仍因首次失败注入、网络/竞态和完整键盘矩阵缺口未勾选。
- 2026-09-01 `todo-dev-full-20260901` 在 1280×900 首屏 snapshot/截图成功；reload 后 agent-browser daemon 返回 EOF，但 Chrome PID 33236 与 CDP 9227 仍可达。已关闭 dev server/session，未换 session 拼接；F32 记录该控制面故障，4.5 不勾选。
- 2026-09-01 `agent-browser doctor --offline --quick` 为 7 pass/0 warn/0 fail；唯一 dev headed 启动 session `todo-dev-20260901-a` exit 3，单次 `--no-sandbox` 恢复连接拒绝，已停止服务/session，F33 记录为控制面阻塞，未再开浏览器。
- 2026-09-01 手工 Chrome+CDP session `todo-dev-cdp-20260901-c`（Chrome 151.0.7922.174/9229）完成 7 张 TODO 部分截图和 DOM 断言；平铺 PNG 首次 timeout 后改一次 JPEG 低负载采集，Escape 键盘路径仍为 BODY/控制面不可观察，F34 记录，已停止服务/session。
- 2026-09-01 preview session `todo-preview-fix-20260901-d`（Chrome 151.0.7922.174/9231）完成关键路径：Escape/外点/选中焦点回收、artifact 200、下拉 320px/scrollTop 368、平铺 699 行、暗色主题、刷新失败/恢复；截图哈希登记 manifest §25，仍缺完整 4.6 矩阵，已停止服务/session。
- 2026-09-01 最终可见 dev session `todo-dev-final-20260901-h`（Chrome 151.0.7922.174/9239）完成首屏、首次失败/恢复、筛选/清空、下拉/滚动、树详情、平铺、Tab/Space/Arrow/Enter/Escape、刷新 pending/失败/成功、双主题、桌面/720px 滚动；artifact HTTP 200，console 清空后无新增错误，证据登记 manifest §26。仍缺重复点击竞态请求计数/资源全表，4.5 未勾选，已停止服务/session。
- 2026-09-01 当前源码 preview session `todo-preview-final-20260901-j`（Chrome 151.0.7922.174/9241）完成 §27 近完整矩阵：artifact/静态资源 200、首次失败/恢复、race 两次点击仅 1 fetch、筛选/下拉/树平铺/键盘/主题/720px/滚动；仍缺个别键盘截图与独立 verifier，4.6 未勾选，已停止服务/session。
- 2026-09-01 独立 reviewer 复核当前 HEAD `1068377` 与 manifest §26/§27，确认 4.5/4.6/4.1/4.2 不可勾选且标准不建议放宽；F38 固化剩余缺口与可接受的 request manifest+SHA 等价证据边界。
- 2026-09-01 独立 reviewer 继续逐行核验 §26/§27 的 29 个 PNG 引用，发现 §26 原“无匹配”截图路径断链；已在 manifest §26 改为“部分”，明确最终 dev session 只保留 `never-match-20260901=0` 断言，早期 `dev-cdp-no-match` 不得替代同一 session 截图。该证据缺口继续阻塞 4.5/4.1，未新开浏览器 session 补图。
- 2026-09-01 dev 补证 session `todo-dev-final-20260901-k-e3381299a1aa` 补齐亮/暗主题、无匹配、sticky 深滚动、键盘分支截图、外点焦点与 single-flight `calls=1`；artifact 200、tw.css 304、favicon.svg 200，console 无 error。受控 artifact abort 后 reload 触发 Chrome `DevToolsActivePort` exit 3，按止损规则不换 session；F40 与 manifest §28 记录，4.5/4.1/4.2 仍未勾选。
- 2026-09-01 按 reviewer P2 建议补齐状态栏成功态 `role=status`/`aria-live=polite`；TDD 先红后绿，组件测试 7/7、tsc/build 通过，提交 `99bf185` + `416b7cf`，不改变验收门禁状态。
- 2026-09-01 产出并提交事故/门槛设计审计报告 `docs/reports/2026-09-01-shadcn-vue-agent-browser-acceptance-incident.md`（`01d19b9`），明确 agent-browser 能力边界、验收打法过度点、延误责任与 5 分钟能力探针/分层矩阵/时间盒改进方案；未擅自放宽 tasks 或归档。
- 2026-09-01 用户确认重设计验收协议：tasks/spec/design/manifest 已改为“能力探针 → 产品核心矩阵 → 故障/资源补证 → 独立复核”四层；保留同环境唯一 session 与证据链底线，增加 `pass/partial/blocked/not-run` 状态、single-flight 结构性不适用规则、规范化资源清单 + SHA、像素 diff mask/归一化规则和二次同类控制面故障即止损。
- 2026-09-01 对照事故报告逐项补齐剩余落差：能力探针增加可选 A2 reload 探针（失败只阻塞 C reload 子项）；曾暂设 mask 后归一化 diff `≤1%` 参考阈值，随后按用户 F45 响应式纠偏撤销统一百分比硬门禁，改为同 viewport 诊断 diff + 结构性结论。
- 2026-09-01 用户指出响应式页面不应被跨 viewport 像素 diff 否决；已撤销统一百分比硬门禁，改为同 viewport 诊断 diff + 响应式结构性硬门禁（桌面双滚动、窄屏堆叠、marker/缩进、主题变量、sticky）。历史 §15 的 4.60% 仅保留为审计事实。

## 阻塞点

- 2.3 普通文档页像素回归尚未执行；它是后置的旁路回归门禁，不改变本 change 的 TODO 主目标；manifest 已建立但 dev/preview/production 正式验收证据尚未齐全。
- production 当前仍为旧部署（线上 head `1c468f4`，本地 HEAD `c90abb1` 未 push）；4.7 需 main 合并、Pages 成功和 Flex 外部切流/回滚回执，不能用 HTTP 200 代替。生产基线与资源状态见 manifest §14。

## 下一步

1. 按新协议先为目标环境执行 ≤5 分钟能力探针；探针失败即记录 `blocked`，不进入长矩阵。
2. 在单一 headed session 内先完成 TODO 产品核心矩阵，再执行不 reload 优先的故障/资源补证和提交前 `checked/missing/mismatched/unreferenced` 校验。
3. 只有用户明确授权生产部署/Flex 操作后，才执行 4.7；全部适用硬门禁通过后再考虑归档。
