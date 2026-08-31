import { computed } from "vue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { fetchTodoArtifact, resolveArtifactUrl, type TodoScanArtifact, type TodoArtifactError } from "./todo-artifact";

export const TODO_QUERY_KEY = ["github-todo-artifact"] as const;
export const MIN_REFRESH_INDICATOR_MS = 360;

/** 将并发调用合并到同一个 Promise，避免重复刷新产生并发 artifact 请求。 */
export function createSingleFlight<T>(task: () => Promise<T>): () => Promise<T> {
	let pending: Promise<T> | null = null;
	return () => {
		if (pending) return pending;
		pending = task().finally(() => {
			pending = null;
		});
		return pending;
	};
}

export async function withMinimumDuration<T>(
	startedAt: number,
	promise: Promise<T>,
	duration = MIN_REFRESH_INDICATOR_MS,
): Promise<T> {
	const result = await promise;
	const remaining = duration - (Date.now() - startedAt);
	if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
	return result;
}

export function useTodoArtifactQuery() {
	const url = resolveArtifactUrl(import.meta.env as Record<string, string | undefined>);
	return useQuery<TodoScanArtifact, TodoArtifactError>({
		queryKey: [...TODO_QUERY_KEY, url],
		queryFn: ({ signal }) => fetchTodoArtifact(url, signal),
		placeholderData: (previous) => previous,
	});
}

export function useTodoArtifactRefresh() {
	const client = useQueryClient();
	const url = resolveArtifactUrl(import.meta.env as Record<string, string | undefined>);
	const fetchLatest = createSingleFlight(() => {
		const startedAt = Date.now();
		return withMinimumDuration(
			startedAt,
			client.fetchQuery({
				queryKey: [...TODO_QUERY_KEY, url],
				queryFn: ({ signal }) => fetchTodoArtifact(url, signal),
				staleTime: 0,
			}),
		);
	});
	const mutation = useMutation({
		mutationFn: fetchLatest,
		onSuccess: (data) => client.setQueryData([...TODO_QUERY_KEY, url], data),
	});
	return {
		mutate: () => mutation.mutate(),
		isPending: computed(() => mutation.isPending.value),
		isSuccess: computed(() => mutation.isSuccess.value),
		error: computed(() => mutation.error.value),
		cancel: () => client.cancelQueries({ queryKey: [...TODO_QUERY_KEY, url] }),
	};
}
