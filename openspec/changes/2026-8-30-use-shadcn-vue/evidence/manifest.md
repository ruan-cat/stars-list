# 浏览器验收证据清单

> 状态：验收协议已于 2026-09-01 重设计，后续 fresh 记录按“能力探针 → 产品核心矩阵 → 故障/资源补证 → 独立复核”分层填写。本清单不是通过证明；每一行必须由对应 checkpoint 的 agent-browser headed Chrome 操作、截图和断言输出共同支撑。历史 §1–§28 记录保持原样，仅作为审计事实，不得跨 session 拼接。

## 1. 采集工具与会话

- 工具：`agent-browser`（先执行 `agent-browser skills get core`）
- 浏览器：Google Chrome headed，通过 CDP 连接；禁止使用 headless-only 截图作为视觉通过证据
- 独立会话（PowerShell）：`$env:AGENT_BROWSER_SESSION = (agent-browser session id --scope worktree --prefix todo-<environment>-<date>)`
- 会话元数据：执行 `agent-browser session info --json`，记录 session、Chrome 版本、agent-browser 版本、viewport、URL、visibility、服务 PID/端口和 launch/recovery 结果
- 交互规则：Portal/下拉使用真实坐标点击；合成 `dispatchEvent` 仅用于 DOM 机制断言
- 会话生命周期：每个环境先执行一次不超过 5 分钟的能力探针，再创建一个具名 headed Chrome session；该 session 依次承载产品核心矩阵、稳定阶段的故障/资源补证和证据审查，最后只关闭一次。能力探针失败、EOF、`tab_gone`、`DevToolsActivePort` 或截图超时最多做一次同 session 有界恢复；恢复失败标记 `blocked`，禁止静默换 session 拼接为“完整通过”。

### 1.1 分层 checkpoint 与证据状态

|   checkpoint    | 目的                                                                  | 是否产生业务通过结论 | 控制面失败处置                                    |
| :-------------: | :-------------------------------------------------------------------- | :------------------: | :------------------------------------------------ |
|   A 能力探针    | 验证 headed launch、前台 visibility、截图、network、close 能力        |          否          | `blocked`，不进入产品矩阵                         |
| B 产品核心矩阵  | 验证 TODO 用户路径：首屏、筛选、下拉、树/平铺、详情、键盘、主题、滚动 |          是          | 保留已采证据；不换 session                        |
| C 故障/资源补证 | 验证失败恢复、single-flight、hydration、artifact/资源状态             | 仅对对应 checkpoint  | reload/控制面失败记 `blocked` 或 `not-applicable` |
|   D 独立复核    | 只读核对任务源、manifest、文件、尺寸、SHA、日志和状态映射             |   否，负责评分建议   | 不重新开浏览器，缺证据退回 `needs_check`          |

证据状态：`pass` = 断言和必需材料齐全；`partial` = 有效但缺少必需材料；`blocked` = 工具/外部权限阻塞且已保留原始事实；`not-run` = 未执行或结构性不适用。`partial/blocked/not-run` 不得勾选对应硬门禁。

### 1.2 能力探针最小命令集

```log
agent-browser skills get core
agent-browser doctor --offline --quick
agent-browser session list
agent-browser session id --scope worktree --prefix todo-<environment>-<date>
headed launch → tab foreground → visibilityState=visible
screenshot <probe.png> → Get-FileHash -Algorithm SHA256
network requests --json
agent-browser close
```

探针的目标是尽早识别浏览器控制面能力，不访问普通文档页，不执行 TODO 业务矩阵，不为“探针通过”生成业务结论。

## 2. 环境矩阵

|    环境    |                                启动命令                                |                      验收 URL                      |                          必须记录                           |
| :--------: | :--------------------------------------------------------------------: | :------------------------------------------------: | :---------------------------------------------------------: |
|    dev     |            `pnpm docs:dev -- --host 127.0.0.1 --port 8080`             |         `http://127.0.0.1:8080/todos.html`         |            进程日志、session、截图、DOM/网络断言            |
|  preview   | `pnpm docs:build`；`pnpm docs:preview -- --host 127.0.0.1 --port 4173` |         `http://127.0.0.1:4173/todos.html`         |   build 输出、进程日志、session、截图、资源/console 断言    |
| production |                         当前 GitHub Pages 部署                         | `https://ruan-cat.github.io/stars-list/todos.html` | commit SHA、部署结果、session、截图、HTTP/网络/console 断言 |

## 3. 证据文件命名与登记

截图命名：`{environment}-{scenario}-{timestamp}.png`。每条记录必须填写以下字段；缺少任一字段只能标记为 `参考`，不能标记为 `通过`。

|  环境  | Requirement / Scenario |  URL   | viewport | Chrome / agent-browser | session | 操作与命令 | 断言结果 | 截图文件 | SHA-256 |
| :----: | :--------------------: | :----: | :------: | :--------------------: | :-----: | :--------: | :------: | :------: | :-----: |
| 待执行 |         待执行         | 待执行 |  待执行  |         待执行         | 待执行  |   待执行   |  待执行  |  待执行  | 待执行  |

### 3.1 既有截图基线优先门禁

在启动任何 fresh dev、preview 或 production 验收前，必须先读取本 change 的 `evidence/` 目录并打开与当前场景对应的既有 PNG；不得只根据文件名、截图说明或 DOM 快照推断视觉结果。至少核对 `01-tree-initial.png`（树形首屏）、`02-tree-expanded.png`（展开态）、`03-select-dropdown.png`（下拉态）和 `08-dark-theme.png`（暗色主题）是否存在，并在操作日志中记录实际读取的绝对路径、PNG 尺寸和 SHA-256。

`01-tree-initial.png` 是树形首屏的视觉基线：仓库行左侧使用折叠箭头/仓库图标，**不存在浏览器默认列表圆点、额外列表缩进或 marker**。fresh 截图必须在相同 URL、viewport、滚动位置和主题下与该基线对照；若出现基线没有的圆点、缩进、滚动条或布局漂移，先记录失败证据并停止该环境验收，不得以“页面可打开”“DOM 结构正确”或构建通过替代视觉核验。

像素 diff 只能在同一 viewport、同一滚动位置、同一主题、同一字体/artifact 版本和可比的加载状态下执行。动态时间、光标、网络状态等区域必须 mask 或单独断言；同时登记原始 diff、归一化 diff 和结构性视觉结论。若历史基线缺少元数据，截图只能标记为“参考”，不能将不同比例或不同尺寸的图片宣称为通过。

### 3.2 提交前证据索引门禁

在勾选任务或提交工件前，逐行扫描当前 change 的 `manifest.md`：

1. 每个截图路径必须存在于 `evidence/`，PNG 尺寸必须与登记 viewport 一致。
2. 现场 `Get-FileHash -Algorithm SHA256` 必须与登记值一致；缺失或不匹配即为 `needs_check`。
3. 每张图必须回指当前环境、当前 session 和具体 Scenario；早期 partial session、同名旧图和未登记文件不得替代 fresh 证据。
4. 输出 `checked / missing / mismatched / unreferenced` 汇总；`missing` 或 `mismatched` 大于 0 时禁止勾选/归档。

## 4. 统一交互矩阵

- 首屏 artifact 加载、状态栏扫描口径与仓库树
- 刷新 pending、重复触发、失败恢复与错误可感知性
- 仓库/分支/类型下拉：鼠标打开、真实坐标选中、外部关闭、Escape 关闭、DOM 卸载
- 键盘：Tab、Enter/Space、ArrowUp/ArrowDown、Enter 提交、Escape 关闭、焦点回收
- 搜索/仓库/分支/类型组合筛选、清空一个维度、无匹配空状态
- 树形/平铺切换、选中态共享、详情 sticky 动作按钮
- 亮色/暗色主题、桌面无页面级双滚动、窄视口自然滚动
- 生产环境同样执行以上矩阵，不得用 dev/preview 结果替代

## 5. 失败与回滚记录

- 触发条件：关键 Scenario 失败、Portal 残留、页面级滚动、主题回归、普通文档像素变化、console/network 新错误
- 处置：停止当前环境验收，记录失败截图/日志、部署 commit SHA 和回滚命令
- 切流：通过现有 Flex 流量器切回上一个已知通过提交，登记切流前/后版本、操作者、时间、流量器返回状态和生产 URL；不得用本地 build 结果代替
- 回滚后：用同一 agent-browser session 重新打开生产 URL，至少复验首屏、下拉关闭、键盘焦点、主题、页面滚动五项；五项及网络/console 均通过后才可将回滚标记为完成

## 6. 2026-08-31 生产普通文档页基线采集（参考证据，不通过 2.3）

> 本次使用 headed Chrome + `--args --no-sandbox` 启动参数；agent-browser session 为
> `shadcn-vue-acceptance-e3381299a1aa`，agent-browser 版本 `0.35.0`，Chrome
> `152.0.0.0`，viewport `929×869`。三张截图来自同一 session，但没有可核验的
> 重构前 fresh baseline 哈希，因此不能宣称 2.3 通过，也未修改 tasks.md。

