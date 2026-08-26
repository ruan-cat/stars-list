# 2026-08-26 GitHub TODO Explorer UI 连续回归

## 1. 问题现象

- TODO 页面最初使用了原生控件和字符箭头，未真正落实已确认的 shadcn-vue/Reka UI 方案。
- Tree 的竖线曾参与盒模型，层级展开后把内容逐层推移；随后样式迁移到 scoped 时又丢失了递归缩进。
- 行级 hover 一度完全没有高亮；Select 先无法打开，后出现空白 Grid 列、弹框定位异常、没有箭头/动效，清空按钮也放错了相对位置。
- 页面默认 artifact 曾因 raw URL 404 显示空态；仓库初始没有 tsconfig，类型检查只能输出帮助。

## 2. 实际根因

- 需求工件已写明 shadcn-vue/Reka UI、Tree view、筛选与可访问性交互，但实现把“安装依赖”误当成“组件接入”，并优先堆 CSS 视觉。
- 全局 CSS、scoped CSS、递归组件边界没有在设计阶段固定：递归 `TodoTree` 的 `> ul` 规则在每个实例重复生效，导致缩进归零。
- 竖线使用 border/margin/padding 而不是绝对定位视觉层，直接改变布局尺寸。
- Reka Select 的契约未完整实现：空字符串被当作 Item value、未使用 SelectPortal、未配置 Popper/SelectIcon；后续清空按钮又与 flex 中的 Chevron 发生竞争。
- 未在首次实现后用 Codex Chrome 做 fresh 页面验收，导致“看起来能用”的错误持续到用户截图才暴露。

## 3. 关键误导点

- 以单元测试、TypeScript 或构建通过推断视觉交互正确；这些证据不能证明 hover、定位、动画和拖拽布局。
- 把原型中的交互意图当成“有按钮就够了”，没有逐项核对打开、选择、清空、键盘、Portal、动效和错误态。
- 样式组件化重构被误认为纯整理，实际上改变了递归 CSS 作用域和布局基线。
- 使用旧 dev/preview 页面或未确认环境变量时，把缓存/旧模块状态误判为当前源码行为。

## 4. 有效修复

- 以本地 primitives 为边界：Reka UI Splitter/Select/Primitive，加本地 Iconify/Lucide 图标组件；不在业务组件里重复实现库行为。
- Tree 竖线改为 `.todo-tree__children::before` 绝对定位；递归缩进由明确的 `.todo-tree__children` padding 提供，互不耦合。
- Tree 行补齐 hover/selected/focus、固定数字轨道、展开 Transition 和 reduced-motion。
- Select 使用 `SelectPortal`、`position="popper"`、`SelectIcon`、固定箭头槽、open 动画和 `__all__` 哨兵值；已选值显示独立清空按钮，顺序为“文字 → × → Chevron”。
- 样式迁移到各 Vue `<style scoped>`，全局 `style.css` 仅保留主题级规则；递归组件的宽度/缩进规则在组件内显式维护。
- 补齐 `tsconfig.json`、本地 artifact fallback 与 fixture artifact，使本地 dev 不依赖远端 404。

## 5. 验证方式

- 首个可信线索来自 Codex Chrome 的真实 DOM/计算样式：hover 背景为透明、递归行 x 坐标相同、Select Grid 子项 7 个而非 4 个、清空后 placeholder 恢复。
- `pnpm exec tsc --noEmit` 通过；新增契约/tree 测试 13/13 通过；`pnpm todo:test` 29/29 通过。
- `pnpm docs:build` 多次 fresh 构建通过（最近一次约 54–60 秒，保留既有 iconfont/chunk 警告）。
- Codex Chrome 验证 Resizable handle 的 separator/aria 值、拖拽宽度和最小宽度；Iconify 节点图标；Select 打开/选择/清空；TODO 页插件排除而首页保留。
- 每次视觉修复后应重新启动或确认 dev 进程、硬刷新页面并重新读取 DOM/截图，不能复用历史页面状态。

## 6. 后续约束

- 实现前把 spec/plan 的每个交互写成浏览器验收矩阵：hover、focus、展开/收起、选择、清空、Portal 定位、动画、键盘和移动端。
- 组件库接入必须验证完整组合契约，不以依赖安装或静态 class 代替：Select 至少检查 Trigger/Icon/Portal/Popper/Item/reset；Resizable 至少检查 Group/Panel/Handle/aria/min。
- 递归组件的样式必须明确区分“布局缩进”和“装饰轨道”：装饰线绝不使用会改变盒模型的 border/padding/margin。
- 全局 CSS 只放主题 token；业务规则放组件 scoped，且迁移后立即用 fresh Chrome 对比布局坐标。
- 任何“完成/修复”声明都要绑定 fresh dev 或 fresh build 证据；单元测试通过不代表视觉交互通过。
