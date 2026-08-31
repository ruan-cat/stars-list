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

- 记录 Chrome/agent-browser 版本、session 名称、viewport、目标 URL、服务器 PID/端口。
- 选择一种启动方式：要么让 agent-browser 启动 headed Chrome，要么启动一个隔离 profile 的 Chrome 后用 `--cdp <port>` 连接；禁止两套方式同时启动。
- 连接现有 Chrome 时使用稳定 session 和 `--pin-tab`。同名 session 已有活动 tab 就复用；`tab_gone` 只在**同一个 session**执行 `tab new <url>`，不要创建替代 session。
- 先读取并登记既有视觉基线（路径、尺寸、SHA-256、可见事实），再打开被测页面。基线没有同 viewport/主题/滚动元数据时，只能标记参考。

## 3. 单 session 生命周期

一个环境的生命周期固定为：

```text
health probe → start one server → open one URL → baseline → full matrix → evidence review → close once
```

操作规则：

- 每个环境只创建一个具名 headed Chrome session；不要为每个 Scenario 关闭再打开。
- 页面变化后重新 `snapshot -i`；旧 `@eN` 引用立即失效。
- 先 `wait --load networkidle` 或等待明确的业务元素，再执行点击、键盘和截图。
- 在同一 session 内按任务源顺序完成完整矩阵：首屏/失败恢复、筛选、下拉与清空、树/平铺、详情、键盘焦点、刷新竞态、主题、面板/页面滚动。
- 矩阵未完成、证据未登记前，不得 `close`，也不得用新 session 接着补齐并宣称“同一次通过”。

## 4. 证据采集策略

每个 Scenario 的最终状态至少记录：环境、URL、viewport、Chrome/agent-browser 版本、session、命令、DOM 断言、网络状态、console 状态、截图路径和 SHA-256。

- 截图只截稳定的验收状态，不为每个中间点击重复截图；按任务要求覆盖首屏、关键交互、主题和响应式状态。
- 截图成功后立即执行 `Get-FileHash -Algorithm SHA256` 并登记，避免最后补拍导致不可追溯。
- `console` 开始时清空；记录全站已知基线警告与本次新增错误，不能把“console 非空”或“DOM 成功”直接写成通过。
- 用 `network requests` 或 HAR 证明 artifact/静态资源状态；HAR 可能含响应体和敏感头，只保存在系统临时目录并按项目规则清理。
- 视觉结论必须对照已读基线；“页面能打开”“构建 exit 0”“元素存在”都不能替代像素或可见交互证据。

## 5. 失败边界与止损

| 症状                             | 立即动作                                                                            | 禁止做法                         |
| -------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------- |
| `tab_gone`                       | 在原 session 查看 `tab list`，用 `tab new` 重新绑定同 URL                           | 新建第二 session 拼接            |
| `EOF` / `connection refused`     | 先查 agent-browser daemon、Chrome PID、CDP 端口；同一 Chrome 可达时只重连原 session | 盲目重复 launch/open             |
| `DevToolsActivePort` exit 3      | 保留原始日志，检查是否已有 Chrome/端口占用，最多做一次受控恢复                      | 连续启动多个 Chrome              |
| `Page.captureScreenshot` timeout | 停止同命令重试；等待稳定后改用更小区域/关键状态截图，或标记截图缺失                 | 删除 timeout、拿旧截图冒充 fresh |
| 页面产品断言失败                 | 保留截图、DOM、网络和 console，停止该环境矩阵                                       | 继续操作到“看起来差不多”         |
| 服务器或浏览器进程异常           | 记录 PID/端口/日志，先结束当前环境                                                  | 静默换环境或换 session           |

恢复仍失败时，当前环境状态是 `blocked` 或 `needs_check`，不是“通过”。任务勾选只能发生在证据完整之后。

## 6. 关闭与进程清理

1. 只有该环境完整矩阵和证据审查结束后才执行一次 `agent-browser close`。
2. 用户自己的 Chrome 只关闭本任务创建的 tab/context，不关闭整套浏览器。
3. 停止本次启动的 dev/preview 服务器，并重新核对端口。
4. 使用 `cleanup-agent-team-node-processes` 做默认 dry-run；只清理能由 PID、父子链、命令行、端口和本次 session 证明归属的进程，禁止按 `node.exe`、`chrome.exe` 或关键词批量终止。

## Quick Reference

| 目标        | 最短可靠路径                                               |
| ----------- | ---------------------------------------------------------- |
| 新环境      | `doctor --offline --quick` → 新具名 session → 一次完整矩阵 |
| 现有 Chrome | `--cdp <port> --session <name> --pin-tab`，复用原 tab      |
| 页面变化    | 重新 `snapshot -i`，不要复用旧 `@eN`                       |
| 视觉证据    | 先读基线 → 稳定后截图 → 立即 SHA-256                       |
| 失败处理    | 保存原始错误 → 分类 → 同 session 有界恢复 → 否则停止       |
| 完成判定    | 全矩阵 + 元数据 + DOM/网络/console + 截图哈希齐全          |

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

出现任一项，停止并回到第 1 节；**自报完成只是 candidate，证据链才是交付。**