|    环境    | Requirement / Scenario |                       URL                        | viewport  |         Chrome / agent-browser          |               session                |                                                 操作与命令                                                  |                                                     断言结果                                                      |                  截图文件                   |                              SHA-256                               |
| :--------: | :--------------------: | :----------------------------------------------: | :-------: | :-------------------------------------: | :----------------------------------: | :---------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------: | :-----------------------------------------: | :----------------------------------------------------------------: |
| production |    2.3 普通文档首页    |     `https://ruan-cat.github.io/stars-list/`     | `929×869` | Chrome 152.0.0.0 / agent-browser 0.35.0 | `shadcn-vue-acceptance-e3381299a1aa` | `agent-browser open --headed --args '--no-sandbox'`；`wait --load networkidle`；`snapshot -i`；`screenshot` |                  HTTP/导航成功；DOM 快照成功；无法与重构前 fresh baseline 做像素 diff，**参考**                   |  `browser-2026-08-31/production-home.png`   | `048D6DBFC0DC2F4111B7B978E7CD95B369DA1FE400B64908A2FE766B3FF40B35` |
| production |   2.3 topics 普通页    | `https://ruan-cat.github.io/stars-list/topics/`  | `929×869` | Chrome 152.0.0.0 / agent-browser 0.35.0 | `shadcn-vue-acceptance-e3381299a1aa` |                                   同上；页面含大量主题链接，snapshot 成功                                   |                          HTTP/导航成功；DOM 快照成功；无 fresh before baseline，**参考**                          | `browser-2026-08-31/production-topics.png`  | `2BA42306007B414FFA5C6F5AD6512C5FF9AFBA2BA9AC8FCAE777248153439B95` |
| production |   2.3 prompts 普通页   | `https://ruan-cat.github.io/stars-list/prompts/` | `929×869` | Chrome 152.0.0.0 / agent-browser 0.35.0 | `shadcn-vue-acceptance-e3381299a1aa` |                                   同上；标题 `杂项提示词`，snapshot 成功                                    | HTTP/导航成功；DOM 快照成功；`scrollH=14496`、`scrollW=923`（长文档自然滚动）；无 fresh before baseline，**参考** | `browser-2026-08-31/production-prompts.png` | `4CE5DE4FCF423A52E496B1D73B2BB7EDADD32407A4D3624E6632088FA60EF1D1` |

### 6.1 阻塞与后续动作

- 2.3 仍阻塞：必须先取得重构前同 viewport、同 URL、同 Chrome/agent-browser 规范的 fresh baseline，再对 dev/preview/production 逐页执行像素 diff。
- 本次生产页面仅证明可导航、DOM 可读和截图可归档；不证明重构前后一致，也不替代 4.4 的普通文档页像素回归门禁。
- dev 启动尝试因当前执行器策略拒绝 `Start-Process` 重定向命令而未完成；没有伪造 dev/preview 通过证据。

## 7. 2026-08-31 dev 环境采集（2.3 参考，不通过）

> dev 服务由前台 `pnpm docs:dev -- --host 127.0.0.1 --port 8080` 串行启动。agent-browser session 为 `shadcn-vue-dev3-e3381299a1aa`，headed Chrome 连接因页面渲染和截图命令超时出现间歇性 EOF；首页与 topics 截图已生成，prompts 仅完成 DOM/滚动断言。由于没有同 viewport 的重构前 fresh baseline，以下证据只标记为 `参考`，不得勾选 2.3。

| 环境 | Requirement / Scenario |               URL                | viewport  |         Chrome / agent-browser          |            session             |                  操作与命令                  |                                  断言结果                                  |              截图文件               |                              SHA-256                               |
| :--: | :--------------------: | :------------------------------: | :-------: | :-------------------------------------: | :----------------------------: | :------------------------------------------: | :------------------------------------------------------------------------: | :---------------------------------: | :----------------------------------------------------------------: |
| dev  |    2.3 普通文档首页    |     `http://127.0.0.1:8080/`     | `929×869` | Chrome 152.0.0.0 / agent-browser 0.35.0 | `shadcn-vue-dev3-e3381299a1aa` |     `open`；`snapshot -i`；`screenshot`      |                导航/DOM 成功；无 before baseline，**参考**                 |  `browser-2026-08-31/dev-home.png`  | `2599E537C8500DBC258ACD34C9AF302F15451866FB36498C14802BEC7693C95E` |
| dev  |   2.3 topics 普通页    | `http://127.0.0.1:8080/topics/`  | `929×869` | Chrome 152.0.0.0 / agent-browser 0.35.0 | `shadcn-vue-dev3-e3381299a1aa` |     `open`；`snapshot -i`；`screenshot`      |                导航/DOM 成功；无 before baseline，**参考**                 | `browser-2026-08-31/dev-topics.png` | `CA9F09516D21C1C0BFEE6A1612B87D4FBAB4747093C95BDECF8BC25B5F9C263B` |
| dev  |   2.3 prompts 普通页   | `http://127.0.0.1:8080/prompts/` | `929×869` | Chrome 152.0.0.0 / agent-browser 0.35.0 | `shadcn-vue-dev3-e3381299a1aa` | `open`；`eval scrollH/scrollW`；`screenshot` | title=`杂项提示词`、`scrollH=16194`、`scrollW=923`；截图命令超时，**参考** |          未生成（timeout）          |                                 —                                  |

## 8. 2026-08-31 Select 交互 smoke（3.1/3.2，dev）

> session：`select-smoke-e3381299a1aa`；headed Chrome 152.0.0.0；viewport `929×869`。以下断言使用真实 agent-browser 交互和 DOM eval，截图命令因 TODO 页面 CDP `Page.captureScreenshot` 超时而未生成。

|    路径     |                 操作                  |                                DOM/状态断言                                |             结果              |
| :---------: | :-----------------------------------: | :------------------------------------------------------------------------: | :---------------------------: |
|  选中关闭   |        仓库下拉 → 选择 `10wms`        |      `contentExists=false`、触发器文本 `10wms`、`aria-expanded=false`      |             通过              |
| Escape 关闭 |         打开仓库下拉 → Escape         |  `contentExists=false`、`aria-expanded=false`、焦点回到 `aria-label=仓库`  |             通过              |
|  外部关闭   |       打开仓库下拉 → 点击 `h1`        |   `contentExists=false`、`aria-expanded=false`、**修复前焦点落在 BODY**    | 修复前失败，待新 session 复验 |
|  打开样式   |        打开仓库下拉 → DOM eval        | `data-state=open`、`animation=none`、`overflowY=scroll`、`maxHeight=320px` |             通过              |
|  清空筛选   |  选择 `10wms` → 点击 `清空仓库筛选`   |              触发器文本恢复 `所有仓库`、`contentExists=false`              |             通过              |
|    截图     | 打开下拉 → `agent-browser screenshot` |                     CDP `Page.captureScreenshot` 超时                      |         参考，待优化          |

> 3.2 门禁状态：选中/Escape/Portal 卸载断言仍有旧证据，但旧外点关闭焦点落 BODY，与 spec 冲突；实现已修复，必须由新 headed Chrome session 复验后才能重新勾选。

## 9. 2026-08-31 Resizable DOM smoke（3.4，dev）

> session：`resize-smoke-e3381299a1aa`；headed Chrome 152.0.0.0；viewport `929×869`。DOM eval 验证 canonical Resizable wrapper 的 separator 与两侧面板约束。

|                                         断言                                         | 结果 |
| :----------------------------------------------------------------------------------: | :--: |
| separator `aria-label=调整左右面板宽度`、`data-orientation=horizontal`、`tabindex=0` | 通过 |
|                             tree panel `min-width=280px`                             | 通过 |
|                           details panel `min-width=360px`                            | 通过 |
|                   `pnpm exec tsc --noEmit`、串行 `pnpm docs:build`                   | 通过 |

## 10. 2026-08-31 静态门禁摘要（不替代浏览器验收）

|          门禁          | 命令/证据                                                                                                      |                 结果                  |
| :--------------------: | :------------------------------------------------------------------------------------------------------------- | :-----------------------------------: |
| 3.6 ui scoped CSS 清理 | `rg -n "<style scoped" docs/.vitepress/theme/components/ui`                                                    |             无匹配，通过              |
|      4.3 类型检查      | `pnpm exec tsc --noEmit`                                                                                       |             exit 0，通过              |
|        4.3 构建        | 串行 `pnpm docs:build`                                                                                         |         exit 0，55.71s，通过          |
|        4.3 格式        | 本轮变更文件 `pnpm exec prettier --experimental-cli --check`（排除用户既有 `docs/prompts/index.md`）           |             exit 0，通过              |
|        组合筛选        | `pnpm exec tsx --test docs/.vitepress/theme/todo-tree.test.ts docs/.vitepress/theme/todo-artifact.test.ts`     |              11/11，通过              |
|     Tailwind 产物      | 对 `docs/.vitepress/dist/assets/*.css` 统计 `.h-full/.overflow-auto/.bg-muted/.text-foreground/.border-border` | 各 1 次，结合 §12 computed style 通过 |
|      刷新并发守卫      | `pnpm exec tsx --test docs/.vitepress/theme/use-todo-query.test.ts`                                            |  2/2，通过；并发调用复用同一 Promise  |

以上仅证明静态结构、类型、构建和纯函数行为；3.5/3.7 的 900/720px 布局、焦点竞态、主题与三环境视觉矩阵仍必须补 headed Chrome 截图和 DOM/网络/console 断言。

## 11. 2026-08-31 headed Chrome 重试失败（参考，不通过）

独立 reviewer 在最新工作区尝试启动 agent-browser headed Chrome，返回 exit 3 且未生成 `DevToolsActivePort`。此前同机 session 曾成功完成生产/dev 参考截图与局部 Select/Resizable DOM smoke；本次失败作为 F21 环境证据保留，不得将静态门禁升级为 3.5/3.7 或 4.5–4.7 的视觉通过。

## 12. 2026-08-31 Tailwind 运行时与响应式滚动复验（dev，部分通过）

> 冷启动 headed Chrome session：`shadcn-tw-mobile-e3381299a1aa`；agent-browser `0.35.0`；Chrome `152.0.0.0`；URL `http://127.0.0.1:8080/todos.html`。先执行 `agent-browser open --headed --args '--no-sandbox'`，再执行 `wait --load networkidle`、`set viewport`、`eval` 和 `screenshot`。CSSRules 复验确认 `.h-full`、`.overflow-auto`、`.bg-muted`、`.text-foreground` 均存在。

