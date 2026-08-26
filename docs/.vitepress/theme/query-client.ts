import type { App } from "vue";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";

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

export function installTodoQuery(app: App): void {
	app.use(VueQueryPlugin, { queryClient: createTodoQueryClient() });
}
