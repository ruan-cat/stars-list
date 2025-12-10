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