|          viewport          | DOM/计算样式断言                                                                                                        | 截图                                                                   | SHA-256                                                            | 结论 |
| :------------------------: | :---------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------- | :----------------------------------------------------------------- | :--: |
| 929×869（marker 修复截图） | `listStyle=none`、`paddingLeft=0`；TODO nav `overflowY=auto`；截图实际 PNG 尺寸 `929×869`                               | `browser-2026-08-31/dev-todos-1280x900-20260831.png`（保留既有文件名） | `22B90EC6285E1272D7955DB8A8CA86070CA80421F5CD19D5F3AA2888F9633DFA` | 通过 |
|    1280×900（DOM only）    | `docScrollH=900`；group `display=flex`、`height=379`；TODO nav `overflowY=auto`、`clientHeight=377`、`scrollHeight=908` | 未生成（当前 Chrome 截图物理尺寸未随 emulation 改变）                  | —                                                                  | 参考 |
|          720×900           | `docScrollH=1557`；group `display=block`、`height=932`；TODO nav `overflowY=visible`、`navScroll=764`，页面允许自然滚动 | `browser-2026-08-31/dev-todos-720x900-20260831.png`                    | `43D9B981EF2688FC50B36647D0DB2FECF8C522CBDF9855D49E4C2BB16F765293` | 通过 |

以上只覆盖 Tailwind 运行时产出、桌面/窄屏滚动与响应式布局；未覆盖三环境完整交互矩阵、亮暗主题、刷新竞态和生产部署，因此不能单独勾选 3.5、3.7 或 4.5–4.7。

## 13. 2026-08-31 preview headed Chrome 交互与主题复验（部分通过）

> 服务：串行 `pnpm docs:build`（exit 0，53.40s）后前台 `pnpm docs:preview -- --host 127.0.0.1 --port 4173`；session `shadcn-preview-hydration2-e3381299a1aa`；Chrome `152.0.0.0`；agent-browser `0.35.0`；viewport `1280×900`。artifact `http://127.0.0.1:4173/artifacts/github-todos/ruan-cat.json` 由 PowerShell `Invoke-WebRequest` 返回 HTTP 200、616092 bytes、`application/json`。

| Scenario              | 真实操作与断言                                                                                                                               | 截图/证据                                                                                                                                     |             结果              |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------: |
| 仓库下拉选中/清空     | headed Chrome 坐标点击仓库 → 选择 `10wms` → `contentExists=false`、`aria-expanded=false`、147 可见 TODO；点击清空后恢复“所有仓库”            | DOM eval；session 同上                                                                                                                        |             通过              |
| Escape/外点关闭       | 键盘 Escape 与坐标点击 `h1`；Portal listbox 卸载，Escape 后焦点回到 `aria-label=仓库`；该行采集于焦点修复前，外点结果不可沿用                | DOM eval；旧 session `shadcn-preview-hydration2-e3381299a1aa`                                                                                 | 修复前失败，待新 session 复验 |
| 树/平铺/详情          | 点击“平铺”后 `role=listbox[aria-label=TODO 平铺列表]`、699 options；选择首行后详情显示仓库/路径/分支/行号与 GitHub 外链                      | DOM snapshot/eval；`preview-todos-tree-light-20260831.png`                                                                                    |             通过              |
| 刷新 pending/恢复焦点 | 聚焦“刷新快照”并点击；pending 时 `disabled=true`、`aria-busy=true`；约 500ms 后恢复可用、焦点回到刷新按钮并显示成功反馈                      | DOM eval；session 同上                                                                                                                        |             通过              |
| 亮色主题              | 点击树形并保持亮色，截图归档                                                                                                                 | `browser-2026-08-31/preview-todos-tree-light-20260831.png`；SHA-256 `849BEF7E7E3E786F81B360ED85FC57710F3929DA4D51212D03829C24B9977069`        |             通过              |
| 暗色主题              | 点击 VitePress 主题开关，`document.documentElement.className=dark`，截图归档                                                                 | `browser-2026-08-31/preview-todos-tree-dark-20260831.png`；SHA-256 `88272AB1DC9DEB9E11AA03EC9DC27F3FC068ACF944FE7522D8A0AB20190D36A0`         |             通过              |
| 亮色稳定截图          | 主题切换完成后等待 1200ms，再截树形首屏；PNG 实际尺寸 `1280×900`，无列表 marker                                                              | `browser-2026-08-31/preview-todos-tree-light-stable-20260831.png`；SHA-256 `D20B9345C786BA7D9C47E5C88B385B54815DE6D34D2D21C63CD15449B11FCFBD` |             通过              |
| 暗色稳定截图          | 主题切换完成后等待 1200ms，`document.documentElement.className=dark`、body 背景 `rgb(27, 27, 31)`；PNG 实际尺寸 `1280×900`                   | `browser-2026-08-31/preview-todos-tree-dark-stable-20260831.png`；SHA-256 `6DDADD4F7BFF5BD3EF772701727F03BEFF4DC8515CC03DC32402E645302095BE`  |             通过              |
| console 基线          | TODO 页 reload 后仅有 `Hydration completed but contains mismatches`；同 session 访问普通首页同样出现该警告；未出现之前的 `InvalidStateError` | `agent-browser console/errors` 输出                                                                                                           |   参考，需后续治理全站基线    |

preview 已有可回放的局部通过证据，但未完成 spec 全部 Scenario、普通文档 before/after 像素 diff、production 当前提交部署和失败回滚，因此任务 2.3、3.5、3.7、4.1–4.2、4.4–4.7 仍不得勾选。

## 14. 2026-08-31 production 部署基线（阻塞 4.7，不通过）

只读核验结果：本地 HEAD `c90abb1a16cadfdd9eedcd6dfd36ac3c78e84966`（工作区仅保留用户既有 `docs/prompts/index.md`），`origin/dev=d00fa4001f772136cdb4fd55f2add8d121a287a8`，`origin/main=1c468f491e145ca3dbd38a4e76f71c23457b38c2`；本地验收提交不在远端。最新 GitHub Pages workflow run `33366784039` / deployment `6176611081` 的 head SHA 为 `1c468f4`，不是本 change。

| 检查                | 结果                                                                                                                                                                                    |
| :------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| production URL      | `https://ruan-cat.github.io/stars-list/todos.html` HTTP 200；当前线上 CSS/JS 资源 8 个均 HTTP 200                                                                                       |
| production artifact | `https://ruan-cat.github.io/stars-list/artifacts/github-todos/ruan-cat.json` HTTP 200，616092 bytes；`repositoryCount=78`、`scannedRepositoryCount=51`、`todoCount=700`、`errorCount=0` |
| 本地/线上产物       | 本地 CSS 含 `bg-muted`，线上 `style.mmjW0rRs.css` 不含；HTML/asset hash 不同，证明线上仍是旧部署                                                                                        |
| 回滚基线            | 上一个成功 deployment `6164041902`，SHA `ad73188e9c33db59aa4b82d17884b4a882d43580`；仅作候选基线，不能替代 Flex 流量器回执                                                              |
| Flex 流量器         | 仓库内无可自证的 Flex CLI/config；失败时必须取得外部切流回执，禁止用本地 build 代替                                                                                                     |

headed Chrome 生产直连尝试：session `shadcn-production-old-e3381299a1aa` 返回 `net::ERR_CONNECTION_CLOSED`；第二 session `shadcn-production-old2-e3381299a1aa` 在 Chrome 启动阶段返回 exit 3（`DevToolsActivePort` 未生成）。PowerShell `Invoke-WebRequest` 的 200 只能作为 HTTP 基线，不能替代生产浏览器矩阵。

因此 production GET 200 只能证明旧站点可达，不能支撑 4.7；必须在用户授权后合并/推送 main、等待 Pages workflow 成功，再用 headed Chrome 完整矩阵验收。

## 15. 2026-08-31 同 viewport 树形基线 diff（preview，参考）

headed Chrome session `shadcn-pixel-1600-e3381299a1aa` 在 `http://127.0.0.1:4173/todos.html` 使用 `1600×1000` 采集 `preview-todos-1600x1000-20260831.png`，并执行：

```log
agent-browser diff screenshot --baseline openspec/changes/2026-8-30-use-shadcn-vue/evidence/01-tree-initial.png
✗ 4.60% pixels differ
  73642 different / 1600000 total pixels
```

该 diff 证明当前图与原始基线并非像素一致，不能勾选 2.3/4.4；但人工/DOM 对照确认原始基线无列表 marker，当前修复图的 `listStyle=none`、`paddingLeft=0` 与视觉均无黑点。PNG 实际尺寸 `1600×1000`，SHA-256：`6EB3A5D807B2DDDCF066DA9BD620F94AD7B58F2D224174FAE7AF9272ADAAA773`。

## 16. 2026-08-31 preview 刷新失败与恢复（受控故障注入）

> session `shadcn-preview-recovery-e3381299a1aa`；viewport 实际 PNG `929×869`。先以 `window.fetch=()=>Promise.reject(new Error("forced preview failure"))` 注入故障，再恢复原 fetch 并解除 agent-browser route，均使用真实按钮点击。

|   状态   | 断言                                                                                                                                                     | 截图                                                                 | SHA-256                                                            | 结果 |
| :------: | :------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------- | :----------------------------------------------------------------- | :--: |
|   失败   | 点击“刷新快照”后显示 `刷新失败：Failed to fetch TODO artifact`；按钮恢复可操作并保持 `aria-busy=false`                                                   | `browser-2026-08-31/preview-refresh-failure-20260831.png`            | `778797F37F7B283DECAA7558169BF71B5DA33B126ED82ABA6DB194A7CB100CAE` | 通过 |
| 首次失败 | 清理 local/session storage，route 在 reload 前 abort artifact；状态栏 role=status/alert 与页面错误态显示 `Failed to fetch TODO artifact`，无伪造统计数字 | `browser-2026-08-31/preview-initial-failure-20260831.png`（929×869） | `7F5113EBB7B1DF88B6F571FF11E74EF2A01EEA9C2DE63E28AE2A624084B2FE4F` | 通过 |
|   恢复   | 恢复 fetch/解除 route 后真实点击刷新，显示“快照已更新”；`disabled=false`、`aria-busy=false`、焦点回到 `aria-label=刷新快照`                              | `browser-2026-08-31/preview-refresh-recovered-20260831.png`          | `5089584C6AADDD3DF18997168CBF479EC6F3AFFEC4B050FC3016CD4A8D53BDFE` | 通过 |

