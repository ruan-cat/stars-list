---
name: use-agent-browser
description: Use when a development, QA, OpenSpec, or visual-acceptance task requires agent-browser, headed Chrome, CDP interaction, browser screenshots, DOM assertions, network/console evidence, or recovery from browser automation timeouts and connection failures.
---

# 高效使用 agent-browser

## Overview

`agent-browser` 是可回放的浏览器证据工具，不是“多开几个窗口碰碰运气”的截图工具。一次环境验收必须形成一条连续证据链：目标范围 → 同一 headed Chrome session → 用户路径 → DOM/网络/console → 截图与哈希 → 关闭与清理。

**铁律：一环境一 session；先定范围，后开浏览器；失败先分类，禁止静默换 session；没有完整证据就保持 candidate/未完成。**

## When to Use

- 需要真实用户路径、可见 Chrome、交互测试、视觉截图或 DOM/网络/console 断言。
- 长任务或 OpenSpec 要求 dev、preview、production 矩阵、截图哈希和失败回滚证据。
- 遇到 `Page.captureScreenshot` timeout、`DevToolsActivePort`、`EOF`、`connection refused`、`tab_gone` 或浏览器进程残留。
- 只做单元测试、静态检查或构建时，不启动浏览器。

## 0. 会话架构：四层 checkpoint，不把一次长跑当成验收

一次环境验收使用一个具名 headed Chrome session，但内部拆成四层 checkpoint。层与层之间只保存结构化状态，不通过“再开一个 session”补洞。

|      checkpoint       | 目标                                                                   | 允许的动作                                                   |           失败状态            |
| :-------------------: | :--------------------------------------------------------------------- | :----------------------------------------------------------- | :---------------------------: |
| A 能力探针（≤5 分钟） | headed launch、前台 visibility、截图、network、close 是否可用          | 只访问目标 URL，禁止业务操作                                 |      `blocked`，不进入 B      |
|    A2 reload 探针     | 仅在 C 需要 reload 时验证 artifact abort、单次 reload、原 session 恢复 | 同一 session 单次受控 route/reload                           |  失败只阻塞 C 的 reload 子项  |
|    B 产品核心矩阵     | TODO 首屏、筛选、下拉、树/平铺、详情、键盘、主题、滚动                 | 真实点击/键盘/滚动；稳定状态截图                             |    产品证据 `pass/partial`    |
|    C 故障/资源补证    | 首载/刷新失败、single-flight、hydration、artifact/资源状态             | 优先不 reload 的 route/fetch 控制；必要时只做一次受控 reload | `pass/blocked/not-applicable` |
|      D 独立复核       | 复核 tasks/spec、manifest、文件、尺寸、SHA、日志和状态映射             | 只读，不重新开浏览器                                         |      `pass/needs_check`       |

### 0.1 会话命名与边界

- session 名称使用 `todo-<environment>-<YYYYMMDD>-<run>`，同一环境同一验收运行只允许一个名称。
- `dev`、`preview`、`production` 是三个独立环境；普通文档页是独立旁路 checkpoint，不得塞进 TODO session。
- A 的 session 注册不等于 B 的业务通过；B 的截图不能替代 C 的失败恢复；D 的复核不能把缺失材料改写成通过。
- 证据状态只允许 `pass`、`partial`、`blocked`、`not-run`。`blocked` 表示工具/外部权限事实，不表示产品成功，也不表示产品失败。
- 每环境建议时间盒：A 5 分钟、B 20–30 分钟、C 10 分钟、D 5 分钟；A2 只允许一次且计入 C 时间盒。超过时间盒先停下记录，而不是继续试错。

## 1. 先锁定范围

1. 读取当前 OpenSpec 的 `tasks.md`、`spec.md` 和现有证据清单，列出本 checkpoint 的 Scenario ID、目标 URL、viewport、成功断言和必需截图。
2. **一个环境的一次验收只服务一个范围。** TODO 页面矩阵不得混入普通文档页；普通页只有在任务明确要求时，作为独立 checkpoint 验收，不能替代 TODO 证据。
3. 不把“顺手看看”“再测一个页面”加入当前 session。新增范围先回写任务源，再另行安排。

## 2. 开浏览器前的健康探针

按顺序执行，不要直接反复 `open`：

```powershell
agent-browser skills get core
agent-browser doctor --offline --quick
agent-browser session list
$session = agent-browser session id --scope worktree --prefix <task>-<environment>
```

