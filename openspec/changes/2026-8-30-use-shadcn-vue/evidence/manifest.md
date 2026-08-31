# 浏览器验收证据清单

> 状态：待实施阶段填写。本清单不是通过证明；每一行必须由 fresh agent-browser headed Chrome 操作、截图和断言输出共同支撑。

## 1. 采集工具与会话

- 工具：`agent-browser`（先执行 `agent-browser skills get core`）
- 浏览器：Google Chrome headed，通过 CDP 连接；禁止使用 headless-only 截图作为视觉通过证据
- 独立会话（PowerShell）：`$env:AGENT_BROWSER_SESSION = (agent-browser session id --scope worktree --prefix shadcn-vue-acceptance)`
- 会话元数据：执行 `agent-browser session info --json`，记录 session、Chrome 版本、agent-browser 版本与 viewport
- 交互规则：Portal/下拉使用真实坐标点击；合成 `dispatchEvent` 仅用于 DOM 机制断言

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

像素 diff 只能在同一 viewport、同一滚动位置、同一主题和可比的加载状态下执行。若历史基线缺少这些元数据，截图只能标记为“参考”，同时必须明确写出缺失字段和后续补采动作，不能将不同比例或不同尺寸的图片宣称为通过。

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
