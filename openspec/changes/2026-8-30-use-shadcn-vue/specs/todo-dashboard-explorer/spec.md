# todo-dashboard-explorer Specification（增量）

> 本文件是 change `2026-8-30-use-shadcn-vue` 的 spec 增量。所有需求以 2026-08-30 采集的现状为验收基线（证据：`evidence/01~08-*.png` 与本文引用的量化指标）。重构后的实现 SHALL 逐条满足，不允许丢失任何既有功能或视觉效果。

## ADDED Requirements

### Requirement: 快照数据加载与状态栏

系统 SHALL 在页面加载时从同源 `/artifacts/github-todos/ruan-cat.json`（生产为 `<base>/artifacts/...`）加载 TODO 快照，并在状态栏展示可见 TODO 数、仓库数、完整度与生成时间。

#### Scenario: 首屏加载成功

- **GIVEN** 生产或本地 dev 环境打开 `/todos.html`
- **WHEN** artifact 请求成功（HTTP 200）
- **THEN** 状态栏展示"699 可见 TODO、78 个仓库、complete、生成于 <时间>"（数值随最新 artifact 浮动）
- **AND** 左侧树按仓库分组展示，行内含仓库图标、仓库名与 TODO 计数

#### Scenario: 手动刷新快照

- **GIVEN** 页面已加载完成
- **WHEN** 用户点击"刷新快照"按钮
- **THEN** 按钮进入 pending 态并展示加载指示
- **AND** 重新发起 artifact 请求（同源路径）
- **AND** 成功后短暂展示"快照已更新"反馈，失败时展示错误信息

### Requirement: 筛选能力

系统 SHALL 提供搜索文本、仓库、分支、类型四个筛选维度，且筛选结果实时联动树/平铺视图与状态栏计数。

#### Scenario: 仓库筛选

- **GIVEN** 下拉已选择仓库 `10wms`
- **WHEN** 筛选生效
- **THEN** 状态栏计数变为 `147 可见 TODO`（该仓库实际数量）
- **AND** 树/平铺视图仅展示该仓库内容
- **AND** 触发器展示所选值、清空按钮（✕）与仓库可见性图标

#### Scenario: 清空筛选

- **GIVEN** 任一下拉处于已选中状态（✕ 可见）
- **WHEN** 用户点击清空按钮
- **THEN** 该维度恢复占位文案（如"所有仓库"）
- **AND** 计数与视图恢复全量（699）

### Requirement: 仓库下拉交互契约

系统 SHALL 提供符合以下交互契约的仓库下拉选择器（分支/类型下拉共享同一组件契约，无仓库图标）。

#### Scenario: 打开与选项呈现

- **GIVEN** 用户点击下拉触发器
- **WHEN** 弹层打开
- **THEN** 弹层内按字典序列出全部可选仓库（含"所有仓库"占位项）
- **AND** 每个仓库选项前渲染可见性图标：开源（public）为品牌色开锁图标，闭源（private）为灰色闭锁图标
- **AND** 弹层最大高度 320px，内容溢出时常驻可见滚动条（`overflow-y: scroll`）

#### Scenario: 选中后自动关闭

- **GIVEN** 弹层处于打开状态
- **WHEN** 用户点击任一选项
- **THEN** 值提交并触发筛选
- **AND** 弹层立即从 DOM 卸载（无残留、无遮挡、无事件拦截）

#### Scenario: 点击外部与 Escape 关闭

- **GIVEN** 弹层处于打开状态
- **WHEN** 用户点击弹层外部区域或按下 Escape
- **THEN** 弹层关闭且不改变当前值

### Requirement: 树形与平铺双视图

系统 SHALL 提供树形/平铺双视图，通过 header 中的分段切换按钮（"树形/平铺"）切换，两视图共享筛选与选中态。

#### Scenario: 平铺视图

- **GIVEN** 用户点击"平铺"切换按钮
- **WHEN** 视图切换完成
- **THEN** 按深度优先顺序平铺展示全部可见 TODO（每行含文件图标、TODO 文本、`仓库 · 路径:行号` 元信息）
- **AND** 列表在面板内部滚动，不产生页面级滚动

#### Scenario: 视图选中态共享

- **GIVEN** 平铺视图中选中某条 TODO
- **WHEN** 切换回树形视图
- **THEN** 选中节点在树中保持选中态，详情面板内容不变

### Requirement: 详情面板

系统 SHALL 在右侧面板展示选中节点的详情：类型徽标、标题、TODO 原文、上下文（仓库/路径/分支/行号）、来源（commit）与"在 GitHub 查看"外链。

#### Scenario: 动作按钮不被裁切

- **GIVEN** 详情内容高度超过面板可视高度
- **WHEN** 用户滚动或未滚动详情面板
- **THEN** "在 GitHub 查看"按钮 sticky 吸附于面板底部，始终完整可见

### Requirement: 布局与滚动契约

系统 SHALL 保证 TodoDashboard 恰好占满首屏剩余高度：布局面板高度为视口高度减去其顶部内容实测值；树/平铺与详情面板各自内部滚动；**不得出现页面级双滚动条**。

#### Scenario: 桌面视口无页面滚动

- **GIVEN** 桌面宽度视口（≥900px）加载完成
- **WHEN** 页面渲染稳定
- **THEN** 文档滚动高度等于视口高度（`docScrollH === innerH`）
- **AND** 左右面板支持拖拽调整宽度（Splitter 手柄），树面板最小 280px、详情面板最小 360px

#### Scenario: 窄视口降级

- **GIVEN** 视口宽度 < 900px
- **WHEN** 页面渲染
- **THEN** 面板改为上下堆叠布局，高度约束解除，允许自然页面滚动

### Requirement: 主题与可访问性

系统 SHALL 同时支持亮色与暗色主题（跟随站点主题切换），并保持既有可访问性标注。

#### Scenario: 暗色主题

- **GIVEN** 站点处于暗色主题
- **WHEN** 查看 TodoDashboard
- **THEN** 全部组件使用暗色语义变量渲染，无硬编码亮色残留

#### Scenario: 可访问性标注保持

- **GIVEN** 重构完成
- **WHEN** 审查 DOM
- **THEN** 保留 `role="search"`、`role="listbox"`、`role="option"`、`aria-label`（搜索/仓库/分支/类型/视图切换/TODO Explorer/平铺列表）与 `aria-selected`/`aria-expanded` 等既有标注
