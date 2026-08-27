# 2026-08-27 GitHub Pages 构建完成后不退出事故报告

## 0. 摘要

本次事故的表面现象是：GitHub Pages workflow 已经完成 VitePress 页面构建，但工作流长期停留在构建阶段，无法继续执行 `configure-pages`、artifact 上传与 `deploy-pages`，最终一次生产 run 约 6 小时后才被取消。

最终确认的长期阻塞根因并不在 GitHub Pages，也不在 `actions/deploy-pages`，甚至不在 VitePress 的页面渲染本身，而是项目 TODO 页面使用的 TanStack Query 在 SSR 构建阶段创建了一个 **7 天的 Node.js GC 定时器**：

```text
idleTimeout: 604800000
hasRef: true
@tanstack/query-core
→ TimeoutManager.setTimeout
→ Query.scheduleGc
→ Query.fetch
```

`604800000ms = 7 * 24 * 60 * 60 * 1000`，与项目原先配置的 `TODO_GC_TIME` 完全一致。

因为该 `Timeout` 是 **ref'ed timer**，Node.js 事件循环认为仍有有效工作需要等待，因此即使 VitePress 已经打印：

```text
✓ rendering pages...
build complete in 42–60s.
```

Node 进程也不会自然退出。GitHub Actions 的 `run: pnpm run build` step 只能等待子进程退出，所以后续 Pages step 永远得不到执行机会。

正式修复为：

```ts
gcTime: isServer ? Infinity : TODO_GC_TIME;
```

即浏览器仍保留 7 天缓存策略，SSR 恢复 TanStack Query 的安全默认语义，不创建长期 GC timer。

修复后通过 Node 22 / Node 24 双版本 fresh GitHub Actions、事件循环 7 秒审计、Pages artifact 上传与 artifact 解包检查完成验证。

---

## 1. 影响范围

### 1.1 用户可见影响

- GitHub Pages 自动部署无法继续。
- Actions UI 长时间显示 workflow 仍在运行。
- 从表面看像是“build 已经完成，deploy 卡死”。
- 运行占用 GitHub Actions runner 时间，直到人工取消或平台超时。

### 1.2 技术影响

本次阻塞发生在：

```text
pnpm run build
→ pnpm docs:build-in-github-page
→ vitepress build docs --base=/stars-list/
```

因此：

```text
VitePress build
✓ client bundle
✓ server bundle
✓ render pages
✓ build complete
↓
Node event loop 仍有 ref'ed Timeout
↓
shell process 不退出
↓
GitHub Actions build step 不结束
↓
configure-pages 无法开始
↓
upload-pages-artifact 无法开始
↓
deploy-pages 无法开始
```

这也是为什么最初把问题描述成“部署工作流不继续执行”是合理的用户视角描述，但技术根因必须向前追到 build 进程生命周期。

---

## 2. 事故前配置背景

项目新增了 GitHub TODO Explorer 页面，并使用 TanStack Vue Query 获取 TODO artifact。

`docs/.vitepress/theme/query-client.ts` 原配置：

```ts
export const TODO_STALE_TIME = 30 * 60 * 1000;
export const TODO_GC_TIME = 7 * 24 * 60 * 60 * 1000;

export function createTodoQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: TODO_STALE_TIME,
				gcTime: TODO_GC_TIME,
				refetchOnWindowFocus: false,
			},
		},
	});
}
```

这段配置从浏览器视角是合理的：TODO artifact 不需要频繁清理，希望缓存窗口较长。

问题在于同一个 QueryClient 工厂同时被 VitePress SSR 使用。

主题入口：

```ts
export default defineRuancatPresetTheme({
	enhanceAppCallBack({ app }) {
		installTodoQuery(app);
	},
});
```

而 `docs/todos.md` 会在静态构建时渲染：

```md
<TodoDashboard />
```

`TodoDashboard.vue` 的 setup 阶段直接调用：

```ts
const query = useTodoArtifactQuery();
const refresh = useTodoArtifactRefresh();
```

因此客户端数据查询代码实际上参与了 VitePress SSR / SSG 构建生命周期。

---

## 3. 为什么一个“7 天 GC 定时器”能导致如此严重的故障

