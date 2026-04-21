# 2026-04-21 init-vscode skill 模板语法加固说明

## 背景

全局 `init-vscode` skill 的 `templates/extensions.json` 模板存在一个模板级语法隐患：文件顶部使用块注释包裹说明文本，但说明文本中又包含字面量 `/* */`。在 JSONC、JavaScript、TypeScript 等语法中，里面的 `*/` 会提前结束外层块注释，导致后续中文说明暴露为非法语法。

这个问题会在目标项目复制模板后触发两个故障：

1. VS Code 将 `.vscode/extensions.json` 标记为语法错误。
2. 如果目标项目的格式化命令匹配 `*.json`，Prettier 可能按普通 JSON 或错误的解析路径处理该文件，从而报错。

本文档用于交给其他 AI，在全局 skill 源目录中加固 `init-vscode`，避免后续项目继续复制出故障模板。

## 修复目标

1. 保留 `.vscode/extensions.json` 模板中的说明注释和分组注释。
2. 避免在 JSONC 模板中使用可能被 `*/` 提前截断的外层块注释。
3. 更新 `init-vscode` skill 文档，明确当目标项目的 `.vscode/extensions.json` 保留注释时，需要让 Prettier 按 `jsonc` 解析。
4. 提供可重复验证命令，确保模板本身和目标项目落地结果都不会出现语法错误。

## 1. 修改范围

需要修改全局 skill 目录中的以下文件。路径以 Windows 常见安装位置为例，实际执行时按当前机器的全局 skills 根目录定位：

- `C:\Users\pc\.agents\skills\init-vscode\templates\extensions.json`
- `C:\Users\pc\.agents\skills\init-vscode\SKILL.md`

如果 skill 仓库里还有其他 agent 格式的同步副本，请在确认生成机制后同步更新；不要只改某一个派生产物。

## 2. 修复 `templates/extensions.json`

### 2.1 必须避免的写法

不要在 JSONC 文件顶部使用下面这种外层块注释来包裹长说明，尤其当说明文字里包含 `/* */`、`*/`、代码片段或注释语法示例时：

```text
/*
 * 允许：`//` 行注释、`/* */` 块注释
 */
{
	"recommendations": []
}
```

上面的示例会被解析器理解为：第二行里的 `*/` 已经结束外层块注释，后面的内容不再是注释。

### 2.2 推荐写法

把顶部说明改成 `//` 行注释。行注释不会被说明文字里的 `*/` 截断，可以保留可读性和语义说明。

```text
{
	// 本文件是 VS Code 扩展推荐清单，语义上使用 JSONC。
	// VS Code 会按 `.vscode/extensions.json` 的特殊规则读取这里的注释。
	// 注意：不要用块注释包裹包含注释结束符示例的说明文本，否则会提前结束注释并造成语法错误。
	"recommendations": [
		// ========== 语言支持 ==========

		// Vue 3 的 .vue SFCs LSP 语言支持服务
		"Vue.volar"
	],
	"unwantedRecommendations": []
}
```

### 2.3 保留内容要求

修复时不要为了消除错误而删除所有注释。模板应该继续保留这些信息：

- 文件为什么使用 JSONC。
- VS Code 能解析 `.vscode/extensions.json` 中的注释。
- 推荐扩展的分组注释。
- 每个重要扩展的用途注释。

正确目标是“保留注释且语法安全”，不是“退化为无注释 JSON”。

## 3. 更新 `SKILL.md`

### 3.1 在 extensions.json 处理流程中新增约束

在 `SKILL.md` 的 `处理 extensions.json` 章节补充以下要求：

