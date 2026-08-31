## Design

> 本 change 的技术决策记录。重构期间如改变技术路线，必须先同步本文件再动代码。

### Context

现状组件（`docs/.vitepress/theme/components/ui/**`）是手写的 reka-ui 包装层 + scoped CSS（Teek/VitePress 变量）。该路径缺少 shadcn-vue 官方组件的实战检验样式，已连续引发两起生产事故（详见 `.agents/skills/fix-bug/record-bug-fix-memory/2026-08-28-*.md` 与 `2026-08-29-*.md`）。验收基线见 `evidence/01~08-*.png`。

### Goals / Non-Goals

**Goals:**

- 引入 Tailwind CSS v4 与 shadcn-vue CLI 标准体系，替换手写 UI 组件。
- Tailwind 设计令牌桥接 Teek/VitePress 语义变量，亮暗主题与站点一致。
- 重构后逐条满足 `specs/todo-dashboard-explorer/spec.md`，视觉与交互对齐 `evidence/` 基线。

**Non-Goals:**

- 不迁移非 TodoDashboard 的普通文档页（Tailwind 的作用域需隔离，见决策 D2）。
- 不更换数据层（`@tanstack/vue-query`、artifact 加载链路保持不变）。
- 不重构 TodoTree/TodoFlatList 的业务逻辑（仅视觉层改写）。

### Decisions

**D1. Tailwind CSS v4 + `@tailwindcss/vite` 接入 VitePress 构建。**
Tailwind v4 以 Vite 插件方式接入（`docs/.vitepress/config.ts` 的 `vite.plugins`），不需要 `tailwind.config.js`（v4 使用 CSS-first 配置）。设计令牌在 `docs/.vitepress/theme/tw.css`（新文件，由 TodoDashboard 入口引入）中以 `@theme inline` 声明；为避免隐式 reset，样式文件拆分导入 `tailwindcss/theme.css` 与 `tailwindcss/utilities.css`，不使用聚合导入。

**D2. Tailwind 作用域隔离，避免污染普通文档页。**
Preflight（CSS reset）会破坏 VitePress 既有文档样式。策略：`tw.css` 只导入 `tailwindcss/theme.css` 与 `tailwindcss/utilities.css`，明确不导入 `tailwindcss/preflight`；Tailwind 类只出现在 TodoDashboard 组件树内，普通文档页不得新增 Tailwind reset。实施时使用固定 viewport、固定 artifact 和 before/after 像素 diff，动态时间区域必须单独标注，不得用“看起来没变”替代结果。

**D3. shadcn-vue CLI 初始化 + CSS 变量桥接 Teek。**
以 `pnpm dlx shadcn-vue@latest init` 生成 `components.json` 与 CSS 变量骨架，随后将 shadcn 令牌映射到 Teek/VitePress 变量（`@theme inline` 方式，保证跟随主题切换）：

```css
@theme inline {
	--color-background: var(--vp-c-bg);
	--color-foreground: var(--vp-c-text-1);
	--color-card: var(--vp-c-bg-soft);
	--color-popover: var(--vp-c-bg);
	--color-primary: var(--vp-c-brand-1);
	--color-primary-foreground: var(--vp-c-white);
	--color-secondary: var(--vp-c-default-soft);
	--color-muted: var(--vp-c-bg-soft);
	--color-muted-foreground: var(--vp-c-text-2);
	--color-accent: var(--vp-c-brand-soft);
	--color-accent-foreground: var(--vp-c-brand-1);
	--color-destructive: var(--vp-c-danger-1);
	--color-border: var(--vp-c-divider);
	--color-input: var(--vp-c-divider);
	--color-ring: var(--vp-c-brand-1);
}
```

以上映射允许在存在 Teek 令牌时使用 `var(--tk-*, var(--vp-*));` 回退形式；不得在组件中写入硬编码颜色。暗色主题由站点根变量切换驱动。

**D4. 组件替换清单与映射。**