这是本次事故最重要的机制解释。

### 3.1 `gcTime` 不只是一个抽象缓存数字

TanStack Query 的 `gcTime` 表示 inactive query 在缓存中保留多久后执行垃圾回收。

在浏览器中，设置：

```ts
gcTime: 604800000;
```

通常意味着：一个 query 不再被组件使用后，保留 7 天再清理。

但是在 Node.js SSR/SSG 中，这个行为需要某种调度机制实现。TanStack Query 会通过 timeout manager 调用 Node 的 `setTimeout()` 安排未来 GC。

于是一个看起来只是“缓存策略”的值，实际上变成了真实事件循环资源：

```text
setTimeout(callback, 604800000)
```

### 3.2 Node.js 的 ref'ed timer 会阻止进程退出

Node.js 不会仅因为主函数已经返回就立刻退出。

进程退出的基本前提是：事件循环已经没有需要继续处理的活动资源。

普通 `setTimeout()` 默认是 ref'ed：

```text
hasRef() === true
```

只要这个 timer 存在，Node 会认为：

> 未来仍有 callback 需要执行，因此进程必须继续活着。

本次诊断抓到的 timer：

```text
idleTimeout: 604800000
hasRef: true
repeat: null
```

意味着 Node 理论上愿意等待 **7 天** 才执行这个 GC callback。

GitHub Actions 当然不会真的运行 7 天，而会先受到 workflow/job/platform timeout 或人工取消，因此用户看到的是“卡了几小时”。

### 3.3 VitePress 的 `build complete` 只说明 build Promise 完成，不代表 Node 事件循环为空

VitePress 输出：

```text
build complete in 53.95s.
```

说明：

- bundle 已完成；
- 页面已完成 SSR render；
- VitePress `build()` 的主要异步逻辑已经 resolve。

它并不保证第三方组件、插件、数据层或用户代码没有留下：

- Timeout
- Interval
- Socket
- Worker
- MessagePort
- watcher
- open file handle

因此：

```text
“程序逻辑完成” ≠ “Node 进程可以退出”
```

这是本次事故最容易被忽略的核心概念。

### 3.4 为什么 TanStack Query 的 SSR 默认值反而是 `Infinity`

这点非常反直觉。

很多开发者会理解：

```text
Infinity = 永远不清理 = 更危险
```

但对于 TanStack Query 的 SSR 生命周期，官方默认 `gcTime = Infinity` 的重要效果之一是：**不安排主动 GC timeout**。

请求或静态构建结束后，整个 QueryClient/进程对象自然失去引用并由 JavaScript runtime 回收，不需要创建一个“未来某个时刻再清理”的 timer。

TanStack Query 官方文档明确说明：

- `gcTime` 默认浏览器约 5 分钟；
- SSR 环境默认 `Infinity`；
- 如果服务端显式设置 non-Infinity `gcTime`，调用方要负责及时清理 cache；
- 测试文档也特别建议在 Node/Jest 中使用 `gcTime: Infinity`，避免“测试完成但进程不退出”的现象。

官方参考：

- https://tanstack.com/query/latest/docs/framework/vue/guides/ssr
- https://tanstack.com/query/latest/docs/framework/react/reference/useQuery
- https://tanstack.com/query/latest/docs/framework/react/guides/testing

因此本项目的问题不是 TanStack Query 默认行为失效，而是我们用一个全局默认配置把浏览器的有限 `gcTime` 强行覆盖到了 SSR。

---

## 4. 事故排查时间线与决策链

本节只记录关键决策链，不记录每一条低价值命令。

### 阶段 A：先纠正“Pages deploy 卡死”的初始假设

最初 UI 表现是 build 看似结束、后续部署不继续。

读取 GitHub Actions step 状态后发现：

```text
checkout            success
pnpm setup          success
install             success
build               cancelled / 长期 in_progress
configure-pages     skipped / 未开始
upload artifact     skipped / 未开始
deploy-pages        skipped / 未开始
```

因此第一个重要结论是：

> Pages deploy 根本没有开始。真正卡住的是 `pnpm run build` 没有退出。

这一步避免了错误修改 `actions/deploy-pages`。

### 阶段 B：整理 Node/pnpm workflow，但证明它不是根因

