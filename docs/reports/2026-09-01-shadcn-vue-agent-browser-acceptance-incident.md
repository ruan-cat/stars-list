# 2026-09-01 shadcn-vue 迁移验收耗时与门槛设计事故报告

> 《置身钉外》这次不是业务代码交付不了，而是我把验收流程做成了“周报大捷”：截图很多，链路没有及时收口。口径不是修复，局部通过也不是完整验收。

- 报告工具：Codex 主代理、PowerShell、OpenSpec CLI、agent-browser 0.35.0
- AI 模型：GPT-5.6 Terra（按本轮任务执行配置；运行时未提供更细的模型身份字段）
- 独立复核：Codex 子代理 `gate37_reviewer`（只读复核，未启动浏览器）
- 报告范围：`openspec/changes/2026-8-30-use-shadcn-vue` 的验收设计、浏览器执行过程、证据链和当前收尾状态

## 0. 摘要

用户质疑“门槛是否超出 agent-browser 能力、指标和测试方式是否一开始就设计错了”。结论如下：

1. **不是完全超出 agent-browser 能力**：agent-browser 已经真实完成 TODO 页面的大部分 headed Chrome 交互，证明工具可以承担核心 smoke 和视觉验收。
2. **验收打法确实设计过度**：我把首载失败、刷新竞态、双主题、键盘分支、sticky 深滚动、资源全表、截图哈希、console、DOM、独立复核全部压进“一个 session、一个复合门禁”，没有先做能力探针和时间盒。
3. **部分指标设计不完整或与实现不匹配**：像素 diff 没有容差/动态区域规则；“真实乱序响应”与当前 single-flight 实现的 UI 行为不相容；原始 HAR 保留要求高于实际复核价值；独立 verifier 的职责边界也没有先定义。
4. **8 小时级别的浪费主要由我造成**：重复尝试控制面、晚期才做故障注入、跨历史证据拼接倾向、没有尽早运行 manifest 路径/SHA 校验、没有在第二次同类浏览器故障后停下。

当前状态不是完成：OpenSpec 为 **15/24 完成、9 项待办**。代码与自动化回归已经较稳定，但 `3.5、4.1、4.2、4.4、4.5、4.6、4.7、5.2` 仍不能勾选。

## 1. 事实核对

### 1.1 已经完成且有输出的部分

|       事项        | 证据                                                                                                   |         结论         |
| :---------------: | :----------------------------------------------------------------------------------------------------- | :------------------: |
|    组件自动化     | `pnpm test:components -- --run docs/.vitepress/theme/components/todo-dashboard.component.test.ts`，7/7 |         通过         |
|  TODO 数据层测试  | `pnpm todo:test`，30/30                                                                                |         通过         |
|     类型检查      | `pnpm exec tsc --noEmit`                                                                               |         通过         |
|  VitePress 构建   | `pnpm docs:build`，最近一次 66.78s，exit 0                                                             |         通过         |
| OpenSpec 结构校验 | `openspec validate 2026-8-30-use-shadcn-vue --strict`                                                  |         通过         |
|     dev 补证      | §28，单 session 新增 13 张截图；独立 reviewer `checked=13 mismatches=0`                                | 证据有效，但只是补证 |
|     进程收束      | agent-browser close、停止 dev 服务、cleanup dry-run `CandidateCount=0`                                 |         通过         |

### 1.2 尚未完成的验收门禁

| 任务 | 当前阻塞事实                                                                  |        是否属于代码无法实现        |
| :--: | :---------------------------------------------------------------------------- | :--------------------------------: |
| 3.5  | Tailwind 静态迁移已做，但完整亮/暗主题、交互矩阵和三环境证据未闭环            |                 否                 |
| 4.1  | spec 全 Scenario 未在每个环境逐条闭环                                         |          否，属于证据缺口          |
| 4.2  | §15 同视口 diff 为 4.60%，且没有合格的亮/暗 before/after 规则                 |    指标设计不完整 + 结果未通过     |
| 4.4  | 普通文档页没有重构前 fresh baseline 像素对照                                  |            否，尚未执行            |
| 4.5  | dev 同一 session 未同时拿到首载失败/恢复、乱序响应、完整资源表和独立 verifier | 浏览器控制面不稳定叠加流程设计问题 |
| 4.6  | preview 仍缺当前版本的若干键盘/外点/sticky/亮色/资源复核证据                  |          否，尚未完整采集          |
| 4.7  | 当前生产仍是旧部署；Flex 流量器没有仓库内可自证回执                           |       需要外部部署权限与回执       |
| 5.2  | 未满足归档前置条件                                                            |           正确保持未归档           |

### 1.3 浏览器控制面已复现的事实

