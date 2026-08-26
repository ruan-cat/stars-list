<script setup lang="ts">
import { computed } from "vue";
import type { TodoScanArtifact } from "../todo-artifact";
import type { TodoTreeNode } from "../todo-tree";
const props = defineProps<{
	artifact?: TodoScanArtifact;
	visibleTree: TodoTreeNode[];
	isLoading: boolean;
	error: Error | null;
}>();
const visible = computed(() => count(props.visibleTree));
function count(nodes: TodoTreeNode[]): number {
	return nodes.reduce((sum, node) => sum + (node.type === "todo" ? 1 : count(node.children ?? [])), 0);
}
</script>
<template>
	<div class="todo-status">
		<span
			><strong>{{ visible }}</strong> 可见 TODO</span
		><span>{{ artifact?.summary.repositoryCount ?? 0 }} 个仓库</span
		><span>{{ artifact?.scan.completeness ?? (isLoading ? "loading" : error ? "error" : "empty") }}</span
		><span v-if="artifact">生成于 {{ new Date(artifact.generatedAt).toLocaleString() }}</span>
	</div>
</template>

<style scoped>
.todo-status {
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	color: var(--vp-c-text-2);
	font-size: 0.82rem;
	padding: 0.65rem 0;
}
.todo-status strong {
	color: var(--vp-c-brand-1);
}
</style>