原 workflow 存在：

- `pnpm/action-setup` 使用 `run_install: true`；
- `setup-node` 之前发生依赖安装；
- 后面又重复 `pnpm install`。

将初始化顺序整理为：

```text
actions/checkout
→ pnpm/action-setup
→ actions/setup-node
→ pnpm install --frozen-lockfile
→ pnpm run build
```

这是正确加固，但双版本 fresh CI 仍复现构建不能退出。

因此：

> workflow 初始化不规范是风险项，但不是本次 6 小时挂死的主因。

### 阶段 C：发现并修复独立的 VitePress SSR 模板插值错误

构建日志曾出现：

```text
Cannot read properties of undefined (reading 'GITHUB_TOKEN')
```

定位到 Markdown：

```md
`GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}`
```

VitePress Markdown 最终编译为 Vue SSR 模板，`{{ secrets.GITHUB_TOKEN }}` 被当作 Vue 插值执行。

修复：

```html
<code v-pre>GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}</code>
```

修复后构建能够稳定达到：

```text
✓ rendering pages...
build complete
```

但进程仍不退出。

这证明它是第二个真实 bug，却仍不是长期挂死根因。

### 阶段 D：建立硬超时，确认是“build complete 后事件循环不退出”

临时 PR #5 为 Node 22.22.0 / Node 24.18.0 设置 150 秒、后缩短为 100 秒保护窗口。

日志表现：

```text
✓ rendering pages...
build complete in ~42s.

# 之后长期无输出

exit code 124
```

于是问题从“构建慢”正式转换为：

> VitePress build 已结束，但 Node.js 进程内仍有 active resource。

### 阶段 E：第一次 active resource 采样，发现 Timeout

用程序化方式调用：

```js
const { build } = await import("vitepress");
await build("docs", { base: "/stars-list/" });
console.log(process.getActiveResourcesInfo());
```

确认 `build()` Promise 确实能够返回，但返回后存在 `Timeout`。

### 阶段 F：`async_hooks` 抓到 Teek 100ms timer，但没有草率结案

通过 `async_hooks` 记录 `Timeout` 创建堆栈，首先抓到：

```text
setTimeout
→ useDebounce
→ useWindowSize
→ usePopoverSize
→ Popover setup
```

对应依赖：

```text
vitepress-theme-teek@1.5.5
```

Teek 的 `useWindowSize()` 在 SSR 中先执行 debounce `update()` 创建 100ms timer，callback 内才判断 `!isClient`。

这是实际存在的 SSR 不理想行为，但有一个关键矛盾：

```text
100ms timer 不可能解释 150 秒或 6 小时挂死。
```

因此继续延长观察窗口，而没有把第一个可疑 timer 当成根因。

### 阶段 G：7 秒观察窗口抓到真正长期资源

让 `build()` 完成后继续运行 7 秒，使：

- 100ms Teek debounce timer 消失；
- 4s Undici 等短网络 timer 消失。

随后只检查仍存活且 `hasRef=true` 的 Timeout。

得到决定性日志：

```text
DIAG_RESOURCES_AFTER_7S ["PipeWrap","PipeWrap","Timeout"]

DIAG_LONG_LIVED_TIMEOUT {
  "idleTimeout": 604800000,
  "hasRef": true,
  "stack":
    "@tanstack/query-core/.../timeoutManager.js
     → TimeoutManager.setTimeout
     → Query.scheduleGc
     → Query.fetch"
}
```

此时根因被锁定。

### 阶段 H：源码与运行时数值对齐

搜索项目 QueryClient 配置：

```ts
export const TODO_GC_TIME = 7 * 24 * 60 * 60 * 1000;
```

计算：

```text
7 × 24 × 60 × 60 × 1000
= 604800000
```

与 active timer 完全一致。

这是非常强的因果证据：

```text
源码配置值
===
运行时 timer 值
```

### 阶段 I：修复 SSR / browser 配置分流

最终代码：

```ts
export function createTodoQueryClient(isServer = typeof window === "undefined"): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: TODO_STALE_TIME,
				gcTime: isServer ? Infinity : TODO_GC_TIME,
				refetchOnWindowFocus: false,
			},
		},
	});
}
```

