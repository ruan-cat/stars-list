# development-guidelines Specification

## Purpose
TBD - created by archiving change add-topic-splitting-script. Update Purpose after archive.
## Requirements
### Requirement: 日志输出规范

系统 SHALL 确保所有 TypeScript 脚本使用 `consola.withTag` 方式创建 logger，并通过 logger 对象输出日志。

#### Scenario: 使用 consola.withTag 创建 logger

- **GIVEN** 一个需要日志输出的 TypeScript 脚本
- **WHEN** 创建 logger 时
- **THEN** 必须从 `package.json` 导入包名和版本
- **AND** 使用 `consola.withTag(packageName)` 创建 logger
- **AND** 所有日志输出都通过 logger 对象调用

#### Scenario: 日志起始输出

- **GIVEN** 脚本开始执行
- **WHEN** 调用主函数时
- **THEN** 必须输出包含包名、版本和功能的起始日志
- **AND** 日志格式应为：`[tag] ℹ packageName v{version} functionName is running...`

### Requirement: TypeScript 函数返回类型规范

系统 SHALL 要求所有 TypeScript 函数明确指定返回类型，主要导出函数包含 `@example` 注释。

#### Scenario: 函数声明返回类型

- **GIVEN** 一个 TypeScript 函数
- **WHEN** 编写函数时
- **THEN** 必须为函数添加明确的返回类型注解
- **AND** 无返回值的函数应标注为 `void`
- **AND** 返回数组的函数应明确指定数组元素类型

#### Scenario: 主要函数包含 @example 注释

- **GIVEN** 一个被导出的主函数
- **WHEN** 编写 JSDoc 注释时
- **THEN** 必须包含 `@example` 标签
- **AND** 示例应为简单的单行调用
- **AND** 不应包含冗长复杂的例子

### Requirement: TypeScript 代码风格规范

系统 SHALL 确保所有 TypeScript 脚本遵循统一的代码风格，包括引号使用、缩进和导入顺序。

#### Scenario: 使用双引号

- **GIVEN** 编写 TypeScript 代码
- **WHEN** 使用字符串时
- **THEN** 必须使用双引号 (`"`)
- **AND** 禁止使用单引号 (`'`)

#### Scenario: 使用制表符缩进

- **GIVEN** 编写 TypeScript 代码
- **WHEN** 进行代码缩进时
- **THEN** 必须使用制表符进行缩进
- **AND** 禁止使用空格进行缩进

#### Scenario: 正确的导入顺序

- **GIVEN** 编写导入语句
- **WHEN** 组织导入时
- **THEN** 应按以下顺序分组：
  - 1. Node.js 内置模块
  - 2. 第三方库
  - 3. 项目内部模块
- **AND** 不同组之间应有空行分隔

### Requirement: 脚本文件位置规范

系统 SHALL 规定脚本文件必须放置在指定目录，并使用规定的文件名。

#### Scenario: 脚本文件位置

- **GIVEN** 创建一个 TypeScript 脚本
- **WHEN** 确定文件位置时
- **THEN** 脚本文件必须放置在 `docs` 目录内
- **AND** 脚本文件名必须为 `split-topics.ts`

### Requirement: 依赖管理规范

系统 SHALL 确保脚本使用 `consola` 库进行日志输出，并在需要时安装依赖。

#### Scenario: consola 依赖检查

- **GIVEN** 创建一个使用 `consola` 的脚本
- **WHEN** 开始开发时
- **THEN** 应检查 `consola` 是否已安装：`pnpm list consola`
- **AND** 如未安装，执行 `pnpm add consola` 安装
- **AND** 验证安装成功后继续开发

### Requirement: 代码验证清单

系统 SHALL 提供代码验证清单，确保脚本符合所有开发规范要求。

#### Scenario: 验证日志规范

- **GIVEN** 完成脚本编写
- **WHEN** 进行代码审查时
- **THEN** 验证：
  - 使用 `consola.withTag(packageName)` 创建 logger
  - 使用 `logger.info()` 输出起始日志
  - 所有 consola 调用都通过 logger 对象
  - 日志消息使用英文

#### Scenario: 验证代码风格

- **GIVEN** 完成脚本编写
- **WHEN** 进行代码审查时
- **THEN** 验证：
  - 所有函数都有明确的 TypeScript 返回类型
  - 主要函数包含 `@example` 注释
  - 使用双引号而不是单引号
  - 使用制表符进行缩进
  - 导入顺序正确（内置 → 第三方 → 内部）
  - 脚本文件位于 `docs/` 目录下

