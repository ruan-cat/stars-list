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
const generatedAt = computed(() => {
	const value = props.artifact?.generatedAt;
	if (!value) return "";
	return new Intl.DateTimeFormat("zh-CN", {
		timeZone: "Asia/Shanghai",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	}).format(new Date(value));
});
const repositoryCounts = computed(() => {
	const repositories = props.artifact?.repositories ?? [];
	return {
		skipped: repositories.filter((repository) => repository.status === "skipped").length,
		unauthorized: repositories.filter((repository) => repository.status === "unauthorized").length,
		branchUnavailable: repositories.filter((repository) => repository.status === "branch_unavailable").length,
		failed: repositories.filter((repository) => repository.status === "failed").length,
	};
});
function count(nodes: TodoTreeNode[]): number {
	return nodes.reduce((sum, node) => sum + (node.type === "todo" ? 1 : count(node.children ?? [])), 0);
}
</script>
<template>
	<div class="flex flex-wrap gap-4 py-2.5 text-[0.82rem] text-muted-foreground">
		<template v-if="artifact">
			<span
				><strong class="font-semibold text-primary">{{ visible }}</strong> 可见 TODO</span
			>
			<span>{{ artifact.summary.repositoryCount }} 个仓库</span>
			<span>已扫描 {{ artifact.summary.scannedRepositoryCount }}</span>
			<span>已跳过 {{ repositoryCounts.skipped }}</span>
			<span>未授权 {{ repositoryCounts.unauthorized }}</span>
			<span>分支不可用 {{ repositoryCounts.branchUnavailable }}</span>
			<span>失败 {{ repositoryCounts.failed }}</span>
			<span>错误 {{ artifact.summary.errorCount }}</span>
			<span>扫描状态 {{ artifact.scan.completeness }}</span>
			<span>生成于 {{ generatedAt }}</span>
		</template>
		<span v-else-if="isLoading" role="status" aria-live="polite">正在加载 TODO 数据…</span>
		<span v-else-if="error" role="alert">TODO 数据加载失败：{{ error.message }}</span>
		<span v-else role="status">暂无 TODO 数据</span>
	</div>
</template>
