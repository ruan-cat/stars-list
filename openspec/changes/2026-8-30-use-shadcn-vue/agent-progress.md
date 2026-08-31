# agent-progress

## 当前 checkpoint

Phase 0（工件创建）完成。change `2026-8-30-use-shadcn-vue` 工件链就绪：proposal / design / specs/todo-dashboard-explorer / tasks / 本文件 / agent-findings。

## 当前 task

下一步：`tasks.md` 2.1（安装 tailwindcss + @tailwindcss/vite 接入 VitePress 构建）。

## 状态

- 验收基线已固化：`evidence/01~08-*.png`（8 张）+ 量化指标（下拉 overflow-y scroll / gutter 12 / 图标 20 / maxHeight 320px；选中后 content 卸载；筛选 147/699；aria 标注全集）。
- specs 需求 8 组 Requirement 全部源自现状盘点，是重构验收唯一来源。
- 尚未动任何组件代码；TodoDashboard 所需的 Tailwind/shadcn-vue UI 依赖仍未安装（仅已安装独立的官方 shadcn-vue agent skill）。

## 最近验证摘要

- dev（localhost:8080）真实鼠标 sweep：下拉打开→选 10wms→弹层卸载→计数 147→清空恢复 699，全链路通过。
- 历史记录曾写“单测 17/17”（已过时）；2026-08-31 fresh 执行 `pnpm todo:test` 为 30/30 通过（数据层未动）。

## 阻塞点

- 无。

## 下一步

1. 按 do-long-task 纪律从 tasks.md 2.1 开始小步推进。
2. 2.4 若 shadcn-vue CLI 对 `docs/.vitepress` srcDir 适配失败，允许手工按官方模板落盘并记录 findings。
