# GitHub 用户 TODO 全量扫描工作流设计

## 1. 目标

提供一个由 `tsx` 直接执行的 Node/TypeScript 工作流，使用 GitHub REST API 扫描指定用户拥有的公开与私有仓库，在每个仓库选择 `dev`、`main`、`master` 中的首个存在分支，提取大写独立关键词 `TODO` 的待办文本，并生成可供 Windows、GitHub Actions 和未来 VitePress/Vue 组件复用的 JSON 交付物。

## 2. 范围与权限

- 默认目标用户为 `ruan-cat`，CLI 可通过 `--owner` 覆盖。
- 仓库范围为认证用户的 `type=owner` 仓库，不包含仅协作仓库。
- 本地优先读取 `GITHUB_TOKEN`，兼容 `GITHUB_PAT_TOKEN`；无 token 时仅扫描公开仓库并将结果标记为 `partial`。
- GitHub Actions 环境（`GITHUB_ACTIONS=true`）缺少 token 时直接失败，避免把私有仓库遗漏后误报完整。
- Token 只进入请求头，绝不写入日志、fixture 或 JSON。

## 3. 分支选择

每个仓库按 `dev` → `main` → `master` 顺序检查分支。选中第一个存在的分支并记录实际名称；三者均不存在时记录 `branch_unavailable`，不回退到默认分支或伪造分支名。

## 4. 采集架构

采用共享核心 + CLI 适配器：

- `github-client.ts`：用 `ofetch` 封装分页、分支探测、递归 tree、blob 获取、超时、限流退避和响应头统计。
- `todo-parser.ts`：无网络纯函数，接收文件路径、内容和元数据，返回 TODO 命中或文件跳过原因。
- `collector.ts`：编排仓库、分支、文件过滤、并发限制、错误聚合和全局统计。
- `cli.ts`：使用 `citty` 暴露命令参数，调用 collector，原子写入 JSON，并通过现有 `consola.withTag(packageName)` 输出摘要。
- `validate.ts`：验证 JSON contract，供本地与 Actions 门禁复用。

使用 Git Trees + Blobs，而不是 Code Search 或 clone。递归 tree 被 GitHub 截断时按目录逐层回退；文件读取并发上限为 4，遇到 `403/429` 依据 `retry-after` 或 `x-ratelimit-reset` 指数退避。

## 5. 文件范围

默认扫描 `.md`, `.mdx`, `.txt`, `.ts`, `.tsx`, `.js`, `.jsx`, `.vue`, `.css`, `.scss`, `.less`, `.json`, `.yaml`, `.yml`, `.html`, `.xml`, `.py`, `.go`, `.java`, `.kt`, `.rs`, `.rb`, `.php`, `.c`, `.cpp`, `.h`, `.sh`, `.ps1`, `.sql` 等文本扩展名。跳过图片、压缩包、字体、锁文件和 `node_modules`, `dist`, `build`, `.git` 等生成目录；单文件超过 1 MiB 时记录 `file_too_large` 并跳过。CLI 可用 `--extensions` 与 `--max-file-bytes` 覆盖。

## 6. TODO 解析规则

只匹配大写、独立的 `TODO`，允许其后出现冒号和空白；`todo`、`Todo`、`TODOLIST` 不识别。行号从 1 开始。

1. Markdown 标题（`##` 至 `######`）含 TODO 注释时，取 `-->` 后标题正文；数字编号不进入文本。
2. Markdown 行内注释取 `TODO:` 注释内部文本，例如“可接受的优化”。
3. 整行 Markdown 注释取注释内部文本。
4. 整行空 TODO 向下跳过空白行，取第一条非空普通文本；遇到标题、代码围栏或另一个 TODO 即停止，并生成 `unresolved_empty_todo`。
5. 其他文本格式识别 `//`、`/* ... */`、`#`、`--`、JSDoc `*` 等注释前缀，取 `TODO:` 后内容。
6. 数字编号标题且 TODO 与标题正文均为空（如 `## 015 <!-- TODO: -->`）属于黑名单，完全忽略。
7. 同一行多个独立 TODO 各生成一条记录，并通过命中序号确保稳定 ID 唯一。

## 7. JSON contract

默认文件为 `artifacts/github-todos/ruan-cat.json`，通过临时文件写入后原子重命名。顶层字段为 `schemaVersion`, `generatedAt`, `scan`, `summary`, `repositories`, `todos`, `errors`。每条 TODO 至少包含稳定 `id`、`repo`、`path`、`branch`、`line`、`kind`、`text`、`todoAnnotation`、`rawLine`、`sha`、`htmlUrl`、`visibility`、`language`。`completeness` 为 `complete|partial|failed`，仓库状态为 `scanned|unauthorized|branch_unavailable|failed`。

## 8. 运行接口

```text
pnpm todo:scan
pnpm todo:scan -- --owner ruan-cat --output artifacts/github-todos/ruan-cat.json
pnpm todo:scan -- --fixture scripts/get-todo/fixtures
pnpm todo:validate -- artifacts/github-todos/ruan-cat.json
```

GitHub Actions 每日执行 `pnpm todo:scan` 并上传/提交 JSON；VitePress 只读取静态 JSON，不在浏览器暴露 token。未来 Nitro/H3 adapter 可以复用 collector 与 parser。

## 9. 验收

- Node test fixture 覆盖全部七类示例、黑名单、大小写误报、空 TODO 边界。
- Contract validator 检查必填字段、统计计数和枚举值。
- 无 token 本地运行标记 `public-only/partial`；Actions 无 token 非零退出。
- 使用 `GITHUB_PAT_TOKEN` 对 `ruan-cat` 执行真实只读 smoke，验证 77 个自有仓库探测、`dev` 优先和私有仓库访问。
- 运行 Prettier、TypeScript/tsx、Node test、`git diff --check`，并检查输出中无 token。