该证据覆盖失败可感知性与恢复焦点，不替代三环境完整矩阵；故 3.7/4.1/4.6 仍保持未勾选。

## 17. 2026-08-31 preview 键盘路径复验（部分通过）

> session `shadcn-first-failure-e3381299a1aa`；headed Chrome；preview URL；使用 `focus`、`press`、DOM eval，未使用合成事件。

| 路径               | 断言                                                                                                              | 结果 |
| :----------------- | :---------------------------------------------------------------------------------------------------------------- | :--: |
| Tab 顺序           | 聚焦 `aria-label=搜索 TODO` 后按 Tab，焦点进入 `aria-label=仓库`                                                  | 通过 |
| Space/Arrow/Escape | 在仓库触发器按 Space，`aria-expanded=true`；ArrowDown 移动后按 Escape，`aria-expanded=false` 且焦点回到仓库触发器 | 通过 |
| 树折叠键盘         | 聚焦首个 `TODO Explorer` 的“展开”按钮按 Enter，按钮文案变为“收起”                                                 | 通过 |

本节补足部分键盘证据；仍未覆盖所有四维筛选组合、Portal 滚动键盘、移动端焦点和 production，因此 3.7/4.1/4.5–4.7 继续未勾选。

## 18. 2026-08-31 Select 关闭焦点修复复验（dev，候选通过）

> 修复后 headed Chrome session：`shadcn-focus-fix4-e3381299a1aa`；URL `http://127.0.0.1:8080/todos.html`；Chrome `152.0.0.0`；agent-browser `0.35.0`。全部使用真实坐标点击/真实 Escape 键，DOM eval 只读取结果。

| 路径        | DOM 断言                                                                                                                    | 结果 |
| :---------- | :-------------------------------------------------------------------------------------------------------------------------- | :--: |
| 外点关闭    | 打开仓库下拉 → 坐标点击 `h1`；`aria-expanded=false`、Portal options=0、activeElement `aria-label=仓库`                      | 通过 |
| 选中关闭    | 打开仓库下拉 → 坐标点击 `10wms`；触发器值 `10wms`、`aria-expanded=false`、Portal options=0、activeElement `aria-label=仓库` | 通过 |
| Escape 关闭 | 打开仓库下拉 → Escape；`aria-expanded=false`、Portal options=0、activeElement `aria-label=仓库`                             | 通过 |

该节取代 §8 中“修复前焦点落 BODY”的失败状态；旧失败证据保留用于解释修复原因。由于后续 fresh preview session 仍发现外点焦点回收回到 BODY，该节只能视为候选历史证据；最终结果以 §20 的修复后 session 为准。

## 19. 2026-08-31 组件层自动化回归（3.7）

