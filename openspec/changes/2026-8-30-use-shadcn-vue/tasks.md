# Tasks

> 唯一任务源。证据文件统一放 `evidence/`（本 tasks.md 指定的证据目录），过程文档按 `YYYY-MM-DD-*.md` 放 `notes/` 子目录。

## 1. 验收基线（已完成）

- [x] 1.1 浏览器盘点现状功能/视觉/交互，采集证据截图 8 张至 `evidence/01~08-*.png`（树形初始、展开、下拉图标+滚动条、选中筛选、详情面板、平铺、清空、暗色主题）
- [x] 1.2 量化指标记录：下拉 `overflow-y: scroll`、gutter 12px、图标 20 个、maxHeight 320px；选中后 content 卸载；147/699 筛选计数；`aria-label` 全集
- [x] 1.3 spec 需求清单固化为 `specs/todo-dashboard-explorer/spec.md`

## 2. 基础设施：Tailwind v4 + shadcn-vue CLI

- [x] 2.1 安装 `tailwindcss`、`@tailwindcss/vite` 与显式 `vite@5.4.21` 类型依赖，接入 `docs/.vitepress/config.ts` 的 `vite.plugins`（证据：依赖版本、配置 diff、串行 `pnpm docs:build` exit 0、`pnpm exec tsc --noEmit` exit 0）
- [x] 2.2 新建 `docs/.vitepress/theme/tw.css`：仅导入 `tailwindcss/theme.css` 与 `tailwindcss/utilities.css`（不导入 preflight）+ `@theme inline` 完整桥接 Teek/VitePress 变量（design.md D3 映射表；证据：tw.css、TodoDashboard 入口、串行构建）
- [ ] 2.3 回归门禁：普通文档页（首页、topics、prompts）渲染与重构前一致（截图对比）
- [x] 2.4 shadcn-vue CLI 初始化：生成 `components.json`（components 路径指向 `docs/.vitepress/theme/components`），按 design.md D7 保留 reka-ui 依赖；CLI 适配失败则按官方模板手工落盘并记录到 `agent-findings.md`（证据：`shadcn-vue info --json` exit 0，resolvedPaths.ui 正确）
- [x] 2.5 建立 `evidence/manifest.md` 与三环境验收矩阵，固定 agent-browser headed Chrome session、URL、viewport、版本、命令和截图哈希字段（证据：manifest 模板与 production 参考采集记录；dev/preview/production 运行仍由 4.5–4.7 验收）

## 3. 组件重构（每完成一项跑一次 spec 冒烟）

- [x] 3.1 `ui/Select.vue` 替换为 shadcn-vue `Select`：保留可见性图标（public 开锁/brand、private 闭锁/gray）、320px max-height、常驻滚动条（`overflow-y: scroll`）、清空按钮（证据：CLI 生成 `ui/select/` 组合组件、串行 build、DOM 样式断言）
- [x] 3.2 弹层交互回归：选中关闭 / 外点关闭 / Escape 关闭，三者均验证 content 从 DOM 卸载与焦点回到触发器（D6 动画策略；证据：manifest §18 修复后 headed Chrome session 三路径 `aria-expanded=false`、Portal options=0、activeElement 为仓库触发器）
- [x] 3.3 `ui/Button.vue`、`ui/Input.vue` 替换为 shadcn-vue 对应组件（变体：default/ghost；证据：CLI 生成 `ui/button/`、`ui/input/` 组合组件，attrs/modelValue/disabled 透传，`pnpm exec tsc --noEmit` 与串行 `pnpm docs:build` 通过）
- [x] 3.4 `ui/Resizable*.vue` 替换为 shadcn-vue `Resizable`（保持 `auto-save-id` 与最小宽度约束；证据：CLI 生成 `ui/resizable/` canonical 组件、keyboard-resize-by=4、agent-browser separator/最小宽度 DOM smoke、tsc/build 通过）
- [ ] 3.5 `TodoDashboard.vue`、`TodoFilters.vue`、`TodoStatusBar.vue`、`TodoTree.vue`、`TodoFlatList.vue`、`TodoDetails.vue`、`TodoNodeIcon.vue` 视觉层改写为 Tailwind 语义工具类（保留业务逻辑与 `aria-*` 标注）；树连接线/折叠过渡仅允许少量 scoped 微调。已修复 VitePress `.vp-doc ul` marker 覆盖（`!list-none !p-0`），并在 `evidence/manifest.md` §12 留有无点截图与 DOM 证据；剩余视觉/交互证据按本节新的分层验收协议补齐
- [x] 3.6 删除旧手写样式残留：`ui/` 目录无 `<style scoped>`，Portal 滚动仅保留必要的全局选择器；证据：`rg -n "<style scoped" docs/.vitepress/theme/components/ui` 无匹配，串行 `pnpm docs:build` exit 0
- [x] 3.7 补齐键盘导航、焦点回收、禁用态、首次加载失败、刷新竞态与组合筛选边界的实现和测试（对应 spec）：`test:components` 7/7 覆盖 Enter/Space/ArrowUp/ArrowDown/Escape、选中提交、close-auto-focus 焦点回收、刷新 disabled/aria-busy、首次失败/重试和 single-flight；既有纯函数测试覆盖四维交集/无匹配，真实 outside 关闭焦点由 manifest §20 headed Chrome 复验

