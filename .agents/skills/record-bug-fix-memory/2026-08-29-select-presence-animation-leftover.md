# 2026-08-29 Select 弹层关闭后残留遮挡页面

## 1. 问题现象

- 用户反馈：生产环境仓库下拉框选中选项后弹层不再自动关闭，"鼠标失焦后不自动关闭"，核心交互丢失。
- 离谱之处：自动化测试读 `dataset.state` 显示 `closed`（内部状态正常），但用户看到弹层一直挂在页面上。修复过程中还观察到"打开都随机失败"的假象。

## 2. 实际根因

`98b35ee` 提交把 `.ui-select__content` 的打开动画（`animation: ui-select-content-in 140ms`）从 scoped 块移到非 scoped 块。原 scoped 写法里 `@keyframes` 被哈希改名，`animation` 声明实际从未生效（`animationName: none`）；移出去后动画第一次真正跑起来了，却触发 Reka UI Presence 的卸载判定：关闭时 Presence 读取元素计算样式的 `animationName`，非 none 就进入 `unmountSuspended` 状态等待 `animationend`——而这个动画只在元素插入时播放一次，关闭时永远不会再来 → **弹层永久残留**，带着 `disableOutsidePointerEvents` 遮挡页面全部交互。

关键误导点：弹层残留时 Reka 还会给 content 挂 `data-dismissable-layer` 并拦截外部 pointer 事件，所以"再点 trigger 打不开"也是残留层的副作用，不是打开逻辑坏了。

## 3. 关键误导点

- 用 `dataset.state`（内部 open 状态）做断言：状态是 closed 但 DOM 残留，测试全绿而用户看到的是坏的。**视觉组件必须用 DOM 卸载/可见性/截图做证据。**
- 自动化与用户共用同一个真实浏览器窗口，互相干扰导致"时好时坏"的假竞态；CDP 注入点击在窗口失焦时还会随机失灵，浪费了大量排查。
- 排查一度跑偏去读 Reka trigger/item 事件源码，而回归窗口其实只有 `98b35ee` 一个 commit——应先对自己的 diff 逐行审。

## 4. 有效修复

直接删除 `.ui-select__content` 上的全部 animation 声明（含曾挂在 `[data-state="open"]` 上的变体），并在原地留注释：**禁止给 Reka Portal 弹层加任何 CSS animation/transition**。没有 animationName，Presence 关闭时走确定性 `UNMOUNT` 分支。140ms 淡入是纯装饰，删除无感知。

## 5. 验证方式

- 生产环境（GitHub Pages + computer-use 真实点击）：打开下拉 → AXPress 点击 10wms → 弹层立即关闭、触发器显示"10wms ✕"带锁图标、筛选生效 147 条，截图为证。
- Escape 键关闭路径同样验证通过（弹层卸载、被遮挡元素恢复可见）。
- 用户本人在真实浏览器确认修复。
- 单测 17/17 通过，`pnpm docs:build` 构建通过。

## 6. 后续约束

- 给 Reka/Radix 系 Portal 弹层写样式前，先确认它有没有 Presence 类卸载机制；有则禁止声明 animation/transition，除非同时提供成对的 enter/leave 动画。
- 弹层类组件的回归断言用"DOM 是否卸载 + computed display/visibility + 截图"，不用组件内部状态。
- 修复视觉回归时先审自己最近一个 commit 的 diff，再考虑框架源码。
- 自动化点击验证与用户手动操作不要共用同一个浏览器窗口。