| 命令                                                                                                                                                                                                          | 结果            | 覆盖边界                                                                                                                                                                                                                            |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:components`                                                                                                                                                                                        | Vitest 7/7 通过 | TodoFilters 的 Enter/Space/ArrowUp/ArrowDown/Escape、选中提交、close-auto-focus 焦点回收；四个筛选控件键盘可达且无伪 disabled；TodoDashboard 首次失败/无假计数/重试、刷新 disabled/aria-busy、重复点击 single-flight 与结束焦点恢复 |
| `pnpm exec tsc --noEmit`                                                                                                                                                                                      | exit 0          | SFC 与测试类型检查                                                                                                                                                                                                                  |
| `pnpm todo:test`                                                                                                                                                                                              | 30/30 通过      | scanner 既有测试与四维组合筛选/无匹配边界                                                                                                                                                                                           |
| `pnpm exec prettier --experimental-cli --check package.json pnpm-lock.yaml vitest.config.ts docs/.vitepress/theme/components/todo-dashboard.component.test.ts docs/.vitepress/theme/components/ui/Select.vue` | 通过            | 本轮测试基础设施与 Select 修复文件格式                                                                                                                                                                                              |

测试基础设施见根目录 `vitest.config.ts`（Vue plugin + happy-dom），组件用例见 `docs/.vitepress/theme/components/todo-dashboard.component.test.ts`。happy-dom 无法可靠模拟 Reka 的真实 `pointerdown-outside`，所以外点关闭必须以 headed Chrome 的真实坐标证据复验，不能把该边界写成自动化通过。

## 20. 2026-08-31 preview Select 焦点修复 fresh headed Chrome 复验

> 先串行执行 `pnpm docs:build`（exit 0，61.29s），再以前台 `pnpm docs:preview -- --host 127.0.0.1 --port 4173` 服务打开 URL。session `shadcn-preview-fix-e3381299a1aa`；Chrome `152.0.0.0`；agent-browser `0.35.0`；viewport `1280×900`；启动参数 `--headed --args '--no-sandbox,--disable-gpu'`。全新 session 初始 console 仅记录全站既有 `Hydration completed but contains mismatches.`，未出现新的 `InvalidStateError`。

| 路径        | 真实操作与断言                                                                                                                                   | 截图                                                                  | SHA-256                                                            | 结果 |
| :---------- | :----------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------- | :----------------------------------------------------------------- | :--: |
| 外点关闭    | 坐标点击仓库触发器打开 → 坐标点击 `h1` → 等待 300ms；`aria-expanded=false`、Portal options=0、值保持 `10wms`、activeElement 为 `aria-label=仓库` | `browser-2026-08-31/preview-focus-fix-outside-1280x900-20260831.png`  | `A6A9E10FC3AD1DAF2B0EF2DEACD3C0872817EDE7B617E3CD523C173BCCD30713` | 通过 |
| 选中关闭    | 打开仓库下拉 → 坐标点击 `10wms` → 等待 300ms；值为 `10wms`、Portal options=0、activeElement 为仓库触发器、147 可见 TODO                          | `browser-2026-08-31/preview-focus-fix-selected-1280x900-20260831.png` | `2B377684D3A7652EFC10B65C227B0021AFFCA6E06349FF6C8F5ABD8EDEB10E46` | 通过 |
| Escape 关闭 | 打开仓库下拉 → 真实 Escape → 等待 300ms；`aria-expanded=false`、Portal options=0、值保持 `10wms`、activeElement 为仓库触发器                     | `browser-2026-08-31/preview-focus-fix-escape-1280x900-20260831.png`   | `A6A9E10FC3AD1DAF2B0EF2DEACD3C0872817EDE7B617E3CD523C173BCCD30713` | 通过 |

该节只证明 Select 三条关闭路径在 preview 的真实浏览器行为；它不替代 4.5–4.7 的完整三环境矩阵、普通文档像素回归或 production/Flex 部署证据。

## 21. 2026-08-31 dev Select/刷新/响应式 fresh headed Chrome 复验

> 服务：前台 `pnpm docs:dev -- --host 127.0.0.1 --port 8080`；session `shadcn-dev-fix-e3381299a1aa`；Chrome `152.0.0.0`；agent-browser `0.35.0`；启动参数 `--headed --args '--no-sandbox,--disable-gpu'`。1280×900 首屏与互动路径的 console 无新增消息；720×900 用于窄视口布局断言。

| 路径          | 真实操作与断言                                                                                                              | 截图                                                             | SHA-256                                                            | 结果 |
| :------------ | :-------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------- | :--: |
| 首屏/marker   | 打开 `/todos.html`，等待 `699 可见 TODO`；`docScrollH=900`、`docScrollW=1280`、树列表 `listStyleType=none`、`paddingLeft=0` | `browser-2026-08-31/dev-focus-fix-initial-1280x900-20260831.png` | `FB69E70F57A780D98BAF19CD5B75526C39D5C9F4BA2A938DDB5FFE1F2106B39F` | 通过 |
| 外点关闭      | 真实坐标打开仓库下拉 → 坐标点击 `h1` → 等待 300ms；`aria-expanded=false`、Portal options=0、activeElement 为仓库触发器      | `browser-2026-08-31/dev-focus-fix-outside-1280x900-20260831.png` | `630677128F92F8608FA958063A2CC2AEDA16BC0971788236C3C5D201BB5B8FAA` | 通过 |
| 刷新禁用/恢复 | 真实坐标点击刷新；100ms 内 `disabled=true`、`aria-busy=true`；500ms 后恢复可用、成功提示出现、焦点回刷新按钮                | `browser-2026-08-31/dev-focus-fix-refresh-1280x900-20260831.png` | `9C00450D01A072307E66150CD31497E531CAC4C59ED6010F122BDC3A2684EA4A` | 通过 |
| 窄视口        | 设置 720×900；group `display=block`、文档自然滚动 `docScrollH=1525`、`docScrollW=714`                                       | `browser-2026-08-31/dev-focus-fix-mobile-720x900-20260831.png`   | `07AA15848D2A25E7B216B1DB549691E000B2A874EE892558906BD2B7BB5FFEFD` | 通过 |

本节仍是 dev 的局部 fresh 证据；四维组合筛选、下拉滚动/清空、树/平铺/详情全量路径、主题双态和失败注入需按 4.5 完整矩阵继续登记。

## 22. 4.5/4.6 完整矩阵缺口审计（未通过）

独立 reviewer 对 §12–§21 按“同一环境 fresh headed session + 操作日志 + DOM/网络/console 断言 + 截图哈希”口径复核。以下表格是当前固定的补证矩阵；“部分”不能升级为“通过”，未登记的 `dev-full-*`/`preview-full-*` PNG 也不计入覆盖率。

|             场景             |                              dev（4.5）                              |                         preview（4.6）                         | 最小补证要求                                                            |
| :--------------------------: | :------------------------------------------------------------------: | :------------------------------------------------------------: | :---------------------------------------------------------------------- |
|      首屏/artifact 成功      | 部分：有 699、滚动和 marker；缺状态栏全量计数与 artifact HTTP/schema | 部分：有 artifact HTTP 200；缺同 session 首屏全量计数/网络日志 | 同一 fresh session 记录状态栏、artifact 请求 200、响应 schema、截图哈希 |
|         首次加载失败         |                                  缺                                  |               §16 已有受控失败，但未纳入统一矩阵               | 两环境注入失败并记录 alert/无假计数/重试恢复                            |
|   搜索+仓库+分支+类型组合    |                                  缺                                  |                        缺（仅仓库单维）                        | 真实 UI 设置四维交集、清空一维、无匹配截图与计数                        |
|        下拉滚动/清空         |               部分：旧 DOM 证据，缺当前 fresh 统一记录               |     部分：选中/清空有记录，缺真实滚动末端与 viewport 指标      | 坐标打开、滚动到末端、记录 `overflow-y=scroll`/`max-height=320px`/卸载  |
|       树展开/选中/详情       |                                  缺                                  |                    部分：有树折叠和详情文本                    | 同 session 树展开、树行选中、详情链接可达/截图                          |
|           平铺切换           |                                  缺                                  |                     部分：有 699 rows 记录                     | dev 与 preview 都记录平铺 rows、选中态共享和截图                        |
| Tab/Enter/Space/Arrow/Escape |                                  缺                                  |     部分：缺完整 Tab 顺序、ArrowUp、Enter 提交和移动端焦点     | 逐键记录 activeElement、aria 状态、Portal 卸载和截图                    |
|        刷新禁用/竞态         |                  部分：disabled/aria-busy/恢复焦点                   |                           部分：同上                           | 延迟响应下重复点击请求数、旧响应顺序保护、恢复截图                      |
|          亮/暗主题           |                                  缺                                  |              部分：有稳定主题截图，未复跑完整矩阵              | 两环境各跑完整关键路径并记录 console/截图                               |
|        页面/面板滚动         |                      部分：桌面/窄屏有 metrics                       |                               缺                               | 桌面 `docScrollH===innerH`、树/详情内部 scroll/client、720 堆叠         |
|    artifact/资源/console     |                             缺统一请求表                             |     部分：artifact 200、hydration 为全站基线；缺资源全量表     | 记录 artifact 与 CSS/JS HTTP 状态、console 基线与新增错误数             |

在上述矩阵全部补齐前，`tasks.md` 的 4.5、4.6、4.1 和 4.2 保持未勾选；生产 4.7 另需部署 SHA、Pages 成功、headed Chrome 和 Flex 切流/回滚回执。

## 23. 2026-08-31 TODO 核心 dev fresh 矩阵（部分通过）

> 这是针对本 change 主目标 TODO 页的单一 fresh headed Chrome session，不是普通文档页测试。服务：`pnpm docs:dev -- --host 127.0.0.1 --port 8080`；session `todo-core-dev-cdp-e3381299a1aa`，通过 CDP 连接 headed Chrome `152.0.0.0`；agent-browser `0.35.0`；viewport `1280×900`（窄屏行另设 `720×900`）。先读取既有 `evidence/01-tree-initial.png`，再执行真实坐标/键盘操作。

|    TODO 核心路径     | 同一 session 的 DOM/视觉结果                                                                                                                       | 截图                                                                        | SHA-256                                                            | 结果 |
| :------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------- | :----------------------------------------------------------------- | :--: |
|    首屏与 marker     | 状态栏 `699 可见 TODO`、`78 个仓库`、`扫描状态 complete`；`listStyleType=none`、`paddingLeft=0`；修复后 `docScrollH=900`、viewport 高度 900        | `browser-2026-08-31/core-dev-layout-fix-initial-1280x900-20260831.png`      | `F46332CFBAE3ACDBF5D9EFAE371ADA6D046A2363ED474B5F34C41D19A026D719` | 通过 |
| 下拉滚动与常驻滚动条 | 真实坐标打开仓库下拉，真实滚轮后 `overflowY=scroll`、`maxHeight=320px`、`scrollTop=368`、`scrollHeight=688`、`clientHeight=320`；Portal options=21 | `browser-2026-08-31/core-dev-dropdown-scroll-1280x900-20260831.png`         | `790E17F5CF48A2A99AB46947386452B47FC7CB4099EBBB10B0E353F5CF2F9C94` | 通过 |
|     四维组合筛选     | 真实选择仓库 `10wms`、分支 `dev`、类型 `source-comment`，输入 `validation`；状态栏 `2 可见 TODO`、非空树                                           | `browser-2026-08-31/core-dev-layout-fix-combo-1280x900-20260831.png`        | `4188EF77F64BB7AC4BEE14C0B75A3A003D7411E3AA6BAFFFE6E3F8128DFF89A9` | 通过 |
|     清空/无匹配      | 清空类型后输入 `never-match-2026`；空状态文案出现、`0 可见 TODO`、页面仍无滚动溢出                                                                 | `browser-2026-08-31/core-dev-layout-fix-no-match-1280x900-20260831.png`     | `0E3715E5BECADA93B7E23B9486C7505C97326216565E5D2A46D283D74E0FBA45` | 通过 |
|     树展开与详情     | 真实坐标展开仓库/分支/目录/文件，选中 TODO；详情显示仓库、路径、分支、行号、commit 与“在 GitHub 查看”                                              | `browser-2026-08-31/core-dev-layout-fix-tree-details-1280x900-20260831.png` | `D3DE446444C3D19ADA0FBEAFFA2F31E1BBF70C59CBE065C94760BBBB8A5B5C83` | 通过 |
|       平铺视图       | 点击“平铺”，`aria-pressed` 同步，平铺列表展示 699 条 TODO，详情仍保留                                                                              | `browser-2026-08-31/core-dev-layout-fix-flat-1280x900-20260831.png`         | `B4E21876E904EF2BD1297C0867164183E5B5A9F24B8015871E5865282C8D0EBF` | 通过 |
|       暗色主题       | 当前核心 dev session 主题切换动作未形成与最终布局修复一致的截图；preview §13/§20 已有暗色证据，dev 仍需补采                                        | —                                                                           | —                                                                  | 参考 |
|  刷新禁用/恢复焦点   | 刷新期间 `disabled=true`、`aria-busy=true`；完成后恢复可用、焦点回到刷新按钮、桌面 `docScrollH=900`                                                | `browser-2026-08-31/core-dev-layout-fix-refresh-1280x900-20260831.png`      | `ABD3EBE473D3215BFCF58470CCD834C0FB2BE08CB96A3623EB82AD9FA9CA3C7A` | 通过 |
|        窄视口        | 720×900 下 group `display=block`，文档自然滚动 `docScrollH=36649`、`docScrollW=714`                                                                | `browser-2026-08-31/core-dev-mobile-720x900-20260831.png`                   | `25366053A4AB02167B73C65E8DA719753462175D2BBF21CF43BB864297768A14` | 通过 |

本节仍缺 dev 首次加载失败注入、刷新重复点击请求计数/乱序响应、完整 Tab/Arrow/Escape 顺序与 artifact/资源 HTTP 记录，因此 `tasks.md` 4.5/4.1 继续未勾选；它只证明 TODO 主页面已经有可回放的核心路径证据。

## 24. 2026-09-01 dev 手工 Chrome+CDP fallback（部分，未通过 4.5）

> 按 `use-agent-browser` 技能，在自动启动 exit 3 后采用一次明确的替代生命周期：前台隔离 Chrome PID `30252`（产品版本 `151.0.7922.174`，`--remote-debugging-port=9229`、独立临时 profile），agent-browser `0.35.0` 通过 CDP 连接 session `todo-dev-cdp-20260901-c`；目标 URL `http://127.0.0.1:8080/todos.html`，viewport `1280×900`。本 session 先读取 `evidence/01/02/03/08` 基线，未访问普通文档页。dev server PID/端口为当前前台 `pnpm docs:dev`/8080。

