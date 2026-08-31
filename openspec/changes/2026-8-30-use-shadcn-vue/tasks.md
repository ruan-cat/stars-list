# Tasks

> 唯一任务源。证据文件统一放 `evidence/`（本 tasks.md 指定的证据目录），过程文档按 `YYYY-MM-DD-*.md` 放 `notes/` 子目录。

## 1. 验收基线（已完成）

- [x] 1.1 浏览器盘点现状功能/视觉/交互，采集证据截图 8 张至 `evidence/01~08-*.png`（树形初始、展开、下拉图标+滚动条、选中筛选、详情面板、平铺、清空、暗色主题）
- [x] 1.2 量化指标记录：下拉 `overflow-y: scroll`、gutter 12px、图标 20 个、maxHeight 320px；选中后 content 卸载；147/699 筛选计数；`aria-label` 全集
- [x] 1.3 spec 需求清单固化为 `specs/todo-dashboard-explorer/spec.md`

## 2. 基础设施：Tailwind v4 + shadcn-vue CLI

- [ ] 2.1 安装 `tailwindcss`、`@tailwindcss/vite`，接入 `docs/.vitepress/config.ts` 的 `vite.plugins`
- [ ] 2.2 新建 `docs/.vitepress/theme/tw.css`：仅导入 `tailwindcss/theme.css` 与 `tailwindcss/utilities.css`（不导入 preflight）+ `@theme inline` 完整桥接 Teek/VitePress 变量（design.md D3 映射表）
- [ ] 2.3 回归门禁：普通文档页（首页、topics、prompts）渲染与重构前一致（截图对比）
- [ ] 2.4 shadcn-vue CLI 初始化：生成 `components.json`（components 路径指向 `docs/.vitepress/theme/components`），按 design.md D7 保留 reka-ui 依赖；CLI 适配失败则按官方模板手工落盘并记录到 `agent-findings.md`

## 3. 组件重构（每完成一项跑一次 spec 冒烟）

- [ ] 3.1 `ui/Select.vue` 替换为 shadcn-vue `Select`：保留可见性图标（public 开锁/brand、private 闭锁/gray）、320px max-height、常驻滚动条（`overflow-y: scroll`）、清空按钮
- [ ] 3.2 弹层交互回归：选中关闭 / 外点关闭 / Escape 关闭，三者均验证 content 从 DOM 卸载（D6 动画策略）
- [ ] 3.3 `ui/Button.vue`、`ui/Input.vue` 替换为 shadcn-vue 对应组件（变体：default/ghost）
- [ ] 3.4 `ui/Resizable*.vue` 替换为 shadcn-vue `Resizable`（保持 `auto-save-id` 与最小宽度约束）
- [ ] 3.5 `Todo*.vue` 业务组件视觉层改写为 Tailwind 工具类（保留业务逻辑与 `aria-*` 标注）
- [ ] 3.6 删除旧手写样式残留，确认无 `<style scoped>` 大块残留在 ui/ 组件中（D5）
- [ ] 3.7 补齐键盘导航、焦点回收、禁用态、首次加载失败、刷新竞态与组合筛选边界的实现和测试（对应 spec）

## 4. 全量回归与部署

- [ ] 4.1 逐条执行 `specs/todo-dashboard-explorer/spec.md` 全部 Scenario，截图对照 `evidence/` 基线，结果记入本文件下方"回归记录"
- [ ] 4.2 亮/暗双主题下截图比对（对照 `evidence/01/08`）
- [ ] 4.3 `pnpm docs:build` 构建通过 + `pnpm exec prettier --experimental-cli --check` 通过
- [ ] 4.4 普通文档页像素回归门禁复验（对应 2.3）
- [ ] 4.5 合并 main 推送部署，记录 commit SHA/生产 URL，使用真实浏览器完成下拉、键盘、主题、滚动与 Portal 卸载复验；任一关键场景失败立即停止并按提交执行回滚

## 5. 收尾

- [ ] 5.1 按 init-ai-md 更新 AGENTS/CLAUDE/GEMINI 技能表（shadcn-vue 最佳实践 skill 条目，来源与锁文件约束）
- [ ] 5.2 归档本 change（`openspec archive`），沉淀 `openspec/specs/todo-dashboard-explorer/`

## 回归记录

（执行 4.1 时在此追加日期化记录，或引用 `notes/` 下对应文档）
