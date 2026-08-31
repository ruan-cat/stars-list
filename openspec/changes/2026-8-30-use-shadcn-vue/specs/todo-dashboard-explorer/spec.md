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

#### Scenario: 扫描口径明确

- **GIVEN** artifact 响应包含 `repositoryCount`、`scannedRepositoryCount`、`errorCount`、仓库状态与 `scan.completeness`
- **WHEN** 状态栏渲染完成
- **THEN** 同时展示总仓库数、已扫描仓库数、跳过/未授权/分支不可用/失败/错误数量、可见 TODO 数与生成时间
- **AND** `complete` 仅表示扫描流程的完整度，不得被解释为总仓库数全部已扫描

#### Scenario: 首次加载失败与恢复

- **GIVEN** 首次 artifact 请求返回非 2xx、超时或无效 JSON
- **WHEN** 页面处理请求结果
- **THEN** 展示可读错误与重试入口，不得伪造 TODO、仓库或 complete 数值
- **AND** 用户重试成功后恢复状态栏与树/平铺视图

#### Scenario: 手动刷新快照

- **GIVEN** 页面已加载完成
- **WHEN** 用户点击"刷新快照"按钮
- **THEN** 按钮进入 pending 态并展示加载指示
- **AND** 重新发起 artifact 请求（同源路径）
- **AND** 成功后短暂展示"快照已更新"反馈，失败时展示错误信息

#### Scenario: 刷新竞态与禁用态

- **GIVEN** 快照刷新处于 pending 状态
- **WHEN** 用户重复点击刷新或触发筛选
- **THEN** 刷新按钮呈现 `disabled`/`aria-busy`，不会产生重复并发请求
- **AND** 旧响应不得覆盖更新更晚的快照，结束后控件恢复可操作

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

#### Scenario: 组合筛选边界

- **GIVEN** 同时设置搜索文本、仓库、分支与类型筛选
- **WHEN** 任一维度发生变化或清空
- **THEN** 结果按四个维度交集实时更新，计数与树/平铺视图保持一致
- **AND** 无匹配结果时展示空状态，不产生页面级滚动或错误计数

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

#### Scenario: 键盘导航与焦点回收

- **GIVEN** 下拉触发器获得焦点
- **WHEN** 用户按 Enter/Space 打开、按 ArrowUp/ArrowDown 移动、按 Enter 提交或按 Escape 关闭
- **THEN** 选中值、`aria-expanded`、`aria-selected` 与视觉高亮同步更新
- **AND** Escape/外部关闭后焦点回到触发器，选中关闭后弹层从 DOM 卸载

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

#### Scenario: 键盘焦点与禁用控件

- **GIVEN** 刷新、加载失败或无匹配结果等状态出现
- **WHEN** 用户仅使用键盘遍历控件
- **THEN** 当前焦点始终可见且顺序稳定，禁用控件具有 `disabled` 或等价 `aria-disabled` 语义
- **AND** 错误提示可被辅助技术感知，恢复操作完成后焦点回到触发恢复的控件

### Requirement: 三环境浏览器验收与证据归档

系统 SHALL 使用 `agent-browser` 通过 CDP 驱动可见的 Google Chrome，对 dev、preview、production 三个环境执行同一套视觉与交互验收矩阵；每个环境 SHALL 归档可复核的截图、操作日志、浏览器元数据与 DOM/网络断言。

#### Scenario: dev 环境验收

- **GIVEN** 使用 `pnpm docs:dev -- --host 127.0.0.1 --port 8080` 启动本地 dev 服务
- **WHEN** agent-browser headed session 打开 `http://127.0.0.1:8080/todos.html`
- **THEN** 记录 agent-browser session、Chrome 版本、viewport、URL 与服务进程日志
- **AND** 完成首屏、下拉、筛选、树/平铺、详情、键盘、主题、滚动和失败恢复矩阵

#### Scenario: preview 环境验收

- **GIVEN** `pnpm docs:build` 成功且使用 `pnpm docs:preview -- --host 127.0.0.1 --port 4173` 启动预览服务
- **WHEN** agent-browser headed session 打开 `http://127.0.0.1:4173/todos.html`
- **THEN** 对 dev 环境重复同一交互矩阵与截图断言
- **AND** 额外确认构建产物中的 artifact 同源路径、资源加载和 console 无新增错误

#### Scenario: production 环境验收

- **GIVEN** 当前生产目标为 `https://ruan-cat.github.io/stars-list/todos.html`
- **WHEN** agent-browser headed session 打开生产 URL
- **THEN** 记录部署 commit SHA、最终 URL、HTTP 状态、Chrome 元数据、网络请求和 console 输出
- **AND** 对 dev/preview 已通过的交互矩阵逐项复验，禁止用本地结果替代生产证据

#### Scenario: 统一交互矩阵与截图归档

- **GIVEN** 任一环境开始验收
- **WHEN** 执行每个 Scenario 的真实点击、键盘和滚动操作
- **THEN** 使用真实坐标完成 Portal/下拉交互，合成 `dispatchEvent` 仅用于 DOM 机制断言
- **AND** 截图按 `{environment}-{scenario}-{timestamp}.png` 命名，并在 `evidence/manifest.md` 登记环境、URL、viewport、Chrome/agent-browser 版本、session、命令、断言结果和文件哈希
- **AND** 每张截图必须能回指本 spec 的 Requirement/Scenario，缺少元数据或断言的图片不得作为通过证据

#### Scenario: 生产失败与回滚复验

- **GIVEN** 生产验收出现关键 Scenario 失败、页面级滚动、Portal 残留、主题回归、普通文档像素变化或 console/network 回归
- **WHEN** 触发回滚门禁
- **THEN** 停止继续验收，记录失败证据、部署 SHA 与回滚操作
- **AND** 通过现有 Flex 流量器将流量切回上一个已知通过的部署，记录切流前后版本、操作者/时间、流量器返回状态和生产 URL，不得以本地构建结果替代切流结果
- **AND** 回滚完成后使用 agent-browser 重新打开生产 URL，至少复验首屏加载、下拉关闭、键盘焦点、主题和页面滚动五项
- **AND** 五项复验及网络/console 均通过后，才允许结束回滚；否则保持失败状态并继续升级处置
