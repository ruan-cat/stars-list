# 2026-08-27 TanStack Query SSR GC 定时器阻塞 VitePress 构建退出

## 1. 问题现象

- GitHub Pages workflow 的 `pnpm run build` 已经打印 VitePress `build complete`，但该 step 始终不结束，后续 `actions/configure-pages`、`actions/upload-pages-artifact`、`actions/deploy-pages` 全部无法开始。
- 生产 Actions 最终可持续卡住数小时；本次事故中曾出现约 6 小时后才被取消的 run，因此 UI 很容易让人误判成“Pages 部署阶段卡死”。
- 在排查过程中还发现 `docs/prompts/index.md` 中直接展示 `${{ secrets.GITHUB_TOKEN }}` 会被 VitePress/Vue SSR 当成模板插值执行，产生独立的 `Cannot read properties of undefined (reading 'GITHUB_TOKEN')` 错误；修掉该错误后，真正的“build complete 后不退出”问题才稳定暴露。
- 同一问题在 Node 22.22.0 与 Node 24.18.0 都能复现，说明它不是单个 Node 主版本的偶发兼容故障。

## 2. 实际根因

项目在 `docs/.vitepress/theme/query-client.ts` 中把浏览器端缓存策略全局应用给了 SSR：

```ts
export const TODO_GC_TIME = 7 * 24 * 60 * 60 * 1000;

new QueryClient({
	defaultOptions: {
		queries: {
			gcTime: TODO_GC_TIME,
		},
	},
});
```

- `docs/todos.md` 在 VitePress SSR 时会渲染 `TodoDashboard`，组件中的 `useTodoArtifactQuery()` 会触发 TanStack Query。查询在 SSR 生命周期中进入 inactive/GC 调度路径后，`@tanstack/query-core` 调用 `Query.scheduleGc()`，通过 `TimeoutManager.setTimeout()` 创建一个 `604800000ms`（7 天）的 Node `Timeout`。
- 这个 timer 的 `hasRef()` 为 `true`。对 Node.js 来说，只要事件循环里仍有 ref'ed timer，进程就不能自然退出；即使 VitePress 的 `build()` Promise 已经返回、所有 HTML 都已生成，CLI 进程仍会等待这个 7 天 timer。
- GitHub Actions 的 shell step 只有在子进程退出后才会结束，因此 `pnpm run build` 会一直占住 job；Pages 配置、artifact 上传和部署步骤只能永远等待前一步完成。
- TanStack Query 在 SSR 环境本来默认 `gcTime = Infinity`。项目显式覆盖成有限的 7 天值，破坏了这个服务端安全默认语义。对于短生命周期 SSR/SSG/build CLI，`Infinity` 反而意味着“不创建 GC timer，由请求/进程生命周期回收”；有限的超长 `gcTime` 会真实创建 Node 定时器并保活事件循环。

## 3. 关键误导点

- **误把 UI 现象理解成 Pages deploy 卡死。** 实际 Actions 后端状态显示 `打包项目` step 未退出，`configure-pages` / `upload-pages-artifact` / `deploy-pages` 都是 skipped 或尚未开始。排查必须先看 job/step 状态，而不是只看页面进度条。
- **Node/pnpm 初始化顺序确实不规范，但不是长期挂死的根因。** 删除 `run_install: true`、去掉重复安装并把 `setup-node` 提前是正确加固，但双版本测试证明仅改 workflow 初始化后仍会卡在构建退出。
- **`GITHUB_TOKEN` 模板插值是独立真实 bug，但不是 6 小时挂死根因。** 修复后 VitePress 能正常打印 `build complete`，随后仍然不退出，说明需要继续追事件循环。
- **Teek 的 100ms SSR timer 是最强误导项。** `vitepress-theme-teek@1.5.5` 的 `usePopoverSize()` → `useWindowSize()` → debounce 会在 SSR 中先创建 100ms `setTimeout`，回调里才检查 `isClient`。这些 timer 确实不理想，但 7 秒后会自行消失，无法解释数小时挂死。
- 不应仅凭某个 active handle “看起来可疑”就宣布根因。必须延长观察窗口并记录创建堆栈，区分短生命周期 timer 与真正长期 ref'ed timer。