- headed `open` 曾返回 EOF；同一 session 的 `tab t1` 仍可恢复，说明“EOF=页面产品失败”这个假设不成立。
- session 初始 `document.visibilityState` 曾为 `hidden`，导致焦点回收/rAF 观察失真；切到前台后才稳定为 `visible`。
- 对 artifact 做 `--abort` 后 reload，Chrome 在同一 session 退出 `DevToolsActivePort`，没有生成失败截图；随后没有重启或换 session。
- `network requests` 能拿到 artifact、`tw.css`、`favicon.svg` 等状态，但本次 dev 日志没有捕获 `todos.html` Document 行，不能据此宣称完整资源表。
- 证据索引曾存在不存在的 `dev-final-no-match` 路径；独立 reviewer 发现后，已改为“部分”，并由 §28 的 `dev-final2-no-match` 补上可核验文件。

## 2. 门槛设计审计

### 2.1 合理的门槛

以下要求本身没有问题，应该保留：

- 验收范围锁定 TODO 页面，不把普通文档页混进 TODO 核心矩阵。
- 真实 headed Chrome，而不是只用 headless 截图推断视觉结果。
- 真实点击、键盘、滚动；DOM/网络/console 只作对应断言，不能互相替代。
- 截图必须有环境、URL、viewport、session、命令和 SHA-256。
- 证据不足时保持 `candidate/needs_check`，禁止提前勾选或归档。
- 生产部署、Flex 切流和回滚必须有外部回执，不能用本地 build 或 HTTP 200 冒充。

这些门槛保护的是“不要把局部有效说成整体完成”，不是工具能力的过度要求。

### 2.2 我设计过度的地方

#### 2.2.1 把多个高风险变量压进一个复合 session

`4.5/4.6` 同时要求完整用户矩阵、故障注入、双主题、移动视口、面板深滚动、资源状态、console 基线和截图归档。单 session 约束本来是为了防拼接，但我没有把“核心产品路径”和“控制面/故障实验”分成前后可停止的阶段，结果一个 reload 故障就可能毁掉后半段证据。

#### 2.2.2 指标没有先做可行性定义

- `4.2` 只有“截图比对”，没有明确动态时间、字体、滚动条、浏览器版本变化的容差和 mask 规则；最终 `4.60%` diff 只能证明“不像素相等”，不能直接解释为产品回归百分比。
- 任务要求“旧响应不得覆盖更新更晚的快照”，但实现采用 single-flight，真实重复点击会被合并为一个请求，UI 上根本不会产生两个可乱序的并发响应。我仍然把“乱序响应”当成必须在浏览器里强行制造的场景，属于验收适配错误。
- 原始 HAR 含响应体和头部，审查后删除是合理的安全处置；任务却没有一开始定义“规范化请求清单 + SHA-256”这一等价证据，导致我在 HAR 保留与可复核性之间反复摇摆。
- “独立 verifier”没有先规定是复核 manifest/哈希、复核 DOM 断言，还是重新操作浏览器；我把它拖到末尾，形成了自测和评分职责混杂。

#### 2.2.3 没有能力探针和止损预算

在第一次真正矩阵前，本应先用不超过 5 分钟验证：headed launch、前台 visibility、截图、route abort、reload、network requests、session close。实际却先进入大矩阵，直到多次 EOF、隐藏 tab 和 exit 3 后才建立恢复边界。

#### 2.2.4 没有从第一张截图开始运行证据索引校验

我直到 reviewer 复核才发现 manifest 中有不存在的截图路径。提交前路径存在性、尺寸和 SHA 校验现在已经补进 `use-agent-browser` 技能，但它本应是第一阶段的自动门禁，而不是收尾时才发现的 P1。

## 3. 延误根因与责任

### 3.1 直接根因

|      根因      | 具体表现                                                          | 责任归属 |
| :------------: | :---------------------------------------------------------------- | :------: |
|  验收编排失控  | 把一个复合门禁当成单次长跑，没有阶段性 checkpoint                 |    我    |
|   控制面误判   | EOF、hidden visibility、exit 3 之间没有及时区分产品失败与工具失败 |    我    |
|  无界尝试倾向  | 多次 open/reload/截图后才停止，浪费了大量时间和 token             |    我    |
|  证据治理滞后  | manifest 路径断链在独立 reviewer 阶段才发现                       |    我    |
|  需求适配不足  | 对 single-flight 实现仍要求浏览器制造乱序响应                     |    我    |
| 外部依赖未前置 | production/Flex 需要外部权限，却没有在早期明确标记为独立阻塞项    |    我    |

### 3.2 不是根因的事项

- shadcn-vue 组件迁移不是主要阻塞；代码已通过 TypeScript、组件测试、数据层测试和构建。
- TODO 页面范围本身没有丢失；偏离普通文档页的历史尝试已被纠正，后续核心矩阵一直锁定 `/todos.html`。
- 4.5/4.6 的严格证据要求没有授权我伪造通过；保持未勾选是正确结果。

## 4. 时间与 token 浪费复盘