| TODO 场景     | 同一 session 的操作与断言                                                                                                                                 | 截图与 SHA-256                                                                                                                        |    结果     |
| :------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ | :---------: |
| 首屏/marker   | 状态栏显示 699/78/已扫描 51/complete；`docScroll=1280×900`；树 `listStyle=none`、`paddingLeft=0`                                                          | `browser-2026-09-01/dev-cdp-initial-1280x900-20260901.png` · `3A8C9B124E21F2BF605E8BD4993D09C01DAA2226DEB7249A9D7D9D281998C015`       |    参考     |
| 仓库下拉      | 打开仓库下拉；21 个 option，包含可见性 SVG；截图已生成，但 outer listbox computed `max-height=384px/overflow=hidden`，需以内部 viewport 复核 320px/scroll | `browser-2026-09-01/dev-cdp-repo-dropdown-1280x900-20260901.png` · `9F990F77882B1A2305BDF342B77D5A936146AD955F33A0A8D0F0222C3261B53B` |    参考     |
| 仓库选择      | 选择 `10wms` 后触发器值为 `10wms`，树只剩 `ruan-cat/10wms 147`                                                                                            | `browser-2026-09-01/dev-cdp-repo-selected-1280x900-20260901.png` · `A58DC4621B75BF5915D5A3EEAFB04C2AA28550DCF99A22AA88C7111B33359B5D` |    参考     |
| 四维组合      | 选择 `10wms` + `dev` + `source-comment`，输入 `axios`；状态栏显示 6 可见 TODO，树非空                                                                     | `browser-2026-09-01/dev-cdp-combo-1280x900-20260901.png` · `8CAD27F554F26393AFD882B6D27488A88B017F38EA58F703DCFD2D174867DE77`         |    参考     |
| 无匹配/清空   | 输入 `zzzz-no-match-20260901`；出现“当前筛选条件下没有 TODO”、0 可见 TODO、`docScroll=1280×900`；随后清空搜索与三维筛选                                   | `browser-2026-09-01/dev-cdp-no-match-1280x900-20260901.png` · `F749CA713D0E6EE7AAD61BFD9C74E702179C473943F9EED5E48CF35BF57D2154`      |    参考     |
| 树展开/详情   | 搜索 `axios`，真实展开仓库→分支→目录→文件→TODO；选中态为 `aria-selected=true`，详情链接指向 GitHub 行号，页面无级滚动                                     | `browser-2026-09-01/dev-cdp-tree-details-1280x900-20260901.png` · `6668F59B629208C53C908F6A353C16354AA7D79B0162D3BEE919492ECEFA713D`  |    参考     |
| 平铺/共享选中 | 切换“平铺”后 6 条 option 展示，详情仍保留；原始 PNG capture 首次 timeout，按止损策略使用 agent-browser JPEG 低负载截图后转换 PNG                          | `browser-2026-09-01/dev-cdp-flat-1280x900-20260901.png` · `B832E87349EA1ABC5B649EE9D8A6C98B5ACAECC628315105506514AF6751BCBA`          |    参考     |
| Escape 焦点   | 同一 session 尝试打开下拉并按 Escape；agent-browser `press` 未形成可观察 keydown，合成 Escape 可关闭 Portal 但 `activeElement=BODY`，未证明焦点回收       | 无新增通过截图；原始失败记录保留在本轮命令输出/F34                                                                                    | 失败/待修复 |

本节证明了 TODO 核心路径的部分可回放状态，但缺首次加载失败注入、刷新竞态请求计数/乱序响应、可靠的真实键盘矩阵、双主题、720px、artifact/静态资源 HTTP 表和 console 基线；不得勾选 4.5/4.1。

## 25. 2026-09-01 preview 单 session 关键路径复验（部分，未通过 4.6）

> 串行 `pnpm docs:build` exit 0（56.91s）后启动 `pnpm docs:preview -- --host 127.0.0.1 --port 4173`。使用隔离 headed Chrome PID `23092`（产品版本 `151.0.7922.174`，CDP `9231`，独立临时 profile），agent-browser `0.35.0`，唯一 session `todo-preview-fix-20260901-d`，URL `http://127.0.0.1:4173/todos.html`，viewport `1280×900`。先读取 `evidence/01-tree-initial.png`、`03-select-dropdown.png`、`08-dark-theme.png`，再在同一 session 操作；完成后关闭 session、服务器和 Chrome，4173/9231 无监听。

> 版本边界：本节采集时使用的是后续 dev 调试前的焦点监听实现；随后源码又收窄了 Select 实例匹配并上移为 window capture（见当前 dev §26/F36）。因此本节截图可作为 preview 页面/视觉参考，不能单独证明当前源码的 Escape 焦点修复，也不能代替当前版本的 4.6 完整矩阵。

| TODO 场景          | 同一 session 的操作与断言                                                                                                                                                      | 截图与 SHA-256                                                                                                                                                                                                                                                                                     | 结果 |
| :----------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--: |
| 首屏/同源 artifact | 等待 `699 可见 TODO`；refresh 后 `GET http://127.0.0.1:4173/artifacts/github-todos/ruan-cat.json` 两次均 HTTP 200；清空 console 后无新增 console/error                         | `browser-2026-09-01/preview-fix-initial-1280x900-20260901.png` · `9E87A701299D4B4AF4841BC4112451C1A91B358F1814E9BFCFD197A79EB764A5`                                                                                                                                                                | 参考 |
| Escape 关闭/焦点   | headed Chrome `focus → Enter → ArrowDown → Escape`；`aria-expanded=false`、Portal options=0、activeElement=`aria-label=仓库`                                                   | `browser-2026-09-01/preview-fix-escape-1280x900-20260901.png` · `F14FF9B8D07FCA20B7583531205719042410B3CF9662D31C12C935CB02559FCF`                                                                                                                                                                 | 通过 |
| 外点关闭/焦点      | 坐标点击触发器后坐标点击标题区域；`aria-expanded=false`、Portal options=0、activeElement 为仓库触发器                                                                          | `browser-2026-09-01/preview-fix-outside-1280x900-20260901.png` · `885D4E616C19BE6088F3B274479DDE209D2F1150390F47FDA8E3503F2390C6FD`                                                                                                                                                                | 通过 |
| 选中关闭/计数      | 选择 `10wms`；触发器值 `10wms`、147 可见 TODO、Portal options=0、焦点回仓库触发器；随后清空恢复所有仓库/699                                                                    | `browser-2026-09-01/preview-fix-selected-1280x900-20260901.png` · `32A7F70904DCA3C47B9924D56D28957D439C458D2508CEEF045C0E1CE4F9A3F7`                                                                                                                                                               | 通过 |
| 下拉滚动/样式      | 21 个 option；内部 `[data-reka-select-viewport]` `maxHeight=320px`、`overflowY=scroll`、`scrollHeight=688`、`clientHeight=320`；设置 `scrollTop=368` 到末端                    | `browser-2026-09-01/preview-fix-dropdown-1280x900-20260901.png` · `89297AED928B63EE9304F9CD861094644A3E73C214F9BB8B16DB74E0ED000879`；末端 `browser-2026-09-01/preview-fix-dropdown-bottom-1280x900-20260901.png` · `7945F85429DE93929815F2F4E7FFE837029E97928FC3B49A8A402CEF5B05E5CD`             | 通过 |
| 平铺/面板滚动      | 切换平铺，`role=listbox` 下 699 个 option；面板 `scrollHeight=35421/clientHeight=377`，页面 `1280×900` 无级滚动；详情保持可见                                                  | `browser-2026-09-01/preview-fix-flat-1280x900-20260901.png` · `660EA4825478836B9356F76C5A5D495AD1A861B8AC0E4674B047CC75CF601A46`                                                                                                                                                                   | 参考 |
| 暗色主题           | 切换主题后 `document.documentElement.classList.contains('dark')=true`、`colorScheme=dark`、body 背景 `rgb(27, 27, 31)`、页面无级滚动                                           | `browser-2026-09-01/preview-fix-dark-1280x900-20260901.png` · `BA819C9D5390DC3BC78675F109B54209D5E4E8DB05A935C6700A409A2ACF2AA5`                                                                                                                                                                   | 通过 |
| 刷新失败/恢复      | 临时替换 `window.fetch` 使刷新失败，出现 `刷新失败：Failed to fetch TODO artifact`；恢复原 fetch 后刷新成功、alert 清除、按钮 `disabled=false/aria-busy=false`、焦点回刷新按钮 | 失败 `browser-2026-09-01/preview-fix-refresh-failure-1280x900-20260901.png` · `FE9F3585C3BE3BC0396BDC001F3BCF270D937066CAFFD0CB072FC77CF8D05962`；恢复 `browser-2026-09-01/preview-fix-refresh-success-1280x900-20260901.png` · `9629AA3D2472D6DCE1440BC5E108CB3538D13FFE28DCC80D20EBE55BE9CDDE1C` | 通过 |

本节是单 session 的 preview 关键路径证据，仍未覆盖首次加载失败、完整四维组合/清空、刷新竞态请求计数与乱序响应、720px、详情深滚动、静态 CSS/JS 全资源表和三环境统一矩阵；`tasks.md` 4.6/4.1 继续未勾选。

## 26. 2026-09-01 dev 可见 headed-CDP 最终矩阵（部分，未通过 4.5）

> 先执行 `agent-browser doctor --offline --quick`（7 pass/0 warn/0 fail），再启动 `pnpm docs:dev -- --host 127.0.0.1 --port 8080`。使用隔离 headed Chrome PID `6976`（产品版本 `151.0.7922.174`，CDP `9239`，`--no-sandbox --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --disable-background-timer-throttling`），agent-browser `0.35.0`，唯一 session `todo-dev-final-20260901-h`，URL `http://127.0.0.1:8080/todos.html`，viewport 先 `1280×900` 后 `720×900`。`document.visibilityState=visible`；先读取 `evidence/01/02/03/08` 基线；源码未在 session 内修改，避免 HMR 污染。