浏览器行为没有被降级。

### 阶段 J：A/B 验证闭环

修复前：

```text
DIAG_LONG_LIVED_TIMEOUT_COUNT 1
idleTimeout 604800000
hasRef true
```

修复后：

```text
build complete in 58.19s.
DIAG_RESOURCES_AFTER_7S ["PipeWrap","PipeWrap"]
DIAG_LONG_LIVED_TIMEOUT_COUNT 0
DIAG_EVENT_LOOP_AUDIT_OK
```

形成完整 A/B 证据链。

---

## 5. 正式修复内容

### 5.1 QueryClient SSR GC 策略

修复核心：

```ts
gcTime: isServer ? Infinity : TODO_GC_TIME;
```

设计原则：

- Client：继续使用 7 天缓存，满足 UI 使用体验。
- SSR：不创建有限 GC timer，避免服务端/CLI 生命周期被 timer 保活。

### 5.2 回归测试

新增/调整 QueryClient 测试，明确验证：

```text
browser → gcTime = 7 days
server  → gcTime = Infinity
```

同时验证 Vue Query 仍能正常 install。

### 5.3 GitHub Actions 初始化加固

统一为：

```text
pnpm/action-setup
→ actions/setup-node
→ pnpm install --frozen-lockfile
```

删除：

- `run_install: true`
- setup-node 前的额外 install
- 第二次重复 install

这不是主根因，但能减少环境状态不一致。

### 5.4 VitePress GitHub Actions 示例转义

使用：

```html
<code v-pre>GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}</code>
```

避免 Markdown 中的 GitHub Actions 模板语法与 Vue 插值语法冲突。

---

## 6. 验证证据

### 6.1 Node 双版本自然退出

临时 PR：#5

验证矩阵：

| 环境         | QueryClient tests | VitePress build | 自然退出 |
| ------------ | ----------------- | --------------- | -------- |
| Node 22.22.0 | success           | success         | success  |
| Node 24.18.0 | success           | success         | success  |

Node 24 日志：

```text
✓ rendering pages...
build complete in 53.95s.
# 随后直接进入 Post job cleanup
```

保护性的 100 秒 `timeout` 没有触发。

### 6.2 修复后事件循环审计

GitHub Actions run：`33071235360`

关键结果：

```text
build complete in 58.19s.
DIAG_BUILD_PROMISE_RETURNED
DIAG_RESOURCES_AFTER_7S ["PipeWrap","PipeWrap"]
DIAG_LONG_LIVED_TIMEOUT_COUNT 0
DIAG_EVENT_LOOP_AUDIT_OK
```

`PipeWrap` 对应 Actions stdout/stderr，不会像 7 天 timer 一样阻止预期退出。

### 6.3 Pages artifact 链路

GitHub Actions run：`33070909174`

以下 step 均成功：

```text
pnpm run build
→ actions/configure-pages@v6
→ actions/upload-pages-artifact@v5
```

真实 artifact：

```text
name: github-pages
id: 9645764782
size: 6,054,937 bytes
digest: sha256:608cb08fc7030bf94247d8f052f8e62eb4da555a218811c1b045568be3061189
expired: false
```

下载解包后：

```text
868 entries
200 HTML pages
index.html
todos.html
assets/
artifacts/github-todos/ruan-cat.json
```

因此从源码到 Pages 可上传静态工件的链路已经验证。

`actions/deploy-pages` 未在测试 PR 执行，因为会写真实 `github-pages` environment 并可能覆盖线上站点；该动作留给正式发布流程。

---

## 7. 为什么这个问题容易在别的项目再次出现

结论需要区分“机制具有普适性”和“默认配置是否容易踩中”。

### 7.1 不是所有 TanStack Query SSR 项目都会中招

TanStack Query 当前官方默认行为已经考虑 SSR：

```text
SSR gcTime defaults to Infinity
```

因此**如果项目不显式覆盖服务端 `gcTime`，通常不会因为 TanStack Query 自身默认 GC timer 导致这一类退出问题**。

本事故的风险来自：

> 把适合浏览器的有限长期缓存配置，作为 QueryClient 全局默认值，同时复用于 SSR。

### 7.2 但这个错误模式非常容易被复制