### 4.1 最浪费的动作

1. 在没有先确认 headed 控制面健康的情况下进入长矩阵。
2. 把一个 session 的失败当成“再试一次参数”问题，而不是立即进入 `needs_check`。
3. 在后期才做首载故障注入，导致 reload 直接击穿浏览器控制面。
4. 为了补齐“同一 session”而反复尝试，而没有先承认本 session 已经失去完整性。
5. 使用大量叙述性 progress/manifest 文本弥补缺失的机器校验。

### 4.2 已经采取的止损改进

- 新增 `.agents/skills/use-agent-browser/SKILL.md` 的单 session、健康探针、失败边界和提交前 manifest 校验规则，提交 `ecc197d`。
- 修正证据断链并明确历史 partial session 不得替代当前 session，提交 `9bc51bd`。
- 以 §28 记录 dev 补证，保留 `DevToolsActivePort exit 3` 的失败事实，不伪造首载失败截图，提交 `664d144`。
- 对状态栏成功态补 `role=status/aria-live=polite`，用 TDD 先红后绿，提交 `99bf185`、`416b7cf`、`58ce56a`。
- cleanup 使用 dry-run；当前没有可证明属于本次 run 的待清理候选。

## 5. 重新设计建议

以下是下一次同类任务的建议，不擅自修改当前 `tasks.md`；若要改变当前清单，必须先由用户确认。

### 5.1 能力探针（单独 checkpoint，≤5 分钟）

先做一次不涉及业务判断的探针：

```log
agent-browser skills get core
agent-browser doctor --offline --quick
agent-browser session list
headed launch → tab foreground → visibility=visible
screenshot → network requests → route abort → reload → session close
```

任一关键能力失败，环境立即标记 `blocked/needs_check`，不进入完整矩阵，不更换第二个 session 继续拼接。

### 5.2 产品矩阵和故障矩阵分层

- **产品矩阵**：首屏、筛选、下拉滚动、树/平铺、详情、键盘、主题、响应式滚动；只验证真实用户路径。
- **故障矩阵**：首载失败、刷新失败、single-flight、恢复焦点；每个故障在产品矩阵稳定后单独执行，并明确是否允许 reload。
- **资源证据**：使用结构化请求清单（URL、资源类型、状态、SHA）作为 HAR 的可复核替代；敏感 HAR 只保留临时目录并在报告中登记已清理。
- **独立复核**：由 reviewer 复核 manifest、文件、哈希和日志；除非任务明确要求，不要求 reviewer 再开一个浏览器。

### 5.3 像素门禁改成可解释规则

在任务开始前写清楚：

- 固定 viewport、滚动位置、主题、字体加载和 artifact 版本。
- 动态时间/生成时间/光标等区域使用 mask 或单独断言。
- 设定明确的像素差阈值，并把“像素不等”与“产品回归”分开报告。
- 若基线缺少尺寸、主题或滚动元数据，只能标记 `参考`，不强行计算通过率。

### 5.4 明确单 session 的停止条件

建议每个环境最多允许：

- 一次健康探针；
- 一次具名 headed session；
- 同类控制面故障最多一次有界恢复；
- 第二次同类故障立即停止该环境，并保留 `needs_check`，不再启动替代 session。

这不是降低质量，而是把“证据不可回放”从 8 小时后才发现，提前到 10 分钟内发现。

## 6. 当前交付判断

### 6.1 当前状态

```text
状态：candidate / needs_check，不是 done_with_evidence
代码：主要迁移与自动化回归已通过
浏览器：dev/preview 近完整但非完整；production/Flex 未闭环
归档：禁止
用户既有改动：docs/prompts/index.md 未暂存、未修改意图
```

### 6.2 需要用户拍板的唯一事项

当前有两条合法路径：

1. 维持现有严格 `tasks.md`，接受 4.1/4.2/4.5/4.6/4.7 未完成，后续只在明确授权和能力探针通过后再开一次完整 session。
2. 先修改验收设计（像素容差、资源清单等价证据、single-flight 与乱序场景的适配、独立 verifier 职责），再按新规则执行；不能只在结果不理想时口头放宽。

在用户拍板前，我不会继续重复启动 agent-browser，也不会归档 change。

## 7. 结论

这次不是“agent-browser 完全做不到”，也不是“代码能力不足”。准确说法是：**工具能做核心 TODO 验收，但我把多个脆弱控制面实验和严格证据要求设计成了一条没有能力探针、没有时间盒、没有等价证据定义的长链路，导致验收方法本身成为主要故障源。**

这份报告接受两个责任结论：

- 门槛中有合理的质量底线，不能为了赶进度删除；
- 当前执行方法确实过度、低效，应该重做验收设计，而不是继续靠重复浏览器尝试硬顶。

本报告与本次根因、改进动作已写入 Memorix，作为后续同类 OpenSpec/agent-browser 任务的复用依据。
