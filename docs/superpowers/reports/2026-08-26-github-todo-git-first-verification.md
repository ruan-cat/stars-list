# 2026-08-26 Git-first/degit TODO 扫描验证记录

## 1. 验证范围

本次验证覆盖 manifest、fork 过滤、`git ls-remote` 分支选择、degit tar 快照、Git fallback、bounded cache、临时目录清理、现有 TODO parser 和 CLI contract。

## 2. 本地自动化结果

执行 `pnpm todo:test`，结果为 29/29 通过。

执行 TypeScript 检查：

```log
pnpm exec tsc --noEmit --module esnext --moduleResolution bundler --target es2022 --skipLibCheck --allowImportingTsExtensions --resolveJsonModule --types node --esModuleInterop <scripts/get-todo/*.ts>
exit code 0
```

执行 Prettier 检查和 `git diff --check`，均通过。

## 3. 公开 degit smoke

使用 `pnpm exec degit octocat/Hello-World#master` 下载到临时目录，命令成功；目录检查结果为 `git_exists=False`，随后临时目录已删除。

## 4. API 限流边界

此前对 `ruan-cat` 的 REST 全量 smoke 收到：

```log
403 API rate limit exceeded for user ID 77109541
```

因此没有生成伪造的实时 `ruan-cat` artifact。Git-first 实现会在 manifest 已存在时跳过 API 刷新；只有传入 `--refresh-manifest` 或 Actions 默认流程才尝试刷新。

## 5. 当前未完成项

- 需要在 GitHub Actions secret 中提供具备跨仓库 Contents 读取权限的 PAT，完成真实私有仓库 fallback smoke。
- 需要配额恢复后执行一次 `--refresh-manifest --strict`，生成真实 `scripts/get-todo/repositories.json` 和 `artifacts/github-todos/ruan-cat.json`。