## 4. 有效修复

保留浏览器端 7 天缓存语义，但恢复 SSR 的安全 GC 策略：

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

- 为 `createTodoQueryClient` 增加 server/client 分支回归测试：浏览器 `gcTime` 必须仍是 7 天，SSR 必须是 `Infinity`，避免未来重构重新把浏览器缓存时长覆盖到服务端。
- 同时完成两项配套修复：Pages workflow 调整为 `pnpm/action-setup` → `actions/setup-node` → 单次 `pnpm install --frozen-lockfile`，移除 `run_install` 与重复安装；`docs/prompts/index.md` 用 `<code v-pre>...</code>` 展示 GitHub Actions `${{ ... }}` 示例，避免 Vue SSR 求值。
- 没有使用 `process.exit(0)` 作为正式修复。强制退出只能掩盖仍存活的资源，可能截断插件收尾或隐藏未来泄漏；正式构建必须能够自然退出。

## 5. 验证方式

- 首个可信信号来自 fresh GitHub Actions：VitePress 明确输出 `build complete`，但 `pnpm run build` step 长时间仍处于 in_progress；这直接排除了“构建仍在渲染页面”的解释。
- 修复前通过 `async_hooks` 在 `build()` Promise 返回 7 秒后采样，确认唯一长期 ref'ed timer：

```text
idleTimeout: 604800000
hasRef: true
@tanstack/query-core/timeoutManager.js
→ Query.scheduleGc
→ Query.fetch
```

- 修复后 Node 22.22.0 与 Node 24.18.0 两个 fresh job 均通过 QueryClient 回归测试，并在 `pnpm run build` 打印 `build complete` 后自然退出为 success；100 秒保护 timeout 未触发。
- 修复后的 fresh `async_hooks` A/B 审计：

```text
build complete in 58.19s.
DIAG_RESOURCES_AFTER_7S ["PipeWrap","PipeWrap"]
DIAG_LONG_LIVED_TIMEOUT_COUNT 0
DIAG_EVENT_LOOP_AUDIT_OK
```

7 秒后只剩 GitHub Actions stdout/stderr 管道，不再存在 ref'ed Timeout。

- Pages 工件链路继续验证 `actions/configure-pages@v6` 与 `actions/upload-pages-artifact@v5` 均 success，并生成真实 `github-pages` artifact（ID 9645764782，6,054,937 bytes）；解包后包含 868 个条目、200 个 HTML 页面、`index.html`、`todos.html`、`assets/` 等预期内容。

## 6. 后续约束

- 任何 SSR/SSG/VitePress 构建中使用 TanStack Query 时，**不要把浏览器端有限 `gcTime` 无条件复用到服务端 QueryClient**。如果确实要设置有限服务端 `gcTime`，必须明确负责在请求/构建完成后 `queryClient.clear()` 或完成等价资源清理。
- 排查“命令已经打印完成但进程不退出”时，优先检查 Node 事件循环资源，而不是继续调构建性能：使用 `process.getActiveResourcesInfo()` 做粗筛，再用 `async_hooks` 记录 `Timeout` / socket 等资源的创建堆栈。
- 对 timer 泄漏必须设置观察窗口。100ms、4s 等短 timer 不能因为在 `build()` 返回瞬间仍存在就被认作根因；应等待足够时间后只关注仍 `hasRef=true` 的资源。
- 对 GitHub Actions 卡死，先读取 job step 的真实状态：若 build step 没退出，则不要优先修改 `deploy-pages`。UI 上“build 看似完成”不等于 shell 进程已 exit。
- SSR 与浏览器共享 QueryClient 工厂时必须有显式测试，至少覆盖 `gcTime`、retry/refetch 等会创建后台资源或改变生命周期的关键选项。
- 这类风险具有跨项目可复用性：Next.js/Nuxt/VitePress/自定义 SSR/SSG、Node CLI 预渲染以及测试进程，只要“服务端执行查询 + 显式有限且较长的 `gcTime` + 没有清理 QueryClient”，都可能出现内存保留或进程不退出。TanStack Query 的 SSR 默认 `Infinity` 正是为了避免服务端主动 GC timer；不要轻易覆盖这个默认值。