## 4. 全量回归与部署

- **验收协议（2026-09-01 重设计）**：每个环境按“能力探针 → 产品核心矩阵 → 故障/资源补证 → 独立复核”四层执行。能力探针不计业务通过；产品核心矩阵必须在该环境唯一 headed session 内完成；故障/资源补证可在同一 session 的稳定阶段执行，若必须 reload 且控制面失败，只记录 `blocked`，不得换 session 拼接。证据状态统一为 `pass`、`partial`、`blocked`、`not-run`；只有所有适用硬门禁为 `pass` 才能勾选任务。
- [ ] 4.1 统一验收协调：dev/preview/production 各自先执行一次不超过 5 分钟的能力探针（`skills get core`、`doctor --offline --quick`、session 注册、headed 前台 visibility、一次截图、network requests、session close）；探针失败立即标记 `blocked` 并停止该环境。探针通过后，读取并登记 `evidence/01~08-*.png` 对应基线（绝对路径、尺寸、SHA-256、可见事实），再按 spec Scenario 记录唯一 session、命令、截图、DOM/网络/console 与证据状态；不得跨环境或跨 session 拼接。
- [ ] 4.2 亮/暗主题视觉回归：固定 URL、viewport、滚动位置、字体加载和 artifact 版本；对动态时间、光标、网络状态等区域使用明确 mask 或单独断言，同时记录原始 diff、归一化 diff 和结构性视觉结论。像素差百分比不再单独作为自动失败阈值；出现无法解释的结构漂移、marker、页面级滚动、主题变量失效时才判定失败。基线缺少元数据时只能标记 `参考`，不能伪造 before/after 通过
- [x] 4.3 `pnpm docs:build` 构建通过（串行 exit 0，55.71s）+ `pnpm exec prettier --experimental-cli --check` 通过（本轮变更文件，排除用户既有 `docs/prompts/index.md`）
- [ ] 4.4 普通文档页像素回归门禁复验（对应 2.3）：作为独立旁路 checkpoint，单独注册 session 和基线，不进入 TODO 核心 session；必须有重构前/后同 URL、同 viewport、同主题的可回放截图或明确 `参考/blocked` 结论
- [ ] 4.5 dev 环境：`pnpm docs:dev -- --host 127.0.0.1 --port 8080`；能力探针通过后只创建一个具名 headed Chrome session，在同一 session 内完成产品核心矩阵（首屏、筛选、下拉滚动与清空、树/平铺、详情、键盘、亮暗主题、页面/面板滚动）。故障/资源补证优先使用不 reload 的 fetch/route 控制；只有控制面稳定时才执行首载失败/恢复。真实重复点击必须记录请求计数；single-flight 下不存在第二并发请求时，标记“结构性不适用”并以单元测试/DOM 断言替代，不强行制造乱序。每个核心 Scenario 归档截图、操作日志、DOM/网络/console；控制面故障不得换 session，4.5 仅在核心矩阵与适用补证均为 `pass` 时勾选
- [ ] 4.6 preview 环境：先执行 `pnpm docs:build`，再执行 `pnpm docs:preview -- --host 127.0.0.1 --port 4173`；能力探针通过后只创建一个 headed Chrome session，按 4.5 的产品核心矩阵复跑，并额外登记 artifact 同源 URL、规范化资源请求清单（URL/类型/状态/必要时 SHA-256）、session 初始 hydration 基线和新增 console 错误。原始 HAR 仅作可选临时材料，清理后以规范化清单作为可复核证据；reload 失败只标记 `blocked`，不启动替代 session
- [ ] 4.7 production/Flex 外部门禁：先取得部署 commit SHA、Pages/生产 URL 和 Flex 操作授权；未取得外部回执时只标记 `blocked`，不启动生产浏览器或伪造切流。授权后每个部署候选只用一个 headed session 复验已通过的核心矩阵；关键 Scenario、主题、页面级滚动或 console/network 失败立即停止。真实回滚必须记录切流前后版本、操作者/时间、流量器返回状态、生产 URL，并在同一生产 session 内复验首屏、下拉关闭、键盘焦点、主题、页面滚动五项