以下代码在很多项目里看起来很自然：

```ts
new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 30 * 60 * 1000,
			gcTime: 7 * 24 * 60 * 60 * 1000,
		},
	},
});
```

如果开发者的思维模型只是“这是我的缓存配置”，很容易忽略：

```text
同一个 QueryClient factory 是否也在服务器执行？
```

尤其在这些框架中风险明显：

- Next.js SSR / SSG
- Nuxt SSR / prerender
- VitePress / VuePress 静态构建
- Astro SSR/SSG 中集成 QueryClient
- 自定义 Vite/Node SSR
- Node CLI 预渲染
- Storybook/测试 runner 中执行 QueryClient
- Jest/Vitest/tsx 等要求测试进程自动退出的场景

### 7.3 不同运行形态下故障表现不同

#### A. 静态构建 / CLI / 测试

风险最高、症状最明显：

```text
业务逻辑完成
→ timer 仍有 ref
→ 进程不退出
→ CI 卡死
```

本次 VitePress 就属于这一类。

TanStack Query 官方测试文档专门提到在 Jest 场景可使用 `gcTime: Infinity` 来避免测试结束后进程不退出，这说明“有限 gcTime 与 Node 进程生命周期冲突”不是 VitePress 特有机制。

#### B. 常驻 SSR server

server 本来就不应该退出，因此用户未必看到“挂死”。

但会有另一类风险：

```text
每个 request 创建 QueryClient
→ inactive queries 按 gcTime 留在内存
→ 大量 request 的 cache 长期保留
→ 内存压力增大
```

TanStack Query 官方 SSR 文档也明确警告：如果服务端显式设置 non-Infinity `gcTime`，调用方需要负责及时清理 query cache。

所以同一个配置错误，在不同部署模型下表现不同：

| 场景                  | 主要症状                              |
| --------------------- | ------------------------------------- |
| VitePress/SSG CLI     | build 完成但进程不退出                |
| Jest/Vitest/Node test | tests completed but runner hangs      |
| Serverless SSR        | invocation 生命周期延迟或资源滞留风险 |
| 常驻 Node SSR server  | query cache 长期保留、内存压力        |
| Browser SPA           | 通常就是正常缓存策略                  |

### 7.4 风险条件矩阵

只有多个条件同时满足时，才容易出现本事故同类问题：

| 条件                                  | 风险贡献       |
| ------------------------------------- | -------------- |
| SSR/SSG/Node 环境真实执行 Query       | 必要条件       |
| 显式设置有限 `gcTime`                 | 高             |
| `gcTime` 很长（小时/天）              | 极高           |
| Query 进入 inactive 并 schedule GC    | 必要触发路径   |
| timer 保持 ref                        | Node 默认行为  |
| 没有 `queryClient.clear()` 或显式清理 | 高             |
| 运行形态要求进程自动退出              | 会变成 CI 卡死 |

因此这不是“TanStack Query 一用 SSR 就危险”，而是一个**非常具体但很容易因共享配置而复制的生命周期错误**。

---

## 8. 如何提前预防

### 8.1 QueryClient 必须区分 server/client 生命周期

推荐：

```ts
const isServer = typeof window === "undefined";

new QueryClient({
	defaultOptions: {
		queries: {
			gcTime: isServer ? Infinity : CLIENT_GC_TIME,
		},
	},
});
```

如果框架提供 per-request QueryClient，则保证请求结束后生命周期明确。

### 8.2 如果服务端一定要有限 `gcTime`

不要只设置数字。

必须明确回答：

```text
谁负责 clear？
什么时候 clear？
是否在 dehydrate 后清理？
是否会影响 hydration？
```

例如在服务端请求处理完成后：

```ts
queryClient.clear();
```

具体时机要结合框架 hydration/dehydrate 生命周期。

### 8.3 在 CI 中加入“自然退出”测试

构建成功不应只检查：

```text
build complete
```

还应检查命令本身在合理时间内退出：

```bash
timeout 100s pnpm run build
```

如果 VitePress 平时 60 秒内完成，则 100–150 秒保护窗口能够快速暴露“完成但不退出”。

### 8.4 遇到 Node 退出问题时的标准诊断路径

