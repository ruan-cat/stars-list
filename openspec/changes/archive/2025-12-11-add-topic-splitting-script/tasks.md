## 1. 实施

### 1.1 创建拆分脚本
- [x] 1.1.1 创建 `docs/split-topics.ts` 文件
- [x] 1.1.2 实现 `splitTopics()` 主函数
- [x] 1.1.3 实现 `extractHeadings()` 函数提取所有二级标题
- [x] 1.1.4 实现 `extractContent()` 函数提取标题下的内容
- [x] 1.1.5 实现 `formatTitle()` 函数格式化一级标题
- [x] 1.1.6 实现 `isExcluded()` 函数过滤排除的标题
- [x] 1.1.7 实现 `ensureDirectory()` 函数确保目录存在
- [x] 1.1.8 添加完整的 JSDoc 注释

### 1.2 日志系统配置
- [x] 1.2.1 从 `package.json` 导入包名和版本
- [x] 1.2.2 使用 `consola.withTag(packageName)` 创建 logger
- [x] 1.2.3 在 `splitTopics()` 开始时输出包信息日志
- [x] 1.2.4 将所有 `consola` 调用改为使用 `logger`
- [x] 1.2.5 使用英文日志消息（如 "Found X headings" 而不是 "找到 X 个标题"）

### 1.3 集成到 VitePress 配置
- [x] 1.3.1 修改 `docs/.vitepress/config.ts` 文件
- [x] 1.3.2 在文件顶部添加 `import { splitTopics } from "../split-topics"`
- [x] 1.3.3 在 `setUserConfig` 调用前添加 `splitTopics()` 执行

### 1.4 依赖管理
- [x] 1.4.1 检查 `consola` 是否已安装：`pnpm list consola`
- [x] 1.4.2 如未安装，执行 `pnpm add consola` 安装依赖
- [x] 1.4.3 验证安装成功

### 1.5 测试验证
- [x] 1.5.1 启动开发服务器：`pnpm docs:dev`
- [x] 1.5.2 验证控制台日志输出正确（显示带包名的标签）
- [x] 1.5.3 检查 `docs/topics/` 目录下生成的文件数量（174 个）
- [x] 1.5.4 验证生成的文件格式正确（一级标题 + 列表内容）
- [x] 1.5.5 在浏览器中验证 VitePress 侧边栏导航正常
- [x] 1.5.6 点击几个 topic 链接验证页面加载正常

### 1.6 构建验证
- [x] 1.6.1 执行 `pnpm docs:build` 构建生产版本
- [x] 1.6.2 验证构建过程无错误
- [x] 1.6.3 执行 `pnpm docs:preview` 预览构建结果
- [x] 1.6.4 验证所有 topic 页面可正常访问

## 2. 文档

- [x] 2.1 在 `docs/split-topics.ts` 中添加文件级别的注释说明
- [x] 2.2 创建 OpenSpec 规范文档 `openspec/changes/add-topic-splitting-script/specs/development-guidelines/spec.md`

## 3. 清理

- [x] 3.1 确保所有生成的文件符合预期格式
- [x] 3.2 移除任何临时或测试文件
- [x] 3.3 最终验证所有功能正常工作