# 2026-04-21 Prettier JSONC 配置格式化加固说明

## 背景

本项目在接入 VS Code 配置模板时，需要在 `prettier.config.mjs` 中加入以下配置：

```js
{
	files: ".vscode/extensions.json",
	parser: "jsonc",
}
```

这不是一个偶然的局部补丁，而是配置文件格式化策略中的通用问题：很多配置文件虽然使用 `.json` 后缀，但实际语法并不是严格 JSON，而是允许注释和尾逗号的 JSONC。若项目的 `format` 命令会匹配 `*.json`，Prettier 可能按普通 JSON 解析这些文件，导致“文件对工具有效，但格式化器报错”的故障。

这份文档用于指导其他 AI 改造全局 init 系列技能文档，补齐 JSON/JSONC 配置文件的识别、落盘、格式化和验证规则。

## 核心结论

当模板文件满足以下条件时，skill 必须考虑 Prettier JSONC 兼容：

1. 模板文件使用 `.json` 后缀。
2. 模板内容包含 `//` 注释、块注释、尾逗号，或目标工具明确按 JSONC 解析。
3. 目标项目存在 Prettier 配置或 `format` 脚本会覆盖该文件。

在这种情况下，应为该文件添加 Prettier override：

```js
{
	files: ".vscode/extensions.json",
	parser: "jsonc",
}
```

如果不做这个配置，后续运行 `pnpm format`、lint-staged 或保存时格式化时，可能出现解析失败。

## 1. 为什么需要 `parser: "jsonc"`

### 1.1 文件扩展名不等于真实语法

`.json` 后缀通常表示严格 JSON，但很多工程工具为了可维护性，会让配置文件支持注释。例如 VS Code 能读取 `.vscode/extensions.json` 中的行注释，TypeScript 也长期支持 `tsconfig.json` 中的注释。

这类文件更准确的语法是 JSONC。Prettier 如果按严格 JSON 解析，就会把合法注释视为语法错误。

### 1.2 模板注释是有价值的

init 类技能经常会生成面向团队的配置文件。配置模板中的注释用于解释：

- 为什么推荐某个扩展或设置。
- 哪些字段是团队策略。
- 哪些配置不能随意删除。
- 后续维护者如何扩展。

直接删除注释可以绕过解析错误，但会降低模板可维护性。这不是合格修复。正确做法是保留注释，并让格式化器使用正确 parser。

### 1.3 格式化链路会放大这个问题

很多项目会配置：

```json
{
	"scripts": {
		"format": "prettier --write '**/*.{js,ts,json,md,yml}'"
	}
}
```

或者通过 `lint-staged` 对暂存文件执行：

```js
export default {
	"*": "prettier --experimental-cli --write",
};
```

这意味着 `.vscode/extensions.json` 这种 JSONC 文件迟早会进入 Prettier。如果没有 override，故障会在提交前或 CI 中暴露。

## 2. 哪些文件需要重点检查

### 2.1 应优先检查的文件

在 init 技能中，只要生成或合并以下文件，就应检查它们是否包含注释，以及 Prettier 是否需要 JSONC override：

- `.vscode/extensions.json`
- `.vscode/settings.json`
- `tsconfig.json`
- `tsconfig.*.json`
- `jsconfig.json`
- `.devcontainer/devcontainer.json`
- `.hintrc`
- 任何技能模板里带注释的 `*.json`

注意：不是所有这些文件都一定要写 override。判断依据是“目标文件是否保留 JSONC 语法”以及“是否会进入 Prettier 格式化范围”。

### 2.2 不应盲目改成 JSONC 的文件

以下文件通常应保持严格 JSON，不应因为统一方便而无脑配置成 JSONC：

- `package.json`
- `package-lock.json`
- `pnpm-lock.yaml`
- `composer.json`
- 需要被第三方严格 JSON parser 读取的配置文件

如果这些文件里出现注释，正确处理通常是删除注释或改成工具支持的配置格式，而不是强行让 Prettier 接受 JSONC。

## 3. 技能文档应加入的判断流程

### 3.1 新增“配置文件语法方言识别”步骤

在 init 类 skill 的落盘流程中，加入以下判断：

1. 扫描本次将创建或更新的配置文件。
2. 找出 `*.json` 文件。
3. 判断这些文件是否包含 JSONC 语法：
   - `//` 行注释
   - `/* ... */` 块注释
   - 尾逗号
   - 工具官方文档明确支持 JSONC
4. 读取目标项目的 `package.json`，检查 `format`、`lint-staged` 或类似命令是否会格式化 `*.json`。
5. 如果文件是 JSONC 且会进入 Prettier，则更新 Prettier 配置。

### 3.2 新增“Prettier override 合并”步骤

当目标项目存在 `prettier.config.mjs` 时，应合并而不是覆盖：

```js
/** @type {import("prettier").Config} */
const config = {
	overrides: [
		{
			files: ".vscode/extensions.json",
			parser: "jsonc",
		},
	],
};

export default config;
```

如果目标配置已存在 `overrides`，应追加缺失项。不要删除已有 parser、plugin、printWidth、tabWidth、endOfLine 等项目配置。

如果已存在同一文件的 override，应检查 parser 是否已经是 `jsonc`。如果不是，除非项目有明确理由，否则应改为 `jsonc`。

### 3.3 新增“多文件批量规则”

如果同一个项目有多个 JSONC 配置文件，可以合并成数组，避免重复配置：

```js
{
	files: [".vscode/extensions.json", ".vscode/settings.json", "tsconfig*.json"],
	parser: "jsonc",
}
```

但不要把 `**/*.json` 全部改成 `jsonc`。这会掩盖本应保持严格 JSON 的文件错误，尤其是 `package.json`。

