<!-- OPENSPEC:START -->

# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:

- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:

- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# CLAUDE.md

本文档为 Claude Code (claude.ai/code) 提供本仓库的开发指导。

## 项目概述

这是一个 VitePress 文档站点，用于自动生成和展示按编程语言和主题分类的 GitHub stars 列表。项目使用 GitHub Actions 实现自动化，并部署到 GitHub Pages。

## 代码/编码格式要求

### 1. markdown 文档的 table 编写格式

每当你在 markdown 文档内编写表格时，表格的格式一定是**居中对齐**的，必须满足**居中对齐**的格式要求。

### 2. markdown 文档的 vue 组件代码片段编写格式

错误写法：

1. 代码块语言用 vue，且不带有 `<template>` 标签来包裹。

```vue
<wd-popup v-model="showModal">
  <wd-cell-group>
    <!-- 内容 -->
  </wd-cell-group>
</wd-popup>
```

2. 代码块语言用 html。

```html
<wd-popup v-model="showModal">
	<wd-cell-group>
		<!-- 内容 -->
	</wd-cell-group>
</wd-popup>
```

正确写法：代码块语言用 vue ，且带有 `<template>` 标签来包裹。

```vue
<template>
	<wd-popup v-model="showModal">
		<wd-cell-group>
			<!-- 内容 -->
		</wd-cell-group>
	</wd-popup>
</template>
```

### 3. javascript / typescript 的代码注释写法

代码注释写法应该写成 jsdoc 格式。而不是单纯的双斜杠注释。比如：

不合适的双斜线注释写法如下：

```ts
// 模拟成功响应
export function successResponse<T>(data: T, message: string = "操作成功") {
	return {
		success: true,
		code: ResultEnum.Success,
		message,
		data,
		timestamp: Date.now(),
	};
}
```

合适的，满足期望的 jsdoc 注释写法如下：

```ts
/** 模拟成功响应 */
export function successResponse<T>(data: T, message: string = "操作成功") {
	return {
		success: true,
		code: ResultEnum.Success,
		message,
		data,
		timestamp: Date.now(),
	};
}
```

### 4. unocss 配置不应该创建过多的 shortcuts 样式类快捷方式

在你做样式迁移的时候，**不允许滥用** unocss 的 shortcuts 功能。不要把那么多样式类都设计成公共全局级别的快捷方式。

### 5. vue 组件编写规则

1. vue 组件命名风格，使用短横杠的命名风格，而不是大驼峰命名。
2. 先 `<script setup lang="ts">`、然后 `<template>`、最后是 `<style scoped>` 。
3. 每个 vue 组件的最前面，提供少量的 html 注释，说明本组件是做什么的。

### 6. jsdoc 注释的 `@example` 标签不要写冗长复杂的例子

1. 你应该积极主动的函数编写 jsdoc 注释的 `@example` 标签。
2. 但是 `@example` 标签不允许写复杂的例子，请写简单的单行例子。完整的函数使用例子，你应该择机在函数文件的附近编写 md 文档，在文档内给出使用例子。

### 7. 页面 vue 组件必须提供注释说明本组件的`业务名`和`访问地址`

比如以下的这几个例子：

```html
<!--
  房屋申请列表页
  功能：显示房屋申请列表，支持搜索和筛选

  访问地址: http://localhost:9000/#/pages-sub/property/apply-room
-->
```

```html
<!--
  房屋申请详情页
  功能：显示房屋申请详细信息，支持验房和审核操作

  访问地址: http://localhost:9000/#/pages-sub/property/apply-room-detail
  建议携带参数: ?ardId=xxx&communityId=xxx

  http://localhost:9000/#/pages-sub/property/apply-room-detail?ardId=ARD_002&communityId=COMM_001

-->
```

每个页面都必须提供最顶部的文件说明，说明其业务名称，提供访问地址。

### 4. markdown 的多级标题要主动提供序号

对于每一份 markdown 文件的三级标题，你都应该要：

1. 主动添加**数字**序号，便于我阅读文档。
2. 主动**维护正确的数字序号顺序**。如果你处理的 markdown 文档，其手动添加的序号顺序不对，请你及时的更新序号顺序。

