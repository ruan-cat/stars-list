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
- [x] 3.2 弹层交互回归：选中关闭 / 外点关闭 / Escape 关闭，三者均验证 content 从 DOM 卸载（D6 动画策略；证据：agent-browser headed Chrome DOM eval 三路径 `contentExists=false`，焦点回收通过）
- [x] 3.3 `ui/Button.vue`、`ui/Input.vue` 替换为 shadcn-vue 对应组件（变体：default/ghost；证据：CLI 生成 `ui/button/`、`ui/input/` 组合组件，attrs/modelValue/disabled 透传，`pnpm exec tsc --noEmit` 与串行 `pnpm docs:build` 通过）
- [x] 3.4 `ui/Resizable*.vue` 替换为 shadcn-vue `Resizable`（保持 `auto-save-id` 与最小宽度约束；证据：CLI 生成 `ui/resizable/` canonical 组件、keyboard-resize-by=4、agent-browser separator/最小宽度 DOM smoke、tsc/build 通过）
- [ ] 3.5 `TodoDashboard.vue`、`TodoFilters.vue`、`TodoStatusBar.vue`、`TodoTree.vue`、`TodoFlatList.vue`、`TodoDetails.vue`、`TodoNodeIcon.vue` 视觉层改写为 Tailwind 语义工具类（保留业务逻辑与 `aria-*` 标注）；树连接线/折叠过渡仅允许少量 scoped 微调。已修复 VitePress `.vp-doc ul` marker 覆盖（`!list-none !p-0`），并在 `evidence/manifest.md` §12 留有无点截图与 DOM 证据；仍须补亮暗主题、完整交互矩阵和三环境截图
- [x] 3.6 删除旧手写样式残留：`ui/` 目录无 `<style scoped>`，Portal 滚动仅保留必要的全局选择器；证据：`rg -n "<style scoped" docs/.vitepress/theme/components/ui` 无匹配，串行 `pnpm docs:build` exit 0
- [ ] 3.7 补齐键盘导航、焦点回收、禁用态、首次加载失败、刷新竞态与组合筛选边界的实现和测试（对应 spec）；当前已补行级 focus-visible、刷新结束焦点恢复、single-flight 刷新守卫及仓库+分支+类型纯函数交集测试，preview 首次失败/刷新失败/恢复证据见 manifest §16，仍缺完整组件层键盘矩阵

## 4. 全量回归与部署

- [ ] 4.1 逐条执行 `specs/todo-dashboard-explorer/spec.md` 全部 Scenario，按下方“回归记录”逐项填写通过/失败、命令、session、截图和断言；任何一项缺证据不得勾选
- [ ] 4.2 亮/暗双主题下截图比对（对照 `evidence/01/08`），同时记录切换前后 viewport、滚动位置、控制台错误数和像素 diff 结论
- [x] 4.3 `pnpm docs:build` 构建通过（串行 exit 0，53.40s）+ `pnpm exec prettier --experimental-cli --check` 通过（本轮变更文件，排除用户既有 `docs/prompts/index.md`）
- [ ] 4.4 普通文档页像素回归门禁复验（对应 2.3）
- [ ] 4.5 dev 环境：`pnpm docs:dev -- --host 127.0.0.1 --port 8080` + agent-browser headed Chrome；逐项完成首屏/首载失败、仓库/分支/类型组合筛选、下拉滚动与清空、树展开/选中、平铺切换、详情链接、Tab/Enter/Escape 焦点、刷新禁用与竞态、亮暗主题、页面/面板滚动；每项归档截图、操作日志、DOM/网络/console 断言（当前仅有 §12 CSS/滚动与 marker 局部证据）
- [ ] 4.6 preview 环境：先执行 `pnpm docs:build` 再执行 `pnpm docs:preview -- --host 127.0.0.1 --port 4173`，使用 headed Chrome 完全复跑 4.5 矩阵，并额外核对 artifact 同源 URL、静态资源 HTTP 状态、基线 hydration 警告与无新增 console 错误；当前局部证据见 `evidence/manifest.md` §13，不能代替完整矩阵
- [ ] 4.7 合并 main 推送部署，记录部署 commit SHA、生产 URL、HTTP/资源状态；使用 headed Chrome 完全复跑 4.5 矩阵并验证 Portal 卸载。任一关键场景失败、页面级滚动、主题/像素回归或 console/network 回归立即停止验收，经 Flex 流量器切回上一个已知提交后，记录切流/回滚时间与结果，并用同一矩阵复验首屏、下拉关闭、键盘焦点、主题、页面滚动五项关键路径

## 5. 收尾

- [ ] 5.1 按 init-ai-md 的交互与增量规则更新 AGENTS/CLAUDE 技能表（补齐官方 `unovue/shadcn-vue` 来源、`skills-lock.json` 哈希、Prettier/skills 安装器边界）；若项目不存在 `GEMINI.md`，记录“未创建”的检查证据，不得为满足清单擅自新建或覆盖用户记忆文件
- [ ] 5.2 归档本 change（`openspec archive`），沉淀 `openspec/specs/todo-dashboard-explorer/`

## 回归记录

每个环境/主题至少一行，字段顺序固定：日期、环境、Requirement/Scenario、URL、viewport、Chrome/agent-browser 版本、session、启动/操作命令、DOM/网络/console 断言、截图路径与 SHA-256、结论（通过/参考/失败）。失败项必须同时引用日志和回滚记录；只有“通过”行才能支撑任务勾选。

（执行 4.1 时在此追加日期化记录，或引用 `notes/` 下对应文档）