- 记录 Chrome/agent-browser 版本、session 名称、viewport、目标 URL、服务器 PID/端口和开始时间。
- 选择一种启动方式：要么让 agent-browser 启动 headed Chrome，要么启动一个隔离 profile 的 Chrome 后用 `--cdp <port>` 连接；禁止两套方式同时启动。
- 连接现有 Chrome 时使用稳定 session 和 `--pin-tab`。同名 session 已有活动 tab 就复用；`tab_gone` 只在**同一个 session**执行 `tab new <url>`，不要创建替代 session。自动启动返回 EOF 时先查 `session info`/`tab list`，不能立即重复 launch。
- 先读取并登记既有视觉基线（路径、尺寸、SHA-256、可见事实），再打开被测页面。基线没有同 viewport/主题/滚动元数据时，只能标记参考。
- 启动后立即执行 `tab list` 并将目标 tab 带到前台，读取 `document.visibilityState`；不是 `visible` 时先恢复前台，不能用 hidden tab 的 rAF/截图作为通过证据。
- A 失败时最多做一次**同方式**恢复；不要在 agent-browser 启动失败后再叠加手工 Chrome、另一个 daemon 或第二个 session。

## 3. 单 session 生命周期

一个环境的生命周期固定为：

```text
health probe → start one server → open one URL → baseline → core matrix → fault/resource checkpoint → evidence review → close once
```

操作规则：

- 每个环境只创建一个具名 headed Chrome session；不要为每个 Scenario 关闭再打开。
- 页面变化后重新 `snapshot -i`；旧 `@eN` 引用立即失效。
- 先 `wait --load networkidle` 或等待明确的业务元素，再执行点击、键盘和截图。
- B 阶段先完成产品核心矩阵，再做 C 阶段故障/资源补证；不要在核心路径中途插入会触发 reload 的故障实验。
- C 阶段优先使用不 reload 的 `network route`、受控 fetch 或 fixture；single-flight 若结构上只允许一个请求，记录 `calls=1` 并标记乱序场景 `not-applicable`，不要强行制造第二个请求。
- 矩阵未完成、证据未登记前，不得 `close`，也不得用新 session 接着补齐并宣称“同一次通过”。
- 若 C 阶段 reload 使控制面丢失，保留已经完成的 B 证据，C 标记 `blocked`，结束该环境；不要为了一张失败截图重启浏览器。

## 4. 证据采集策略

每个 Scenario 的最终状态至少记录：环境、URL、viewport、Chrome/agent-browser 版本、session、checkpoint、命令、DOM 断言、网络状态、console 状态、截图路径和 SHA-256。

- 截图只截稳定的验收状态，不为每个中间点击重复截图；按任务要求覆盖首屏、关键交互、主题和响应式状态。
- 截图成功后立即执行 `Get-FileHash -Algorithm SHA256` 并登记，避免最后补拍导致不可追溯。
- `console` 开始时清空；记录全站已知基线警告与本次新增错误，不能把“console 非空”或“DOM 成功”直接写成通过。
- 用 `network requests` 或 HAR 证明 artifact/静态资源状态；HAR 可能含响应体和敏感头，只保存在系统临时目录并按项目规则清理。
- 视觉结论必须对照已读基线；“页面能打开”“构建 exit 0”“元素存在”都不能替代像素或可见交互证据。

### 4.1 规范化资源与像素证据

- 资源复核优先输出规范化清单：`url`、`resourceType`、`method`、`status`、必要时 `contentLength`/响应 SHA-256；按 URL 去重并保留最新状态。
- 原始 HAR 可能含响应体和敏感头，只放系统临时目录；清理 HAR 后，规范化清单必须仍能独立复核。没有 `todos.html`、artifact 或关键 CSS/JS 状态时，资源 checkpoint 只能 `partial`。
- 像素 diff 先固定 viewport、滚动位置、主题、字体和 artifact 版本；动态时间、光标、网络状态区域必须 mask 或单独断言。
- 同时登记原始 diff、归一化 diff 和结构性视觉结果；单一百分比不自动等于产品失败，也不自动等于通过。
- 原始/归一化 diff 只作同视口诊断，不设跨 viewport 的统一百分比硬阈值；`1600×1000` 与 `1280×900` 等不同尺寸的差异不得单独判定通过或失败。响应式验收以结构性事实为硬门禁：桌面无页面级双滚动、窄视口面板上下堆叠、marker/缩进符合基线意图、主题变量生效、sticky 动作栏完整可见。

### 4.2 提交前证据落盘校验

在勾选任务或提交验收工件前，逐行扫描 `evidence/manifest.md` 中登记的截图引用，并同时确认：

1. 路径存在、文件仍位于当前 change 的 `evidence/` 目录，PNG 尺寸与登记的 viewport 一致。
2. 现场 `Get-FileHash -Algorithm SHA256` 与 manifest 登记值完全相同；任一缺失或不匹配都标记为 `needs_check`，不得用旧图、同名图或早期 session 补齐。
3. 每条截图能回指当前环境、当前 session 和具体 Scenario；如果只完成了 DOM/网络断言但截图没有落盘，必须记录为“部分”，不能写成“通过”。