## 报告编写规范

在大多数情况下，你的更改是**不需要**编写任何说明报告的。但是每当你需要编写报告时，请你首先遵循以下要求：

- 报告地址： 默认在 `docs\reports` 文件夹内编写报告。
- 报告文件格式： `*.md` 通常是 markdown 文件格式。
- 报告文件名称命名要求：
  1. 前缀以日期命名。包括年月日。日期格式 `YYYY-MM-DD` 。
  2. 用小写英文加短横杠的方式命名。
- 报告的一级标题： 必须是日期`YYYY-MM-DD`+报告名的格式。
  - 好的例子： `2025-12-09 修复 @ruan-cat/commitlint-config 包的 negation pattern 处理错误` 。前缀包含有 `YYYY-MM-DD` 日期。
  - 糟糕的例子： `构建与 fdir/Vite 事件复盘报告` 。前缀缺少 `YYYY-MM-DD` 日期。
- 报告日志信息的代码块语言： 一律用 `log` 作为日志信息的代码块语言。如下例子：

  ````markdown
  日志如下：

  ```log
  日志信息……
  ```
  ````

- 报告语言： 默认用简体中文。

## 常用开发命令

### 文档开发

```bash
# 启动本地开发服务器
pnpm docs:dev

# 构建生产版本文档
pnpm docs:build

# 本地预览生产版本
pnpm docs:preview

# 构建 GitHub Pages 版本（包含正确的 base 路径）
pnpm docs:build-in-github-page
# 或
pnpm build
```

### 代码质量

```bash
# 格式化所有代码文件
pnpm format

# 使用 taze 更新依赖
pnpm up-taze
```

### Git 操作

```bash
# 获取并清理远程分支
pnpm git:fetch

# 将 dev 分支 rebase 到 master 并推送
pnpm git:dev-2-master

# 将 master 分支 rebase 到 dev
pnpm git:master-2-dev
```

## 架构与核心组件

### 文档结构

- `docs/` - 主文档目录
  - `index.md` - 主页（从 README.md 自动生成）
  - `topics/index.md` - 按主题分类的 stars
  - `prompts/index.md` - 开发提示词和任务
  - `.vitepress/config.ts` - VitePress 配置
  - `.vitepress/theme/` - 自定义主题配置

### 自动化与工作流程

- `.github/workflows/schedules.yml` - 每日自动执行：
  - 运行 starred 工具更新基于语言的分类
  - 生成基于主题的分类
  - 将更改提交回仓库
- `.github/workflows/deploy-github-page.yml` - 推送时部署到 GitHub Pages

### 配置文件

- `prettier.config.mjs` - 使用 OXC 解析器格式化 JS/TS 的 Prettier 配置
- `commitlint.config.cjs` - 使用 @ruan-cat/commitlint-config 的提交信息校验
- `taze.config.ts` - 依赖更新配置
- `.czrc` - 用于约定式提交的 Commitizen 配置

## 关键技术细节

### VitePress 配置

- 使用 `@ruan-cat/vitepress-preset-config` 实现标准化配置
- 根据文档结构自动生成侧边栏
- 包含变更日志生成和 README.md 复制功能
- 自定义主题附加样式

### GitHub Stars 处理

- 使用 `starred` Python 包生成分类列表
- 两种分类方式：
  1. 按编程语言分类（主列表在 `docs/index.md`）
  2. 按仓库主题分类（在 `docs/topics/index.md`）
- 通过 GitHub Actions 每日自动更新

### 开发工作流

- 需要 Node.js >=22.14.0
- 使用 pnpm 作为包管理器
- 使用 cz-git 进行约定式提交
- 使用 OXC 解析器增强 Prettier 对 JS/TS 的支持
- 打印宽度：120，使用制表符：true，单引号：false（JSX：true）

## 重要说明

- 主要内容（`docs/index.md` 和 `docs/topics/index.md`）是自动生成的 - 请勿手动编辑这些文件
- 项目使用 `@ruan-cat/*` 包的自定义预设系统
- 任何分支推送都会自动触发 GitHub Pages 部署
- 站点配置了 `/stars-list/` 作为 GitHub Pages 的 base 路径以确保兼容性
