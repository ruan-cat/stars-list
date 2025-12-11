# Change: 添加自动拆分 topics 文件的 TypeScript 脚本

## Why
当前 `docs/topics/index.md` 文件包含约 148 个主题，文件大小约 261KB。将所有主题放在一个文件中导致 VitePress 导航结构不够清晰，用户难以快速浏览和定位特定主题。通过将每个二级标题拆分为单独的 markdown 文件，可以改善导航体验并提高文档的可维护性。

## What Changes
- 添加 TypeScript 脚本 `docs/split-topics.ts`，自动读取 `docs/topics/index.md` 并提取每个二级标题内容为单独文件
- 脚本将排除 "Contents" 和 "License" 两个特殊标题
- 生成的文件将使用小写字母和连字符命名（如：`ai.md`, `ai-agents.md`）
- 文件内容使用一级标题，首字母大写格式（如：`# Ai`, `# Ai Agents`）
- 在 `docs/.vitepress/config.ts` 中集成脚本，在构建前自动执行拆分操作
- 确保 `consola` 依赖可用，用于日志记录

## Impact
- 影响的规范：构建自动化流程
- 影响的代码：
  - 新建 `docs/split-topics.ts` 脚本文件
  - 修改 `docs/.vitepress/config.ts` 添加脚本调用
  - 可能更新 `package.json` 添加 consola 依赖
  - 生成约 148 个新的 topic 文件在 `docs/topics/` 目录下