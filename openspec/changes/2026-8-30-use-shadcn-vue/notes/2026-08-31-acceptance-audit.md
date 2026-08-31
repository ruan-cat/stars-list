# 2026-08-31 OpenSpec shadcn-vue 任务工件验收审核

> 本审核由 Codex（主代理）协调探索、编辑和复核代理完成。结论只基于当前工作区、OpenSpec CLI、项目测试和官方技能检索结果；不把截图或结构校验当成功能完成证明。

## 1. 结论

当前 change **不通过验收，不得归档**。规划工件结构有效，但实现任务尚未开始。初次审核时 CLI 报告总任务 20、完成 3、剩余 17；按用户确认补充可访问性任务后，当前总任务为 21、完成 3、剩余 18。

## 2. 完整性与实现证据

- 已完成：`tasks.md` 1.1–1.3（基线截图、量化指标、spec 固化）。
- 未完成：2.1–5.2 全部未勾选；`agent-progress.md` 也明确写着尚未动组件代码、Tailwind/shadcn-vue 未安装。
- 现状源码仍是 `reka-ui` 包装组件和 scoped CSS；没有 `components.json`，也没有 `tailwindcss` / `@tailwindcss/vite` 依赖或 Vite 插件接入。
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

1. 按 `tasks.md` 顺序完成 2.1–3.6，并用官方 CLI/模板证据记录非标准 `docs/.vitepress` 路径处理。
2. 为普通文档页像素不变、双主题、三种关闭路径和无页面双滚动补 fresh 浏览器/CDP 证据。
3. 修正 artifact 统计文案和 spec 边界场景，补齐失败/竞态/键盘可访问性验证。
4. 只有任务逐项有命令或浏览器输出后，才可勾选 4.x/5.x 并运行归档流程。
