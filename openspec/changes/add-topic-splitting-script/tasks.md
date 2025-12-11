## 1. 实施

### 1.1 创建拆分脚本
- [ ] 1.1.1 创建 `docs/split-topics.ts` 文件
- [ ] 1.1.2 实现 `splitTopics()` 主函数
- [ ] 1.1.3 实现 `extractHeadings()` 函数提取所有二级标题
- [ ] 1.1.4 实现 `extractContent()` 函数提取标题下的内容
- [ ] 1.1.5 实现 `formatTitle()` 函数格式化一级标题
- [ ] 1.1.6 实现 `isExcluded()` 函数过滤排除的标题
- [ ] 1.1.7 实现 `ensureDirectory()` 函数确保目录存在
- [ ] 1.1.8 添加完整的 JSDoc 注释

### 1.2 集成到 VitePress 配置
- [ ] 1.2.1 修改 `docs/.vitepress/config.ts` 文件
- [ ] 1.2.2 在文件顶部添加 `import { splitTopics } from "../split-topics"`
- [ ] 1.2.3 在 `setUserConfig` 调用前添加 `splitTopics()` 执行

### 1.3 依赖管理
- [ ] 1.3.1 检查 `consola` 是否已安装：`pnpm list consola`
- [ ] 1.3.2 如未安装，执行 `pnpm add consola` 安装依赖
- [ ] 1.3.3 验证安装成功

### 1.4 测试验证
- [ ] 1.4.1 启动开发服务器：`pnpm docs:dev`
- [ ] 1.4.2 验证控制台日志输出正确
- [ ] 1.4.3 检查 `docs/topics/` 目录下生成的文件数量（预期约 148 个）
- [ ] 1.4.4 验证生成的文件格式正确（一级标题 + 列表内容）
- [ ] 1.4.5 在浏览器中验证 VitePress 侧边栏导航正常
- [ ] 1.4.6 点击几个 topic 链接验证页面加载正常

### 1.5 构建验证
- [ ] 1.5.1 执行 `pnpm docs:build` 构建生产版本
- [ ] 1.5.2 验证构建过程无错误
- [ ] 1.5.3 执行 `pnpm docs:preview` 预览构建结果
- [ ] 1.5.4 验证所有 topic 页面可正常访问

## 2. 文档

- [ ] 2.1 在 `docs/split-topics.ts` 中添加文件级别的注释说明
- [ ] 2.2 更新 CLAUDE.md（如需要）记录新的构建流程

## 3. 清理

- [ ] 3.1 确保所有生成的文件符合预期格式
- [ ] 3.2 移除任何临时或测试文件
- [ ] 3.3 最终验证所有功能正常工作