第一层：

```js
process.getActiveResourcesInfo();
```

确认资源类型。

第二层：

```js
process._getActiveHandles();
```

辅助检查 socket/pipe 等 handle。

第三层：

```js
async_hooks.createHook({ init, destroy });
```

记录 Timeout 等资源的创建堆栈。

第四层：加入观察窗口：

```text
build returned
→ wait 5–10s
→ 再检查 hasRef=true 资源
```

这样可以避免把 100ms debounce 等短 timer 当成最终根因。

---

## 9. 本次排查中哪些方法最有效

### 9.1 GitHub Actions step 状态比 UI 进度更可信

最早的关键纠偏来自：

```text
build step 没结束
deploy step 根本没开始
```

这是本事故最重要的第一条可信信号。

### 9.2 Node 22 / 24 双版本矩阵快速排除运行时版本假设

两个版本出现相同行为，使问题迅速从 Node 版本兼容转向项目代码/依赖生命周期。

### 9.3 “Promise 已返回”与“进程未退出”分开验证

通过直接：

```js
await build(...)
console.log("BUILD_PROMISE_RETURNED")
```

证明 VitePress API 已经 resolve。

这一步非常关键，因为 CLI 黑盒日志只能看到“build complete”。

### 9.4 `async_hooks` + 延迟观察窗口最终定位

如果只在 build 返回瞬间采样，会看到大量短 timer，噪音很大。

等待 7 秒后只留下：

```text
604800000ms TanStack Query timer
```

大幅提高信噪比。

### 9.5 数值对齐是最终强证据

```text
runtime idleTimeout = 604800000
source TODO_GC_TIME = 604800000
```

比“堆栈看起来像 TanStack”更强。

---

## 10. 本次不应采用的修复

### 10.1 不应在 build 后加 `process.exit(0)`

这种做法会让 workflow 看起来恢复，但有严重问题：

- 隐藏真正 active resource；
- 可能截断插件异步收尾；
- 未来新增资源泄漏也会被掩盖；
- build exit code 的语义被人为覆盖。

本次 `process.exit(0)` 只在诊断进程中使用，用来确保采样程序可结束，从未进入正式 PR。

### 10.2 不应先改 `deploy-pages`

部署 action 没有运行就不可能是本次主根因。

### 10.3 不应因为 Teek 100ms timer 有缺陷就停止排查

它是独立值得上游修复的问题，但不是数小时阻塞源。

---

## 11. 后续行动建议

### 仓库内

1. 保留 `createTodoQueryClient(isServer)` 的 server/client 回归测试。
2. 以后修改 TODO cache 策略时同时审查 SSR 语义。
3. Pages workflow 保持单次 deterministic install。
4. 如果未来再次出现 `build complete` 后不退出，优先复用本报告的 active-resource 诊断方式。

### 上游依赖

可以另行考虑向 `vitepress-theme-teek` 报告：

```text
useWindowSize()
→ SSR 中无条件触发 debounce update
→ 创建 100ms Timeout 后 callback 才判断 isClient
```

这不是本次主故障，但从 SSR 纯度和性能角度值得优化为“服务端不创建 timer”。

### 发布验证

主 PR 合并进入正式 `main` 发布流程后，应确认：

```text
build
→ configure-pages
→ upload-pages-artifact
→ deploy-pages
→ github-pages URL
```

全部成功。

当前测试已经验证到 artifact 上传，未从临时 PR 覆盖真实线上 Pages environment。

---

## 12. 最终结论

本次事故可以浓缩为一句话：

> 浏览器端合理的 7 天 TanStack Query `gcTime` 被无条件复用到了 VitePress SSR，TanStack Query 为 inactive query 创建了一个默认 ref'ed 的 7 天 Node `Timeout`；VitePress 虽然完成构建，但 Node 事件循环因此无法退出，最终把 GitHub Actions build step 和整个 Pages 部署链路一起阻塞。

最重要的长期教训不是“不要使用长缓存”，而是：

> **浏览器缓存生命周期与 SSR/CLI 进程生命周期必须分开设计。任何会创建 timer、socket、watcher 或后台任务的客户端配置，都不能默认认为可以安全复用于服务端构建。**