| TODO 场景                    | 同一 session 的操作与断言                                                                                                                                                                       | 截图与 SHA-256                                                                                                                                                                                                                                                                                                                                                                                                                                    | 结果 |
| :--------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--: |
| 首屏/marker                  | `699 可见 TODO`；`docScroll=1280×900`；树 `listStyle=none/paddingLeft=0`；两面板内部 `overflowY=auto`                                                                                           | `browser-2026-09-01/dev-final-initial-1280x900-20260901.png` · `629659AA036B9A60FB4C1A0441DFA59E7E671120C64B63625332D4680BB61626`                                                                                                                                                                                                                                                                                                                 | 通过 |
| 下拉打开/常驻滚动            | 21 个 option、可见性 SVG；内部 viewport `maxHeight=320px`、`overflowY=scroll`、`scrollHeight=688`、`clientHeight=320`；`scrollTop=368` 到末端                                                   | `browser-2026-09-01/dev-final-dropdown-1280x900-20260901.png` · `FE4296174C34BADFC3AF25AC71ED71B4079D7525C80B4DEA8EF6879926B8BE39`；末端 `browser-2026-09-01/dev-final-dropdown-bottom-1280x900-20260901.png` · `9071B5420358714EBACEFBF90B4C57B263487857A8BD01F025C3EB824B603501`                                                                                                                                                                | 通过 |
| 仓库/分支/类型组合           | `10wms` + `dev` + `source-comment` + `validation`；状态栏 `2 可见 TODO`、页面无级滚动；清空类型后 `never-match-20260901` 为 0 并显示空状态                                                      | 组合筛选：`browser-2026-09-01/dev-final-selected-1280x900-20260901.png` · `7B4261D574762A61AF926E2FDFA337827E664132F41B20F4940A3872A8A43775`；无匹配断言已在该 session 执行，但最终截图未落盘（现存 `dev-cdp-no-match-1280x900-20260901.png` 属于早期 partial session，禁止替代）                                                                                                                                                                 | 部分 |
| 树展开/选中/详情             | 搜索 `axios`，展开仓库→分支→目录→文件→TODO；`aria-selected=true`；详情 GitHub 链接含 `#L1`                                                                                                      | `browser-2026-09-01/dev-final-tree-details-1280x900-20260901.png` · `ACF9BF5965810377B7F928D0C85A2DF90230129117BA0D890893C88B1026ED3B`                                                                                                                                                                                                                                                                                                            | 通过 |
| 平铺/共享选中                | 切换平铺，6 条过滤结果，详情继续保留；`docScroll=1280×900`、面板 `scrollH=641/clientH=337`                                                                                                      | `browser-2026-09-01/dev-final-flat-1280x900-20260901.png` · `87FC7FF7D0838B6813513E385498C4F7CE1D92B02EF859C12F5EA7EFB6438CAD`                                                                                                                                                                                                                                                                                                                    | 通过 |
| Tab/Space/Arrow/Enter/Escape | 从搜索框连续 Tab 到仓库→分支→类型；Space 打开，ArrowDown 后 Enter 选择 `11comm`；Escape 关闭后 `aria-expanded=false`、Portal=0、焦点回仓库触发器                                                | `browser-2026-09-01/dev-final-keyboard-1280x900-20260901.png` · `9E4D37A92D2CDCFEC1EEB37287905CB97CBF5EF9713BBA0ADC2CCE34075DE038`                                                                                                                                                                                                                                                                                                                | 通过 |
| 外点关闭                     | 真实坐标点击标题区域；Portal 卸载、值保持、焦点回仓库触发器                                                                                                                                     | `browser-2026-09-01/dev-final-outside-1280x900-20260901.png` · `7B4261D574762A61AF926E2FDFA337827E664132F41B20F4940A3872A8A43775`                                                                                                                                                                                                                                                                                                                 | 通过 |
| 刷新 pending/失败/恢复       | fetch pending 注入后 `disabled=true/aria-busy=true`；HTTP 500 失败 alert 可感知且按钮恢复；解除注入后 artifact `GET /artifacts/github-todos/ruan-cat.json` HTTP 200、alert 清除、焦点回刷新按钮 | pending `browser-2026-09-01/dev-final-refresh-pending-1280x900-20260901.png` · `8B668E3C5FFDE699DAE51023F2B855D3DF72F36A1D0A02E9182202A9682571FB`；失败 `browser-2026-09-01/dev-final-refresh-failure-1280x900-20260901.png` · `3316845E83FCF35F4F5607A73DF280875073C059D484FAAE3BA013D668D5D25F`；恢复 `browser-2026-09-01/dev-final-refresh-success-1280x900-20260901.png` · `DF73F7D2F6EB18AD8698E41BD773B357CA9E755086D8EBBD8AE5058E6FDF40E4` | 通过 |
| 首次失败/重试                | route abort artifact 后导航同 URL；出现 `TODO 数据加载失败：Failed to fetch TODO artifact`，无假统计；解除 route 后点击刷新恢复 `699`，记录导航一次 EOF 后同 session wait/snapshot 可恢复       | 失败 `browser-2026-09-01/dev-final-initial-failure-1280x900-20260901.png` · `F0F7D5040FB8E3650E78F9B6BB72145427EB80B48108A77D316A7C320FA030E5`；恢复 `browser-2026-09-01/dev-final-recovered-1280x900-20260901.png` · `8F8E3FB1DE825293971CFCF0E3A7946922FFA9F60F919A7E80DA815529E9818A`                                                                                                                                                          | 通过 |
| 主题/滚动                    | 暗色 `dark=true/colorScheme=dark/bodyBg=rgb(27,27,31)`；桌面 `docScroll=1280×900`；切到 720×900 后 group `display=block`、nav `overflow=visible`、页面 `714×1525` 自然滚动                      | 暗色 `browser-2026-09-01/dev-final-dark-1280x900-20260901.png` · `00861AE5C626D6AB9EA1EA84D231E98C26AA5F86E848E69C156F5D00D73506F2`；移动 `browser-2026-09-01/dev-final-mobile-720x900-20260901.png` · `EA0BD9851441645F70CEBFD3DE196DB4BB86C457BC910439FC9081AF265DB521`                                                                                                                                                                         | 通过 |

本节是当前最完整的 dev TODO 证据，但仍缺真实重复点击下的请求计数/乱序响应证明、CSS/JS 全资源 HTTP 表和独立 verifier 复核；因此 `tasks.md` 4.5/4.1/4.2 仍未勾选。

## 27. 2026-09-01 preview 当前源码版本单 session 矩阵（近完整，未勾选 4.6）

> 先完成串行 `pnpm docs:build`（当前源码版本），再启动 `pnpm docs:preview -- --host 127.0.0.1 --port 4173`。使用隔离 headed Chrome PID `26732`（产品版本 `151.0.7922.174`，CDP `9241`，`--no-sandbox --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --disable-background-timer-throttling`），agent-browser `0.35.0`，唯一 session `todo-preview-final-20260901-j`。连接后通过同一 session `tab t3` 将被测 tab 带到前台，`document.visibilityState=visible`；viewport `1280×900`，末尾切换 `720×900`。先读取 `evidence/01-tree-initial.png`、`03-select-dropdown.png`、`08-dark-theme.png`，不访问普通文档页。HAR 在系统临时目录记录 45 个请求，审查后已删除。

| TODO 场景         | 同一 session 的操作与断言                                                                                                                                                           | 截图与 SHA-256                                                                                                                                                                                                                                                                                                                                                                                                                          | 结果 |
| :---------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--: |
| 首屏/marker       | 等待 `699 可见 TODO`；`docScroll=1280×900`；树 `listStyle=none/paddingLeft=0`；visibility visible                                                                                   | `browser-2026-09-01/preview-final-initial-1280x900-20260901.png` · `9E87A701299D4B4AF4841BC4112451C1A91B358F1814E9BFCFD197A79EB764A5`                                                                                                                                                                                                                                                                                                   | 参考 |
| artifact/资源状态 | HAR 中 `todos.html`、`style.css`、`vp-icons.css`、app/framework/theme/metadata/todos chunk、font、favicon、artifact 均 HTTP 200；受控 abort 请求状态 0，解除后恢复 200              | 资源清单来自 `todo-preview-final-20260901.har`（已清理）；artifact 请求截图见恢复行                                                                                                                                                                                                                                                                                                                                                     | 通过 |
| 下拉/清空/滚动    | 21 个 option；内部 viewport `maxHeight=320px`、`overflowY=scroll`、`scrollHeight=688`、`clientHeight=320`；设置 `scrollTop=368`；选中 `10wms` 后清空恢复所有仓库/699                | `browser-2026-09-01/preview-final-dropdown-1280x900-20260901.png` · `49D71B4BC5FCE6A56E60FCF41D852C6E24077AE88DDA7431CD81B1FB21F22AB9`；末端 `browser-2026-09-01/preview-final-dropdown-bottom-1280x900-20260901.png` · `42E66EF26F0F06899D5D97A439E25E3FA7DD73B7E300238B0E8DEFCDAFA10F32`；选中 `browser-2026-09-01/preview-final-selected-1280x900-20260901.png` · `BEC37345D6A360D564394E3A05CDCA140C6A1C2458F998B342818D251B558DF1` | 通过 |
| 四维组合/无匹配   | `10wms` + `dev` + `source-comment` + `validation` → `2 可见 TODO`；清空类型后输入 `never-match-preview-20260901` → 空状态与 0 可见 TODO，页面无级滚动                               | `browser-2026-09-01/preview-final-combo-1280x900-20260901.png` · `FFDB89650EDDE26C396ED4F053078EBBE62DF2106311463914AE15C2D1E39128`；无匹配 `browser-2026-09-01/preview-final-no-match-1280x900-20260901.png` · `8C136B0435CAD43B225821364DA73C379442282F3BBAB4C4023DE5B856DE0D46`                                                                                                                                                      | 通过 |
| 树/详情/平铺      | 搜索 `axios`，展开并选中 TODO；详情 GitHub 行号链接可达；切换平铺后 6 条过滤 option，选中态和详情保持                                                                               | `browser-2026-09-01/preview-final-tree-details-1280x900-20260901.png` · `12DF7C126C1C95B43ECBFB6C4BDB544BCE645F78440663A08352E1644EFB4ACF`；平铺 `browser-2026-09-01/preview-final-flat-1280x900-20260901.png` · `2E3AF7DA00784D56F9005EC3B05A3CDE0161E7AB2034F39C77D86C86E041B189`                                                                                                                                                     | 通过 |
| 键盘/焦点         | `focus → Space/Enter → ArrowDown/ArrowUp → Enter/Escape`；Escape 后 `aria-expanded=false`、Portal=0、焦点回仓库触发器；Tab 从搜索框到仓库→分支→类型                                 | 当前 session 未对每个键盘分支单独截图；Escape DOM 断言可回放，dev 键盘截图见 §26                                                                                                                                                                                                                                                                                                                                                        | 参考 |
| 刷新 pending/竞态 | 可控 pending fetch 下连续点击两次，`calls=1`、`disabled=true`、`aria-busy=true`；恢复真实 fetch 后 `calls=1`、按钮可用、焦点回刷新按钮                                              | `browser-2026-09-01/preview-final-refresh-pending-1280x900-20260901.png` · `5DA302F16FD3E8D3348C36A155AC6134B03F69EC316B878BBEF7DD34F781B55E`                                                                                                                                                                                                                                                                                           | 通过 |
| 首次失败/恢复     | abort artifact 后导航同 URL，显示 `TODO 数据加载失败：Failed to fetch TODO artifact` 且无假统计；解除 abort 后刷新恢复 699 与按钮焦点                                               | `browser-2026-09-01/preview-final-initial-failure-1280x900-20260901.png` · `F0F7D5040FB8E3650E78F9B6BB72145427EB80B48108A77D316A7C320FA030E5`；恢复 `browser-2026-09-01/preview-final-recovered-1280x900-20260901.png` · `8F8E3FB1DE825293971CFCF0E3A7946922FFA9F60F919A7E80DA815529E9818A`                                                                                                                                             | 通过 |
| 主题/滚动/响应式  | 暗色 `dark=true/colorScheme=dark/bodyBg=rgb(27,27,31)`；桌面 `docScroll=1280×900`、树/详情内部滚动；720×900 `group display=block`、nav `overflow=visible`、页面 `714×1525` 自然滚动 | 暗色 `browser-2026-09-01/preview-final-dark-1280x900-20260901.png` · `50CCD239A29A73BBA99CB6B94729EC624F4F73E8FC32CA5D2AC099FD4A883A20`；移动 `browser-2026-09-01/preview-final-mobile-720x900-20260901.png` · `B4F4873709F4578BAC13CA15540308BD08BA2D810EFA4E295C56FA422DBD3318`                                                                                                                                                       | 通过 |