## 5. 收尾

- [x] 5.1 按 init-ai-md 的交互与增量规则更新 AGENTS/CLAUDE 技能表（补齐官方 `unovue/shadcn-vue` 来源、`skills-lock.json` 哈希、Prettier/skills 安装器边界）；已确认 `AGENTS.md` 与 `CLAUDE.md` 内容一致，项目不存在 `GEMINI.md` 且未创建；不得为满足清单擅自新建或覆盖用户记忆文件
- [ ] 5.2 归档本 change（`openspec archive`），沉淀 `openspec/specs/todo-dashboard-explorer/`；仅当所有适用硬门禁为 `pass`、外部部署/Flex 有回执、证据索引路径与 SHA 校验无缺失时执行，`partial/blocked/not-run` 均禁止归档

## 回归记录

### 4.8 能力探针记录模板

|          环境          | 探针 session | headed/visibility | doctor | screenshot | network |      结果      |
| :--------------------: | :----------: | :---------------: | :----: | :--------: | :-----: | :------------: |
| dev/preview/production |    待执行    |      待执行       | 待执行 |   待执行   | 待执行  | `pass/blocked` |

### 4.9 产品与故障矩阵记录模板

|  checkpoint   | 同一 session | 真实用户动作 | DOM/网络/console | 截图+SHA |                 状态                  |
| :-----------: | :----------: | :----------: | :--------------: | :------: | :-----------------------------------: |
|   产品核心    |    待执行    |    待执行    |      待执行      |  待执行  |        `pass/partial/blocked`         |
| 故障/资源补证 |    待执行    |    待执行    |      待执行      |  待执行  | `pass/partial/blocked/not-applicable` |

### 4.10 独立复核与提交前门禁

- reviewer 只读核对任务源、manifest、截图路径、PNG 尺寸、SHA-256、日志和状态映射；不要求为了“独立”再开第二个浏览器。
- 提交前必须输出 `checked / missing / mismatched / unreferenced` 汇总；`missing` 或 `mismatched` 大于 0 时不得勾选或归档。
- `blocked` 是控制面/外部权限事实，不能改写为产品 `fail`，也不能改写为 `pass`；必须登记下一次可执行的动作和停止原因。

每个环境/主题至少一行，字段顺序固定：日期、环境、Requirement/Scenario、URL、viewport、Chrome/agent-browser 版本、session、启动/操作命令、DOM/网络/console 断言、截图路径与 SHA-256、结论（通过/参考/失败）。失败项必须同时引用日志和回滚记录；只有“通过”行才能支撑任务勾选。

（执行 4.1 时在此追加日期化记录，或引用 `notes/` 下对应文档）
