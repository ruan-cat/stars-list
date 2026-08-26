# GitHub TODO 扫描器 Git-first/degit 迁移设计

> 状态：已确认，作为 `2026-08-26-github-todo-scanner-design.md` 的后续 superseding 设计。旧文档保留历史方案，不得与本设计混用。

## 1. 目标

将 TODO 内容获取从 GitHub REST API 的 Trees/Blobs 路径迁移到 Git transport + `degit` 快照路径，避免内容扫描消耗 REST core 配额，同时保留公开/私有仓库、`dev → main → master` 分支优先级、fork 排除、既有 TODO parser 和 JSON contract。

## 2. 不可绕过的边界

- Git transport 不依赖 REST core 配额，但仍受网络、带宽、GitHub abuse throttling 和凭据权限影响。
- API 配额耗尽后无法自动发现新仓库；必须使用最近一次成功生成的 manifest，并在结果中标记 `manifestStale=true`。
- 私有仓库必须使用 PAT 或 SSH 凭据；不把 token 拼入 URL，不把凭据写入 JSON、日志或缓存索引。
- `GITHUB_TOKEN` 通常只覆盖当前 Actions 仓库；跨仓库私有读取必须使用 `GITHUB_PAT_TOKEN` 或等价 secret。

## 3. 仓库清单 manifest

文件：`scripts/get-todo/repositories.json`。它是 API 不可用时的仓库发现快照，不保存源码。

```json
{
	"schemaVersion": 1,
	"owner": "ruan-cat",
	"generatedAt": "2026-08-26T00:00:00.000Z",
	"source": "github-api|manual|cache",
	"manifestStale": false,
	"repositories": [
		{
			"fullName": "ruan-cat/example",
			"visibility": "private",
			"fork": false,
			"archived": false,
			"selectedBranch": "dev",
			"lastKnownCommitSha": "abc123",
			"lastFetchedAt": "2026-08-26T00:00:00.000Z"
		}
	]
}
```

刷新规则：API 成功时完整替换 manifest；API 限流、网络失败或权限不足时保留旧文件并设置 `manifestStale=true`；没有 manifest 时 Git-first 扫描失败。`fork=true` 默认跳过并记录 `skipReason=fork`；`archived=true` 默认继续扫描。

## 4. Git-first 采集流程

1. `manifest-loader.ts` 读取并校验 manifest。
2. `git-client.ts` 用 `git ls-remote --heads` 查询 `dev`、`main`、`master` 和实际 commit SHA，不创建工作树。
3. `degit-client.ts` 调用 degit ESM API，源为 `owner/repo#branch`，目标为唯一临时目录；默认 tar 模式，不留下 `.git`。
4. 私有 tarball 失败时，使用临时 Git/SSH fallback；fallback 完成后删除 `.git`，再交给 parser。
5. `local-snapshot-collector.ts` 在临时目录按路径/扩展名/大小规则扫描，复用现有 `todo-parser.ts`。
6. 扫描结束在 `finally` 中删除当前 run 目录；只输出 JSON artifact，不将快照目录留在工作树。

每条 TODO 增加 `source="degit|git-fallback"`、`commitSha`、`manifestStale`、`cacheStatus="hit|miss|fallback"` 和 `fork=false`，原有 repo/path/branch/line/kind/text/rawLine/htmlUrl 等字段保持兼容。

## 5. 缓存与清理

- 解压后的仓库目录永不持久化。
- Windows 仅允许 degit tar 缓存和轻量 `cache-index.json`，目录位于 `%LOCALAPPDATA%\ruan-cat\github-todo`；默认最大 512 MiB、最长 7 天，按最旧优先清理。
- 每次运行使用 `%TEMP%\ruan-cat-github-todo-<runId>`，成功、失败、取消都清理。
- `--clear-cache` 只允许清理上述明确目录；删除前验证绝对路径前缀，禁止以工作树或用户目录为递归目标。
- Actions 默认不缓存私有源代码；runner 结束后临时目录自然消失。公开快照缓存必须显式开启，并以 commit SHA 作为 key。
- 缓存命中必须重新校验 manifest commit SHA；SHA 不一致不得复用旧快照。

## 6. 失败与恢复状态

- `manifest_unavailable`：没有可用 manifest，任务失败。
- `manifest_stale`：旧 manifest 可用，继续扫描但全局标记过期。
- `branch_unavailable`：没有目标分支，跳过该仓库并记录。
- `snapshot_download_failed`：degit 失败后 Git fallback 也失败，记录仓库错误。
- `snapshot_too_large`：超过快照大小上限，记录仓库错误。
- Actions 严格模式：manifest 过期超过 30 天、无 manifest、任一原创仓库无法扫描时非零退出，不替换正式 artifact；同时上传诊断 JSON。
- Windows 本地模式：允许 `partial`，但必须展示失败仓库和 manifest 新鲜度。

## 7. Windows 与 GitHub Actions

Windows 使用持久化 degit tar 缓存提升重复扫描速度，临时解压目录每次清理；Git 凭据交给 Windows Credential Manager、SSH agent 或环境变量，不写入命令日志。

Actions 使用一个 job、最多 4 个并发仓库下载/解析，避免动态 matrix 需要额外 API；manifest 与 artifact 变化时用一个 Conventional Commit 提交：

```text
🐎 ci(todo): 更新 GitHub TODO 扫描清单与结果
```

只有扫描完整才提交；partial/strict failure 保留上一次正式 artifact，并上传本次诊断输出。

## 8. 验收标准

- parser 既有 16 项测试全部保持通过。
- 新增 manifest schema、fork 排除、`git ls-remote` 分支优先级、degit 成功、Git fallback、缓存命中/过期/清理和 Actions strict failure 测试。
- Windows fixture 能在无 REST API 的情况下生成合法 artifact。
- 使用公开仓库进行真实 degit smoke，确认目标目录无 `.git`。
- 使用私有仓库凭据进行受控 smoke，确认 token 不出现在日志、进程参数和 JSON。
- API 限流模拟下仍能用旧 manifest 完成内容扫描并标记 `manifestStale=true`。
- 运行 `pnpm todo:test`、TypeScript 类型检查、Prettier、`git diff --check` 和 artifact validator。