| 现有手写组件         | 替换为                                                        | 说明                                                                                                  |
| -------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `ui/Select.vue`      | shadcn-vue `Select`（CLI 生成）                               | 增加可见性图标 slot 与常驻滚动条定制；**禁止 enter-only 动画**（成对 open/close 动画或无动画，见 D6） |
| `ui/Button.vue`      | shadcn-vue `Button`（CLI 生成）                               | 变体映射 default/ghost                                                                                |
| `ui/Input.vue`       | shadcn-vue `Input`（CLI 生成）                                | —                                                                                                     |
| `ui/Resizable*.vue`  | shadcn-vue `Resizable`（CLI 生成，底层同为 reka-ui Splitter） | 保持 `auto-save-id` 行为                                                                              |
| `Todo*.vue` 业务组件 | 保留逻辑，视觉层改 Tailwind 工具类                            | `TodoNodeIcon`、`@iconify-icons/*` 依赖不变                                                           |

**D5. 样式写法约束。**
重构后的组件使用 Tailwind 工具类 + shadcn 语义令牌（`bg-background`、`text-foreground`、`border-border` 等），禁止再出现组件级 `<style scoped>` 大块（交互态复杂时允许少量 `:deep()` 微调）。**颜色一律经语义令牌**，不允许硬编码色值——保证亮暗主题自动跟随。

**D6. 动画策略（2026-08-29 事故的直接教训）。**
弹层动画必须成对：`data-[state=open]` 与 `data-[state=closed]` 各自声明（shadcn-vue 默认模式），或完全不用动画。**禁止 enter-only 动画**——Reka Presence 关闭时按 `animationName` 决定是否等待 `animationend`，enter-only 会导致弹层永久残留。回归必测：选中关闭/外点关闭/Esc 关闭后 DOM 中无 `.ui-select__content` 残留。

**D7. Reka UI 依赖保留。**
shadcn-vue 本身基于 reka-ui，`package.json` 中 `reka-ui` 依赖保留；移除的是我们手写的包装组件，不是 reka-ui 本身。

**D8. 可访问性与边界场景是验收项。**
Select 必须验证 Enter/Space 打开、ArrowUp/ArrowDown 移动、Enter 提交、Escape/外部关闭及焦点回收；刷新 pending、首次加载失败、无匹配结果和组合筛选必须验证 `disabled`/`aria-busy`/错误可感知性。

**D9. 上游技能文件格式化按用户授权执行。**
允许 Prettier 修改 `.agents/skills/shadcn-vue/**` 与 `skills-lock.json`，不新增 ignore 配置；本 change 不再把重新运行 skills 安装器或比较本地内容与远端 hash 作为验收前置条件，接受由格式化产生的锁定关系风险并在回归记录中注明。

### Risks / Trade-offs

- **[Tailwind 影响既有文档页]** → D2 的作用域隔离 + "首页/topics 渲染像素不变"回归门禁。
- **[shadcn-vue CLI 在 VitePress 站点的 srcDir 适配]** → CLI 交互答案需手工指定 components 路径到 `docs/.vitepress/theme/components`；若 CLI 对非标准工程适配失败，允许手工按官方模板落盘组件（内容与 CLI 产物一致），并在 `agent-findings.md` 记录。
- **[验收细节遗漏]** → 以 spec 需求清单为唯一验收源；每完成一个组件即对照 `evidence/` 截图做像素级比对。
- **[统计口径误导]** → 状态栏固定展示总数、已扫描数、跳过/分支不可用数；`complete` 不得替代扫描覆盖率。
- **[部署回滚]** → 生产浏览器验证出现任一关键场景失败、页面级滚动、Portal 残留、主题回归或普通文档像素变化时，停止验收并按部署提交执行回滚。

### Migration Plan

1. 基线固化（已完成，见 evidence/）。
2. 基础设施：Tailwind v4 + 令牌桥接 + CLI 初始化（不动任何现有组件）。
3. 逐组件替换：Select → Button/Input → Resizable → Todo\* 视觉层；每替换一个跑一次 spec 冒烟。
4. 全量回归：spec 全部 Scenario + `pnpm docs:build` + 生产部署后复验。
5. 清理：删除旧手写样式残留，更新 AI 记忆文档。

### Open Questions

- shadcn-vue CLI 对 `docs/.vitepress` 这种非标准 srcDir 的兼容性待验证（见 Risks）。
- Tailwind utilities 与 VitePress 默认样式的选择器冲突面，需在 D2 实施时用固定 viewport 像素 diff 确认。
- Prettier 修改上游技能文件后不重跑 skills 安装器/hash 关系校验，属于已确认的流程风险。