建议使用一次性只读脚本输出 `checked / missing / mismatched` 汇总，再进行人工抽查；不要在发现断链后重新开 session 只为制造一张孤立截图。

## 5. 失败边界与止损

| 症状                             | 立即动作                                                                                      | 禁止做法                         |
| -------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------- |
| `tab_gone`                       | 在原 session 查看 `tab list`，用 `tab new <url>` 重新绑定同 URL；重新跑 snapshot 和基线检查   | 新建第二 session 拼接            |
| `EOF` / `connection refused`     | 先查 agent-browser daemon、Chrome PID、CDP 端口；同一 Chrome 可达时只重连原 session，最多一次 | 盲目重复 launch/open             |
| `DevToolsActivePort` exit 3      | 保留原始日志；若浏览器未成功启动，只做一次同方式恢复；若已有 session 丢失则直接 `blocked`     | 连续启动多个 Chrome              |
| `Page.captureScreenshot` timeout | 停止同命令重试；等待稳定后改用更小区域/关键状态截图，或标记截图缺失                           | 删除 timeout、拿旧截图冒充 fresh |
| `reload` 后控制面丢失            | 保留 B 阶段证据，C 阶段标记 `blocked`，关闭当前环境                                           | 为补失败图重启/换 session        |
| 页面产品断言失败                 | 保留截图、DOM、网络和 console，停止该环境矩阵                                                 | 继续操作到“看起来差不多”         |
| 服务器或浏览器进程异常           | 记录 PID/端口/日志，先结束当前环境                                                            | 静默换环境或换 session           |

恢复仍失败时，当前环境状态是 `blocked` 或 `needs_check`，不是“通过”。控制面 `blocked` 不得改写为产品 `fail` 或 `pass`；任务勾选只能发生在证据完整之后。

## 6. 关闭与进程清理

1. 只有该环境 B/C 矩阵和证据审查结束后才执行一次 `agent-browser close`；A 探针单独失败则立即关闭并登记 `blocked`。
2. 用户自己的 Chrome 只关闭本任务创建的 tab/context，不关闭整套浏览器。
3. 停止本次启动的 dev/preview 服务器，并重新核对端口。
4. 使用 `cleanup-agent-team-node-processes` 做默认 dry-run；只清理能由 PID、父子链、命令行、端口和本次 session 证明归属的进程，禁止按 `node.exe`、`chrome.exe` 或关键词批量终止。
5. 关闭前输出 session 收据：session、checkpoint 状态、截图计数、`checked/missing/mismatched/unreferenced`、console 新增错误数、资源状态和停止原因。

## Quick Reference

| 目标        | 最短可靠路径                                             |
| ----------- | -------------------------------------------------------- |
| 新环境      | ≤5 分钟能力探针 → 新具名 session → B 核心矩阵 → C 补证   |
| 现有 Chrome | `--cdp <port> --session <name> --pin-tab`，复用原 tab    |
| 页面变化    | 重新 `snapshot -i`，不要复用旧 `@eN`                     |
| 视觉证据    | 先读基线 → 稳定后截图 → 立即 SHA-256                     |
| 失败处理    | 保存原始错误 → 分类 → 同 session 一次恢复 → 否则 blocked |
| 完成判定    | B/C 硬门禁 + 元数据 + DOM/网络/console + 哈希 + D 复核   |

## Common Rationalizations

| 借口                                   | 纠偏                                                           |
| -------------------------------------- | -------------------------------------------------------------- |
| “只差一个 Scenario，另开 session 更快” | 这会破坏单 session 可回放性；回到原 session 或记录未完成。     |
| “普通文档页顺便测一下更全面”           | 范围不是越大越好；只有任务源明确要求才另开 checkpoint。        |
| “DOM 已经通过，截图可以省略”           | 视觉任务需要可见证据；缺截图只能是参考/未完成。                |
| “EOF 多试几次总会好”                   | 先查控制面和端口；无界重试只制造假进展。                       |
| “构建通过所以浏览器肯定没问题”         | build 只证明构建链，不证明真实交互、滚动、主题或焦点。         |
| “旧截图内容一样，拿来补今天的记录”     | 没有同 session、同 viewport、同提交和哈希链就不是 fresh 证据。 |

## Red Flags — STOP

- 同一环境出现第二个 session 名称。
- 没读基线图片就开始截图。
- 截图失败后没有保留原始日志。
- 用 DOM、build、HTTP 200 或局部截图勾选完整任务。
- 把普通文档页、其他路由或其他环境混入当前核心矩阵。
- 未完成证据登记就关闭浏览器或启动替代浏览器。
- 能力探针超过 5 分钟仍未通过，或同类控制面故障已经发生第二次。
- 为了补一张孤立截图而 reload、换 profile、换端口或开第二个 session。

出现任一项，停止并回到第 1 节；**自报完成只是 candidate，证据链才是交付。**
