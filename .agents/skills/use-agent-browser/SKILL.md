---
name: use-agent-browser
description: >-
  stars-list 项目内的浏览器验收入口。当需要打开 /todos.html、做浏览器自我验收、视觉验证、
  E2E 冒烟、前端页面调试，或提到 agent-browser、agent browser、浏览器自动化、
  snapshot 截图取证时使用。本技能是全局技能 use-agent-browser 的本地派生：
  先读全局技能，再叠加本项目的验收范围、会话命名与证据归档约定。
user-invocable: true
metadata:
  version: "2.0.0"
---

# use-agent-browser（stars-list 本地派生）

## 0. 本技能的性质

本技能是**全局技能 `use-agent-browser` 的本地派生**，不是一份独立技能。

- 全局技能来自 `ruan-cat/monorepo` 的 `ai-plugins/dev-skills`，安装后位于 `~/.agents/skills/use-agent-browser/`。
- 命令手册、Windows 启动降级链、启动失败分流、验收纪律（四层 checkpoint、失败止损表、Red Flags、提交前证据落盘门禁）、验收与报告模板、五组实战案例集，**全部以全局技能为准**。
- 本文件不重复上述内容，只保留 stars-list 专属的「验收范围、会话命名、证据归档、无障碍作用域」四件事。

## 1. 执行顺序

1. **先读全局技能**：打开 `~/.agents/skills/use-agent-browser/SKILL.md`，按其中的「不可跳过纪律」与「渐进式加载地图」执行。
2. **再读本文件**：套用 stars-list 的专属约定。
3. 命令细节最终以 `agent-browser skills get core` 的版本匹配输出为准。

## 2. stars-list 专属约定

### 2.1 验收范围

- 核心验收对象是 TODO 浏览器页面 `/todos.html`。
- 普通文档页（首页、topics、reports、prompts 等）只能作为**独立旁路 checkpoint**，不得塞进 TODO 核心矩阵。
- 一个环境的一次验收只服务一个范围。

### 2.2 会话命名

- 会话名固定为 `todo-<environment>-<YYYYMMDD>-<run>`；同一环境同一验收运行只允许一个名称。
- `dev`、`preview`、`production` 是三个独立环境，各自一个 session，不得复用或拼接。

### 2.3 证据归档

- 浏览器证据随长任务归档到 `openspec/changes/<change>/evidence/`，并在 `evidence/manifest.md` 登记截图路径、viewport 与 SHA-256。
- 提交前按全局技能的「提交前证据落盘校验」逐行核对路径存在性、图片尺寸与哈希，不匹配一律标记 `needs_check`。

### 2.4 无障碍验收作用域

- axe 规则扫描默认限定 TODO 子树：`--selector '[aria-label="GitHub TODO 浏览器"]'`。
- axe + 语义树 + 真实键盘三件套的组合要求、命令与判读纪律，见全局技能的 `references/command-cookbook.md`。

## 3. 维护边界

- 不要把全局技能的命令手册、案例集、验收纪律复制回本文件。
- 不要在本文件新增与全局技能冲突的规则；确需新增通用规则时，改全局技能（`ruan-cat/monorepo`），本文件只做项目适配。
