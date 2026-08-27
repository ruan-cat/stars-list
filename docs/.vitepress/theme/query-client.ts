import type { App } from "vue";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";

export const TODO_STALE_TIME = 30 * 60 * 1000;
export const TODO_GC_TIME = 7 * 24 * 60 * 60 * 1000;

export function createTodoQueryClient(isServer = typeof window === "undefined"): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: TODO_STALE_TIME,
				// TanStack Query 在 SSR 下默认使用 Infinity，避免为服务端缓存创建
				// 长生命周期 GC timer。浏览器端仍保留 7 天缓存窗口。
				gcTime: isServer ? Infinity : TODO_GC_TIME,
				refetchOnWindowFocus: false,
			},
		},
	});
}

export function installTodoQuery(app: App): void {
	app.use(VueQueryPlugin, { queryClient: createTodoQueryClient() });
}
