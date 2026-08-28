# stars-list

> 阮喵喵的 GitHub Stars 列表 —— 一个由 GitHub Actions 自动维护、按主题分类的 star 收藏文档站。

- 在线访问：<https://ruan-cat.github.io/stars-list>
- 仓库地址：<https://github.com/ruan-cat/stars-list>

## 1. 项目简介

本仓库自动收录 [ruan-cat](https://github.com/ruan-cat) 在 GitHub 上 star 过的仓库，并按主题（topic）分类整理成 VitePress 文档站点。每日定时任务会重新抓取最新的 star 数据并自动提交更新，站点随之重新部署，无需人工维护。

站点内可以浏览的内容：

- 按主题分类的 stars 列表（`docs/topics/index.md` 与 `docs/topics/*.md`）
- GitHub TODO 扫描工件的展示页面（`docs/todos.md`）
- 开发提示词与任务记录（`docs/prompts/index.md`）

## 2. 工作原理

|   环节   |          工作流          |                                                  说明                                                   |
| :------: | :----------------------: | :-----------------------------------------------------------------------------------------------------: |
| 数据更新 |     `schedules.yml`      | 每天 UTC 00:30 运行 [starred](https://github.com/maguowei/starred)，按主题分类生成 stars 列表并自动提交 |
| 站点部署 | `deploy-github-page.yml` |                        推送到 `main` 分支时构建 VitePress 并部署到 GitHub Pages                         |
| 首页生成 | VitePress 构建时自动复制 |                   根目录 `README.md` 会在构建时被复制为 `docs/index.md`，作为站点首页                   |

> [!IMPORTANT]
> `README.md` 由人工维护，自动化流程不会再覆盖它。`docs/topics/index.md`、`docs/topics/*.md` 与 `docs/index.md` 均为自动生成文件，请勿手工编辑。

## 3. 目录结构

```plain
stars-list/
├── .github/workflows/       # GitHub Actions 工作流（定时更新、页面部署）
├── docs/
│   ├── .vitepress/          # VitePress 配置与自定义主题
│   ├── topics/              # 按主题分类的 stars 列表（自动生成）
│   ├── prompts/             # 开发提示词与任务记录
│   └── todos.md             # GitHub TODO 工件展示页
├── scripts/get-todo/        # GitHub TODO 扫描工具（scanner/parser/CLI）
└── artifacts/github-todos/  # TODO 扫描结果工件（JSON）
```

## 4. 本地开发

环境要求：Node.js >= 22.14.0，包管理器使用 pnpm。

```bash
# 安装依赖
pnpm install

# 启动本地开发服务器
pnpm docs:dev

# 构建 GitHub Pages 版本（包含正确的 base 路径）
pnpm build

# 本地预览生产版本
pnpm docs:preview

# 格式化所有代码文件
pnpm format
```

说明：本地文档命令默认不生成派生 Markdown（`docs/index.md`、`docs/topics/*.md` 等），需要刷新时显式设置 `GENERATE_DERIVED_DOCS=true` 后再运行文档命令；GitHub Actions 中会自动生成。

## 5. GitHub TODO 扫描与工件

以下命令用于本地 Windows 或 GitHub Actions 的 TODO 扫描与校验。扫描结果写入 `artifacts/github-todos/ruan-cat.json`，VitePress 页面只读取这个 JSON，不在浏览器暴露 token。

```bash
# 全量扫描 owner 仓库（Git-first/degit；本地需要 GITHUB_PAT_TOKEN）
pnpm todo:scan -- --owner ruan-cat --transport degit --refresh-manifest --manifest scripts/get-todo/repositories.json --output artifacts/github-todos/ruan-cat.json

# 离线 fixture 扫描（验证 parser/CLI，不代表真实 GitHub 全量结果）
pnpm todo:scan -- --owner ruan-cat --fixture scripts/get-todo/fixtures --output artifacts/github-todos/ruan-cat.json

# 校验 artifact schema
pnpm todo:validate -- artifacts/github-todos/ruan-cat.json

# 运行 scanner、parser、collector、cache 全部测试
pnpm todo:test
```

`todo:scan` 默认使用 `degit` 下载干净快照，按 `dev → main → master` 选分支，跳过 fork；单仓库失败会记录到 artifact 并继续其他仓库。`scan.completeness` 为 `complete` 或 `partial`，提交前必须同时查看 `summary`、`repositories[].status` 和 `errors`，不能只看命令退出码。

私有仓库需要本地环境变量 `GITHUB_PAT_TOKEN`（至少具备目标仓库内容读取权限）；GitHub Actions 使用同一凭据的 `TODO_SCAN_PAT` Secret（GitHub 禁止 Secret 名以 `GITHUB_` 开头，workflow 会将其映射为 `GITHUB_TOKEN`）。API 探测使用 Bearer，Git smart HTTP 下载使用不出现在命令参数中的 Basic `x-access-token:<PAT>` extraheader；API 返回 200 不代表 Git transport 一定可用。`branch_unavailable` 表示仓库没有 `dev/main/master`，与认证失败是两类问题。

配置 Actions Secret：`gh secret set TODO_SCAN_PAT --repo ruan-cat/stars-list`，随后手动触发 `Scan GitHub TODOs` workflow；不要尝试创建 `GITHUB_PAT_TOKEN` Secret，GitHub 会以 422 拒绝该名称。

workflow 的 checkout 必须设置 `persist-credentials: false`，否则 checkout 写入的 Authorization header 会与扫描器的 Git Basic header 重复，导致 GitHub 返回 `Duplicate header: "Authorization"`。

## 6. 相关文档

- 开发提示词与任务记录：`docs/prompts/index.md`
- 事故与排错经验沉淀：`.agents/skills/fix-bug/record-bug-fix-memory/SKILL.md`

## 7. 许可证

本项目以 [CC0 1.0 Universal](LICENSE) 发布。