```markdown
**JSONC 语法安全要求：**

- `.vscode/extensions.json` 可以保留 `//` 行注释和分组注释，因为 VS Code 会按 JSONC 解析该文件。
- 模板顶部说明必须优先使用 `//` 行注释。
- 不要用外层 `/* ... */` 块注释包裹包含 `/* */`、`*/`、代码片段或注释语法示例的说明文本；这会提前结束块注释并造成语法错误。
- 写入目标项目后，必须用 JSONC parser 验证 `.vscode/extensions.json`，不能只依赖 VS Code 目测。
```

### 3.2 在 settings.json 或验证章节补充 Prettier 兼容要求

如果目标项目的格式化命令会覆盖 `.vscode/extensions.json`，例如：

```json
{
	"scripts": {
		"format": "prettier --write '**/*.{js,ts,json,md}'"
	}
}
```

并且 `.vscode/extensions.json` 保留了注释，则必须确保 Prettier 按 `jsonc` 解析该文件。优先在目标项目的 `prettier.config.mjs` 中追加 override：

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

如果目标项目没有 Prettier 配置，或者格式化命令不会匹配 `.vscode/extensions.json`，也应在最终反馈中说明是否需要该兼容项。不要无声跳过判断。

### 3.3 在验证章节增加命令

在 `SKILL.md` 的验证步骤中加入以下检查命令。执行 AI 可以根据项目包管理器调整命令，但必须覆盖同等验证。

```bash
pnpm exec prettier --parser jsonc --check .vscode/extensions.json
```

如果目标项目使用项目级 Prettier 配置，还要运行：

```bash
pnpm exec prettier --check .vscode/extensions.json
```

如果项目的格式化命令会覆盖 JSON 文件，还要运行：

```bash
pnpm format
```

如果 `pnpm format` 会触碰大量历史文件，至少应先运行针对 `.vscode/extensions.json` 和本轮配置文件的窄范围检查，并在交付说明中明确全量格式化未执行的原因。

## 4. 推荐执行步骤

1. 定位全局 `init-vscode` skill 目录。
2. 读取 `templates/extensions.json`，确认是否存在外层块注释和字面量 `*/`。
3. 将顶部块注释改为 `//` 行注释，保留原有说明含义。
4. 保留推荐扩展列表内的分组注释和用途注释。
5. 更新 `SKILL.md`，补充 JSONC 语法安全要求、Prettier `jsonc` override 判断逻辑和验证命令。
6. 对模板文件运行 JSONC/Prettier 检查。
7. 在一个临时目标项目中模拟使用 `init-vscode`：复制模板到 `.vscode/extensions.json`，如果目标项目格式化 `*.json`，补 `prettier.config.mjs` override，再运行验证命令。

## 5. 验收标准

完成修复后，应满足以下条件：

- `templates/extensions.json` 仍保留说明注释和扩展分组注释。
- 文件中不存在会被内部 `*/` 截断的外层块注释。
- `pnpm exec prettier --parser jsonc --check templates/extensions.json` 通过。
- 目标项目中的 `.vscode/extensions.json` 不再被 VS Code 标记语法错误。
- 目标项目运行 `pnpm exec prettier --check .vscode/extensions.json` 通过，或已明确说明项目没有 Prettier 配置且使用了等价 JSONC 验证。
- `SKILL.md` 明确告诉后续 AI：保留注释时必须处理 JSONC 与 Prettier 兼容，不允许直接删除注释规避问题。

## 6. 常见错误

### 6.1 直接删除所有注释

这是不合格修复。删除注释能让 JSON 通过，但会丢失模板的可维护性和扩展分组说明。正确做法是改成安全的 `//` 注释。

### 6.2 只修模板，不修 `SKILL.md`

这是不完整修复。后续 AI 仍可能在合并、重写或重新生成模板时再次引入块注释问题，也可能忘记给目标项目补 Prettier JSONC override。

### 6.3 只运行 JSON 解析检查

普通 `JSON.parse` 不支持注释，不能用于验证保留注释的 `extensions.json`。应使用 JSONC parser 或 Prettier 的 `jsonc` parser。

### 6.4 在目标项目无脑追加 Prettier override

如果项目没有 Prettier，或 `.vscode/extensions.json` 不会进入格式化范围，强行改 Prettier 配置可能制造无关改动。正确做法是先检查目标项目是否存在 Prettier 配置和 format 脚本，再决定是否添加 override。

## 7. 建议交付说明模板

其他 AI 完成修复后，可以按下面格式回复：

```markdown
已加固全局 `init-vscode` skill：

- 修复 `templates/extensions.json`：顶部说明从易出错的块注释改为 JSONC 行注释，保留扩展分组和用途注释。
- 更新 `SKILL.md`：新增 JSONC 注释安全要求、目标项目 Prettier `jsonc` override 判断逻辑和验证命令。
- 验证：`pnpm exec prettier --parser jsonc --check templates/extensions.json` 通过。

注意：如果目标项目的 format 会匹配 `.vscode/extensions.json`，落地该 skill 时还需要在目标项目 Prettier 配置中为 `.vscode/extensions.json` 指定 `parser: "jsonc"`。
```
