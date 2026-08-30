---
name: shadcn-vue
description: >-
  本项目 TodoDashboard UI 组件的 shadcn-vue + tailwindcss 标准方案指导。当创建、修改
  docs/.vitepress/theme/components/ui/ 下的组件，或为 TodoDashboard 编写样式、调整弹层
  动画、桥接 Teek 主题变量时必须先读本技能。
user-invocable: true
metadata:
  version: "1.0.0"
  source: "context7 /unovue/shadcn-vue + openspec/changes/2026-8-30-use-shadcn-vue"
---

# shadcn-vue 项目最佳实践

## 1. 基本关系（先搞清再动手）

- shadcn-vue **不是独立组件库**，而是复制进仓库的组件集，底层原语是 **reka-ui**（SelectRoot/SelectTrigger/SelectContent 等）。
- `package.json` 中 `reka-ui` 依赖必须保留；手写 reka-ui 包装组件（旧 `ui/*.vue` 的 scoped CSS 模式）已废弃。
- 组件通过 CLI 生成后**归仓库所有**，可以直接改，但改动要符合本技能约束。

## 2. 安装与初始化（本项目落点）

1. 依赖：`tailwindcss` + `@tailwindcss/vite`（v4，CSS-first，无 tailwind.config.js）。
2. VitePress 接入：`docs/.vitepress/config.ts` 的 `vite.plugins` 增加 `tailwindcss()`。
3. `components.json` 的 `tailwind.css` 指向 `docs/.vitepress/theme/tw.css`，组件目录指向 `docs/.vitepress/theme/components`。
4. 添加组件：`pnpm dlx shadcn-vue@latest add select button input resizable`；CLI 对 `docs/.vitepress` 非标准 srcDir 适配失败时，按官方源码模板手工落盘（内容一致），并在 change 的 `agent-findings.md` 记录。

## 3. Tailwind v4 令牌桥接 Teek（关键）

shadcn 令牌通过 `@theme inline` 映射到 Teek/VitePress 语义变量，**禁止硬编码色值**，亮暗主题自动跟随 `:root` / `.dark`：

```css
@theme inline {
	--color-background: var(--vp-c-bg);
	--color-foreground: var(--vp-c-text-1);
	--color-muted: var(--vp-c-bg-soft);
	--color-border: var(--vp-c-divider);
	--color-primary: var(--vp-c-brand-1);
}
```

工具类一律用语义令牌：`bg-background`、`text-foreground`、`border-border`、`bg-primary`，不写 `bg-white`、`text-[#333]` 这类裸色值。

## 4. 作用域隔离（VitePress 站点红线）

- Preflight/reset 会破坏 VitePress 既有文档样式：只对 TodoDashboard 组件树启用工具类，全局文档页回归门禁为"首页/topics/prompts 渲染像素不变"。
- 组件禁止大块 `<style scoped>`；交互态复杂时允许少量 `:deep()` 微调。

## 5. 组件使用模式（官方约定）

```vue
<script setup lang="ts">
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
</script>
<template>
	<Select v-model="value">
		<SelectTrigger><SelectValue placeholder="…" /></SelectTrigger>
		<SelectContent>
			<SelectItem v-for="opt in options" :key="opt" :value="opt">{{ opt }}</SelectItem>
		</SelectContent>
	</Select>
</template>
```

- 受控绑定用 `:model-value` + `@update:model-value`。
- 自定义选项内容（图标等）直接写在 `SelectItem` 内部，不影响选择行为。

## 6. 弹层动画红线（2026-08-29 事故）

- Reka Presence 关闭时读取元素 `animationName`，非 none 即等待 `animationend`。
- **弹层动画必须成对**：`data-[state=open]` 与 `data-[state=closed]` 各自声明（Tailwind: `data-[state=open]:animate-in data-[state=closed]:animate-out`），或完全不用动画。
- **禁止 enter-only 动画**——会导致弹层关闭后永久残留并拦截全页交互。
- 回归必测三条关闭路径：选中关闭、点击外部关闭、Escape 关闭，断言"弹层从 DOM 卸载"（视觉证据），而非组件内部状态。

## 7. 验收基线

TodoDashboard 重构的唯一验收来源是 `openspec/changes/2026-8-30-use-shadcn-vue/specs/todo-dashboard-explorer/spec.md`；视觉基线截图在同 change 的 `evidence/`。重构后逐 Scenario 核对，禁止凭感觉宣布完成。
