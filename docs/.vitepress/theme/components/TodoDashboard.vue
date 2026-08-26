<script setup lang="ts">
import { computed, ref } from "vue";
import { LoaderCircle } from "lucide-vue-next";
import { useTodoArtifactQuery, useTodoArtifactRefresh } from "../use-todo-query";
import { buildTodoTree, filterTodoTree, type TodoFilters as TodoFilterState, type TodoTreeNode } from "../todo-tree";
import TodoFilters from "./TodoFilters.vue";
import TodoStatusBar from "./TodoStatusBar.vue";
import TodoTree from "./TodoTree.vue";
import TodoDetails from "./TodoDetails.vue";
import Button from "./ui/Button.vue";
import ResizableHandle from "./ui/ResizableHandle.vue";
import ResizablePanel from "./ui/ResizablePanel.vue";
import ResizablePanelGroup from "./ui/ResizablePanelGroup.vue";

const filters = ref<TodoFilterState>({ search: "", repo: "", branch: "", kind: "" });
const selectedId = ref<string | null>(null);
const expanded = ref<Set<string>>(new Set());
const query = useTodoArtifactQuery();
const refresh = useTodoArtifactRefresh();
const tree = computed(() => (query.data.value ? buildTodoTree(query.data.value) : []));
const visibleTree = computed(() => filterTodoTree(tree.value, filters.value));
const selected = computed(() => findNode(visibleTree.value, selectedId.value));
function findNode(nodes: TodoTreeNode[], id: string | null): TodoTreeNode | null {
	if (!id) return null;
	for (const node of nodes) {
		if (node.id === id) return node;
		const found = findNode(node.children ?? [], id);
		if (found) return found;
	}
	return null;
}
function select(id: string) {
	selectedId.value = id;
}
function toggle(id: string) {
	const next = new Set(expanded.value);
	if (next.has(id)) next.delete(id);
	else next.add(id);
	expanded.value = next;
}
</script>

<template>
	<section class="todo-dashboard" aria-label="GitHub TODO 浏览器">
		<header class="todo-dashboard__header">
			<div>
				<p class="todo-kicker">REPOSITORY EXPLORER</p>
				<h1>GitHub TODO Tree</h1>
				<p>按仓库、分支、目录和文件追踪待办。</p>
			</div>
			<Button :disabled="refresh.isPending.value" :aria-busy="refresh.isPending.value" @click="refresh.mutate()">
				<LoaderCircle v-if="refresh.isPending.value" class="todo-refresh__spinner" :size="15" aria-hidden="true" />
				{{ refresh.isPending.value ? "正在读取最新快照…" : "刷新快照" }}
			</Button>
		</header>
		<TodoFilters v-model="filters" :artifact="query.data.value" />
		<TodoStatusBar
			:artifact="query.data.value"
			:visible-tree="visibleTree"
			:is-loading="query.isLoading.value"
			:error="query.error.value"
		/>
		<div v-if="query.isLoading.value" class="todo-state">正在读取公开 TODO 快照…</div>
		<div v-else-if="query.error.value && !query.data.value" class="todo-state todo-state--error">
			无法读取快照：{{ query.error.value.message }}
		</div>
		<div v-else-if="!visibleTree.length" class="todo-state">当前筛选条件下没有 TODO。</div>
		<ResizablePanelGroup v-else direction="horizontal" auto-save-id="github-todo-panels" class="todo-layout">
			<ResizablePanel :default-size="38" :min-size="24" :max-size="56" class="todo-layout__tree-panel">
				<TodoTree
					:nodes="visibleTree"
					:expanded="expanded"
					:selected-id="selectedId"
					@select="select"
					@toggle="toggle"
				/>
			</ResizablePanel>
			<ResizableHandle />
			<ResizablePanel :default-size="62" :min-size="44" :max-size="76" class="todo-layout__details-panel">
				<TodoDetails :node="selected" />
			</ResizablePanel>
		</ResizablePanelGroup>
	</section>
</template>

<style scoped>
.todo-dashboard {
	max-width: 1440px;
	margin: 0 auto;
	color: var(--vp-c-text-1);
}
.todo-dashboard__header {
	display: flex;
	justify-content: space-between;
	gap: 1rem;
	align-items: flex-start;
	border-bottom: 1px solid var(--vp-c-divider);
	padding-bottom: 1.25rem;
}
.todo-dashboard h1,
.todo-dashboard h2,
.todo-dashboard p {
	color: var(--vp-c-text-1);
}
.todo-dashboard__header p:not(.todo-kicker) {
	color: var(--vp-c-text-2);
}
.todo-kicker {
	color: var(--vp-c-brand-1) !important;
	font-size: 0.7rem;
	font-weight: 700;
	letter-spacing: 0.12em;
	margin: 0 0 0.35rem;
}
.todo-refresh__spinner {
	animation: todo-spin 700ms linear infinite;
}
@keyframes todo-spin {
	to {
		transform: rotate(360deg);
	}
}
.todo-layout {
	display: flex;
	width: 100%;
	min-height: 480px;
	border: 1px solid var(--vp-c-divider);
	border-radius: 8px;
	overflow: hidden;
}
.todo-layout__tree-panel {
	min-width: 280px;
	background: var(--vp-c-bg-soft);
	overflow: hidden;
}
.todo-layout__details-panel {
	min-width: 360px;
	background: var(--vp-c-bg);
	overflow: auto;
}
.todo-state {
	color: var(--vp-c-text-2) !important;
	padding: 2rem;
	text-align: center;
	border: 1px dashed var(--vp-c-divider);
	border-radius: 8px;
}
.todo-state--error {
	color: var(--vp-c-danger-1) !important;
}
@media (max-width: 720px) {
	.todo-layout {
		display: block;
	}
	.todo-layout__tree-panel,
	.todo-layout__details-panel {
		width: 100% !important;
		min-width: 0;
	}
	:deep(.ui-resizable-handle) {
		display: none;
	}
}
@media (prefers-reduced-motion: reduce) {
	.todo-dashboard *,
	.todo-dashboard *::before,
	.todo-dashboard *::after {
		scroll-behavior: auto !important;
		transition: none !important;
	}
}
</style>
