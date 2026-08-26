import { computed } from "vue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { fetchTodoArtifact, resolveArtifactUrl, type TodoScanArtifact, type TodoArtifactError } from "./todo-artifact";

export const TODO_QUERY_KEY = ["github-todo-artifact"] as const;

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
	const mutation = useMutation({
		mutationFn: () =>
			client.fetchQuery({
				queryKey: [...TODO_QUERY_KEY, url],
				queryFn: ({ signal }) => fetchTodoArtifact(url, signal),
				staleTime: 0,
			}),
		onSuccess: (data) => client.setQueryData([...TODO_QUERY_KEY, url], data),
	});
	return {
		mutate: () => mutation.mutate(),
		isPending: computed(() => mutation.isPending.value),
		cancel: () => client.cancelQueries({ queryKey: [...TODO_QUERY_KEY, url] }),
	};
}
