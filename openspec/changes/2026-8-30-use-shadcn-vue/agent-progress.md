# agent-progress

## 当前 checkpoint

Phase 2（组件迁移）推进中。change `2026-8-30-use-shadcn-vue` 已完成 2.1、2.2、2.4、2.5、3.1、3.2、3.3、3.4、3.6、4.3；3.5/3.7 及普通文档页与三环境回归仍待真实浏览器门禁。

## 当前 task

当前任务：`tasks.md` 3.5（Todo\* 视觉层迁移）；2.3 普通文档页像素回归因缺同口径 before baseline 延后到最终回归阶段补齐。

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
- 2026-08-31 串行 `pnpm docs:build` exit 0（51.21s）；本轮变更文件 `pnpm exec prettier --experimental-cli --check` exit 0；3.6/4.3 的静态门禁已记录，未替代浏览器门禁。
- 2026-08-31 冷启动 headed Chrome 复验 Tailwind utilities：1280×900 `docScrollH=900`、nav `overflowY=auto`；720×900 group `display=block`、nav `overflowY=visible`、页面自然滚动；CSSRules 含 `.h-full/.overflow-auto/.bg-muted/.text-foreground`，截图和 SHA-256 已登记在 manifest 第 12 节。
- `use-todo-query.test.ts` 2/2 通过：single-flight 刷新守卫合并并发调用，结算后允许下一次请求；3.7 的刷新竞态实现已有单测，但完整组件键盘/失败恢复仍待 headed Chrome。
- preview headed Chrome 已完成下拉/清空/Escape/外点/树平铺/详情/刷新禁用与焦点恢复、亮暗稳定截图和 artifact HTTP 200；hydration mismatch 与普通首页同为全站基线警告，详情见 manifest §13。
- preview 受控故障注入已完成：fetch 拒绝时显示刷新失败 alert，恢复 fetch/解除 route 后真实刷新显示成功反馈，焦点回到刷新按钮；截图和 SHA-256 见 manifest §16。
- 同 viewport 1600×1000 preview 树形截图与 `evidence/01-tree-initial.png` diff 为 4.60%（73642/1600000），标记参考，不能勾选 2.3/4.4；marker 本身已通过 `listStyle=none`/`paddingLeft=0` 验证。

## 阻塞点

- 2.3 普通文档页像素回归尚未执行；manifest 已建立但 dev/preview/production 正式验收证据尚未齐全。
- production 当前仍为旧部署（线上 head `1c468f4`，本地 HEAD `fe960ab` 未 push）；4.7 需 main 合并、Pages 成功和 Flex 外部切流/回滚回执，不能用 HTTP 200 代替。生产基线与资源状态见 manifest §14。

## 下一步

1. 进入 3.5–3.7 Todo\* 视觉迁移与边界验证。
2. 处理 2.3：补齐重构前 fresh baseline，并完成首页、topics、prompts 固定 viewport before/after 像素回归。
3. 最终回归阶段执行 4.1–4.7 三环境 agent-browser 验收。