## 4. 推荐写入 init-vscode skill 的内容

### 4.1 在 `extensions.json` 章节加入

```markdown
如果 `.vscode/extensions.json` 保留注释，则该文件是 JSONC 而不是严格 JSON。写入模板后必须检查目标项目的 Prettier 链路：如果 `format` 或 lint-staged 会处理 `*.json`，需要在 `prettier.config.mjs` 中为 `.vscode/extensions.json` 指定 `parser: "jsonc"`。
```

### 4.2 在 `settings.json` 章节加入

```markdown
`.vscode/settings.json` 同样可能包含注释。若模板或合并后的文件包含注释，按 JSONC 文件处理，并复用 Prettier JSONC override 规则。若文件保持严格 JSON 且无注释，则不必强制添加 override。
```

### 4.3 在验证章节加入

```bash
pnpm exec prettier --parser jsonc --check .vscode/extensions.json
pnpm exec prettier --check .vscode/extensions.json
```

第一条命令验证文件本身能按 JSONC 解析；第二条命令验证目标项目的 Prettier 配置是否已正确接管。

## 5. 推荐写入 init-prettier-git-hooks skill 的内容

`init-prettier-git-hooks` 负责建立格式化链路，因此也应提醒后续 AI：

```markdown
当项目存在带注释的 `.json` 配置文件时，不要只添加通用 `format` 命令。必须检查这些文件是否需要 Prettier `jsonc` parser override。尤其是 `.vscode/extensions.json`、`.vscode/settings.json`、`tsconfig*.json` 等常见 JSONC 文件。
```

如果该 skill 会新建或修改 `prettier.config.mjs`，建议在模板或合并逻辑中预留 JSONC override 示例，但不要默认把所有 JSON 文件都按 JSONC 处理。

## 6. 验证命令

### 6.1 单文件解析验证

对 JSONC 文件运行：

```bash
pnpm exec prettier --parser jsonc --check .vscode/extensions.json
```

这个命令证明文件内容本身是合法 JSONC。

### 6.2 项目配置验证

再运行：

```bash
pnpm exec prettier --check .vscode/extensions.json
```

这个命令证明项目级 `prettier.config.mjs` 已经能正确识别该文件。如果这条失败而第一条成功，说明需要补 `parser: "jsonc"` override。

### 6.3 格式化链路验证

如果项目 format 命令范围较小，可以运行：

```bash
pnpm format
```

如果全量 `pnpm format` 会改写大量历史文件，应运行窄范围检查：

```bash
pnpm exec prettier --check .vscode/extensions.json .vscode/settings.json prettier.config.mjs
```

交付时必须说明没有运行全量格式化的原因，避免误报“格式化链路完全通过”。

## 7. 常见错误

### 7.1 把 `JSON.parse` 当成 JSONC 验证

`JSON.parse` 不支持注释。对于保留注释的配置文件，不能用它作为通过标准。应使用 Prettier 的 `jsonc` parser 或其他明确支持 JSONC 的解析器。

### 7.2 删除注释来消除错误

这会破坏模板可维护性。除非目标工具不支持注释，否则不要通过删除注释解决 parser 问题。

### 7.3 把所有 JSON 都配置为 JSONC

这会降低严格 JSON 文件的错误发现能力。`package.json` 等文件应继续保持严格 JSON。

### 7.4 只改目标项目，不改技能文档

如果不把判断逻辑写入 skill，后续 AI 会继续复制旧模板或漏掉 Prettier override。正确修复应该同时改模板、skill 流程和验证章节。

### 7.5 忽略 lint-staged

即使 `pnpm format` 不常跑，lint-staged 也可能在提交时格式化暂存文件。只要 lint-staged 会处理 `*` 或 `*.json`，就必须确认 JSONC 文件不会在提交前失败。

## 8. 可交给其他 AI 的改造任务模板

```markdown
请升级全局 init 系列技能中的 JSONC 配置处理逻辑：

1. 检查 `init-vscode` 的 `.vscode/extensions.json` 和 `.vscode/settings.json` 模板是否保留注释。
2. 若模板保留注释，确保模板语法是合法 JSONC，不使用会被内部 `*/` 截断的外层块注释。
3. 更新 `init-vscode/SKILL.md`：说明 `.vscode/extensions.json` 保留注释时必须按 JSONC 处理。
4. 更新 `init-prettier-git-hooks/SKILL.md`：在创建或合并 Prettier 配置时，检查带注释的 `*.json` 配置文件是否需要 `parser: "jsonc"` override。
5. 给出合并示例，但不要把 `**/*.json` 全部设为 JSONC。
6. 添加验证命令：
   - `pnpm exec prettier --parser jsonc --check .vscode/extensions.json`
   - `pnpm exec prettier --check .vscode/extensions.json`
   - 如适用，运行 `pnpm format` 或说明不能全量运行的原因。
7. 验收标准：保留注释、无语法错误、项目级 Prettier 能正确检查 `.vscode/extensions.json`。
```

## 9. 交付说明模板

```markdown
已完成 JSONC 配置格式化加固：

- `init-vscode` 已明确 `.vscode/extensions.json` / `.vscode/settings.json` 保留注释时按 JSONC 处理。
- `init-prettier-git-hooks` 已补充 Prettier JSONC override 判断逻辑。
- 示例 override 使用精确文件匹配，不会把所有 `*.json` 都改成 JSONC。
- 已验证：
  - `pnpm exec prettier --parser jsonc --check .vscode/extensions.json`
  - `pnpm exec prettier --check .vscode/extensions.json`

后续使用 init 技能落地 VS Code 配置时，若目标项目 format/lint-staged 会处理 JSON 文件，将自动补齐或提示补齐 `parser: "jsonc"`。
```