本节已覆盖当前源码版本 preview 的大部分 TODO 用户路径，但键盘分支缺独立截图、初始 hydration warning 未在本 session 开始时单独清点，且未有独立 verifier 签字；因此 `tasks.md` 4.6/4.1/4.2 继续保持未勾选。

## 28. 2026-09-01 dev 补证 session（部分，不升级 4.5）

> 健康探针：`agent-browser skills get core` 与 `agent-browser doctor --offline --quick`（7 pass/0 warn/0 fail）；dev 服务为 `pnpm docs:dev -- --host 127.0.0.1 --port 8080`。唯一 session `todo-dev-final-20260901-k-e3381299a1aa`，agent-browser `0.35.0`，Chrome `152.0.7977.54`，目标 `http://127.0.0.1:8080/todos.html`，viewport `1280×900`。首次 `open` 返回 EOF，但同一 session 的 `tab t1` 恢复成功；首次 visibility 为 hidden，切到前台后稳定为 `visible`。先读取 `evidence/01-tree-initial.png`（1600×1000，`80A59F796DAD0822BD976515EFDC53AB1E1469C72AEB6965A0B10E8B61D11B11`）、`02-tree-expanded.png`（1600×1000，`004AE69B8D64A88A282FEC140BE8BDE0916617E11A592EFA44F1496448D00962`）、`03-select-dropdown.png`（1600×1000，`8A372E754B895D0594CE6A2B193B621515D55FB01D519F353EB84A030621A20B`）和 `08-dark-theme.png`（1600×1000，`B7EEC36E676F779C7788253D35979902788F3467E330C8B322088E31FD592295`）。

| 补证场景                      | 同一 session 的真实操作与断言                                                                                                                                                                                                                       | 截图与 SHA-256                                                                                                                                                                                                                                                                                                                                                                                                                                                          |  结果  |
| :---------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----: |
| 首屏/亮色                     | 1280×900；`699 可见 TODO`；`document.visibilityState=visible`；body 背景 `rgb(255,255,255)`；console 仅 Vite debug，无 error                                                                                                                        | `browser-2026-09-01/dev-final2-initial-1280x900-20260901.png` · `8BEFED6C5659F75D7280E104DD45ABFA2DC4E1B25B1A4A8348806EDFB5F06244`；亮色 `dev-final2-light-1280x900-20260901.png` · `30A2695BB263541A4EFCA4C1298A3C83F03E86F2F8AFE4EA8F8CBE6709D1F32A`                                                                                                                                                                                                                  |  通过  |
| 暗色同 session                | 真实点击主题开关；`document.documentElement.classList=dark`、body 背景 `rgb(27,27,31)`、visibility visible                                                                                                                                          | `browser-2026-09-01/dev-final2-dark-1280x900-20260901.png` · `402EF531D51CEF781C42D96F6BEBC7BC7D28AB812D66B14999D87A4500917B88`                                                                                                                                                                                                                                                                                                                                         |  通过  |
| 无匹配                        | 输入 `never-match-20260901`；状态栏 `0 可见 TODO`，显示当前筛选条件下没有 TODO，`docScroll=1280×900`，无 alert                                                                                                                                      | `browser-2026-09-01/dev-final2-no-match-1280x900-20260901.png` · `61FDE88248714A53628C090F8AE55768402BB4671473EE314D39CAF744924DB6`                                                                                                                                                                                                                                                                                                                                     |  通过  |
| 详情 sticky 深滚动            | 搜索 `axios` 并选中 TODO；详情 `aside` 真实滚动到 `scrollTop=304`，`scrollHeight=641/clientHeight=337`；sticky “在 GitHub 查看”按钮仍在视口 `top=773/bottom=811`                                                                                    | `browser-2026-09-01/dev-final2-sticky-1280x900-20260901.png` · `00725BC50FAFA47E68AF875208C37666630D8D0FEED5D1A2CF5232611E7F8D30`                                                                                                                                                                                                                                                                                                                                       |  通过  |
| 外点关闭/焦点                 | 打开仓库 Portal 后用真实鼠标坐标点击标题区域；`Portal options=0`、`aria-expanded=false`、焦点回到 `仓库` 触发器                                                                                                                                     | `browser-2026-09-01/dev-final2-outside-1280x900-20260901.png` · `30DB6FAD0B1C88E8618AAC3B3D945D7D50E124FF87BD193700B56FFEFFD89E3F`                                                                                                                                                                                                                                                                                                                                      |  通过  |
| 键盘 Space/Arrow/Enter/Escape | 搜索框真实 `Tab` 到仓库；`Space` 打开（21 options），`ArrowDown` 高亮第二项，`Enter` 选择 `08mes` 并卸载 Portal；重新打开后 `Escape` 卸载 Portal、焦点回仓库；每个分支独立截图                                                                      | Space `browser-2026-09-01/dev-final2-keyboard-space-1280x900-20260901.png` · `BDD65DC2110A8F364E4321FF1DD667986788BDD1B3522A081EDBD19314E6A97B`；Arrow `dev-final2-keyboard-arrow-1280x900-20260901.png` · `747C0BE27DAC1D853E4DE5BE84ED8420952CB70A5799BBCF571E3292BEBC2A01`；Enter/Escape `dev-final2-keyboard-enter-1280x900-20260901.png` / `dev-final2-keyboard-escape-1280x900-20260901.png` · `BDC447AF79BCF465625FE0A7941370DD97126B619FDD71C487DE92581B4DF3CF` |  通过  |
| 无效预备截图（不计入）        | 第一次错误使用 `find ... focus` 后出现 `portal=3`、焦点为空；随后已在同一 session 重新执行正确的 `focus` 流程。本图仅保留失败痕迹，不作为任何 Scenario 证据                                                                                         | `browser-2026-09-01/dev-final2-keyboard-open-1280x900-20260901.png` · `16D0E94549EB3AC38C067163CBA3F2D652E1E3650C72F56C9C2991F1B2FDABFC`                                                                                                                                                                                                                                                                                                                                | 不计入 |
| 刷新重复点击/single-flight    | 通过真实刷新按钮连续点击两次；受控 fetch pending 时 `calls=1/pending=1/disabled=true/aria-busy=true`；释放原始 fetch 后 `calls=1/pending=0/disabled=false/aria-busy=false`，成功反馈出现；未伪造第二个并发请求                                      | pending `browser-2026-09-01/dev-final2-race-pending-1280x900-20260901.png` · `4D2CAFA3C58F6D28D524F79869B4B136BEBCB8CBBD19A8838A0C5A81A706B3B9`；success `dev-final2-race-success-1280x900-20260901.png` · `6E84C76B391DB6EB38461F5CAA197C0861B346369AD2551B477EBA4C5F660633`                                                                                                                                                                                           |  部分  |
| 资源/console 摘要             | `network requests` 去重后本地请求 912 条（733×200、178×304、唯一 404 为浏览器自动请求 `favicon.ico`）；artifact HTTP 200，`tw.css` HTTP 304，`favicon.svg` HTTP 200；console 无 error。`todos.html` Document 行未被网络日志捕获，故不宣称完整资源表 | 无独立截图（命令输出已保留在本轮日志）                                                                                                                                                                                                                                                                                                                                                                                                                                  |  部分  |
| 首次失败/恢复                 | 设置 artifact `--abort` 后 reload 触发同一 session Chrome `DevToolsActivePort` exit 3，session 失去 tab；未生成失败截图，也未静默换 session                                                                                                         | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 待验证 |

本节补足了 dev 的同 session 亮暗主题、最终无匹配截图、sticky 深滚动、键盘分支截图、single-flight 实际请求计数与证据落盘校验；但真实乱序响应、完整 Document/CSS/JS 资源表、首载失败/恢复、独立 verifier 仍缺，且首载故障暴露了当前 Chrome 控制面不稳定。完成后已执行 `agent-browser close`、停止 dev 服务和 cleanup dry-run：`ListenerStatus=known`、`CandidateCount=0`、8080 无监听。故 `tasks.md` 4.5/4.1/4.2 继续未勾选。
