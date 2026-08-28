<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { FolderTree, List, LoaderCircle } from "lucide-vue-next";
import { useTodoArtifactQuery, useTodoArtifactRefresh } from "../use-todo-query";
import {
	buildTodoTree,
	filterTodoTree,
	flattenTodoTree,
	type TodoFilters as TodoFilterState,
	type TodoTreeNode,
} from "../todo-tree";
import TodoFilters from "./TodoFilters.vue";
import TodoStatusBar from "./TodoStatusBar.vue";
import TodoTree from "./TodoTree.vue";
import TodoFlatList from "./TodoFlatList.vue";
import TodoDetails from "./TodoDetails.vue";
import Button from "./ui/Button.vue";
import ResizableHandle from "./ui/ResizableHandle.vue";
import ResizablePanel from "./ui/ResizablePanel.vue";
import ResizablePanelGroup from "./ui/ResizablePanelGroup.vue";

const filters = ref<TodoFilterState>({ search: "", repo: "", branch: "", kind: "" });
const selectedId = ref<string | null>(null);
const expanded = ref<Set<string>>(new Set());
const viewMode = ref<"tree" | "flat">("tree");
const query = useTodoArtifactQuery();
const refresh = useTodoArtifactRefresh();
const tree = computed(() => (query.data.value ? buildTodoTree(query.data.value) : []));
const visibleTree = computed(() => filterTodoTree(tree.value, filters.value));
const flatRows = computed(() => flattenTodoTree(visibleTree.value));
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

/** 刷新成功后的短暂成功提示 */
const justRefreshed = ref(false);
let refreshFeedbackTimer: ReturnType<typeof setTimeout> | undefined;
watch(refresh.isSuccess, (success) => {
	if (!success) return;
	justRefreshed.value = true;
	clearTimeout(refreshFeedbackTimer);
	refreshFeedbackTimer = setTimeout(() => {
		justRefreshed.value = false;
	}, 2600);
});
onBeforeUnmount(() => clearTimeout(refreshFeedbackTimer));

/**
 * 布局面板的视口预留高度：状态栏底边到视口底部的距离 + 底部余量。
 * 以状态栏为锚点（它始终渲染且高度稳定），保证树/详情面板恰好占满首屏剩余空间，
 * 页面本身不再因 dashboard 产生滚动条；树与详情各自内部滚动。
 */
const layoutAnchorRef = ref<HTMLElement | null>(null);
const viewportReserve = ref(360);
function measureViewportReserve() {
	const el = layoutAnchorRef.value;
	if (!el || typeof window === "undefined") return;
	const anchorBottom = el.getBoundingClientRect().bottom + window.scrollY;
	viewportReserve.value = Math.round(anchorBottom + 24);
}
onMounted(() => {
	measureViewportReserve();
	window.addEventListener("resize", measureViewportReserve);
});
onBeforeUnmount(() => window.removeEventListener("resize", measureViewportReserve));
const layoutStyle = computed(() => ({ height: `calc(100dvh - ${viewportReserve.value}px)` }));
</script>

<template>
	<section class="todo-dashboard" aria-label="GitHub TODO 浏览器">
		<header class="todo-dashboard__header">
			<div>
				<p class="todo-kicker">REPOSITORY EXPLORER</p>
				<h1>GitHub TODO Tree</h1>
				<p>按仓库、分支、目录和文件追踪待办。</p>
			</div>
			<div class="todo-dashboard__actions">
				<p
					v-if="refresh.error.value"
					class="todo-refresh-feedback todo-refresh-feedback--error"
					role="alert"
					:title="refresh.error.value.message"
				>
					刷新失败：{{ refresh.error.value.message }}
				</p>
				<p v-else-if="justRefreshed" class="todo-refresh-feedback" role="status">快照已更新，数据为最新。</p>
				<div class="todo-view-toggle" role="group" aria-label="视图切换">
					<button
						type="button"
						:class="{ 'is-active': viewMode === 'tree' }"
						:aria-pressed="viewMode === 'tree'"
						@click="viewMode = 'tree'"
					>
						<FolderTree :size="15" aria-hidden="true" />树形
					</button>
					<button
						type="button"
						:class="{ 'is-active': viewMode === 'flat' }"
						:aria-pressed="viewMode === 'flat'"
						@click="viewMode = 'flat'"
					>
						<List :size="15" aria-hidden="true" />平铺
					</button>
				</div>
				<Button :disabled="refresh.isPending.value" :aria-busy="refresh.isPending.value" @click="refresh.mutate()">
					<LoaderCircle v-if="refresh.isPending.value" class="todo-refresh__spinner" :size="15" aria-hidden="true" />
					{{ refresh.isPending.value ? "正在读取最新快照…" : "刷新快照" }}
				</Button>
			</div>
		</header>
		<TodoFilters v-model="filters" :artifact="query.data.value" />
		<div ref="layoutAnchorRef" class="todo-layout-anchor">
			<TodoStatusBar
				:artifact="query.data.value"
				:visible-tree="visibleTree"
				:is-loading="query.isLoading.value"
				:error="query.error.value"
			/>
		</div>
		<div v-if="query.isLoading.value" class="todo-state">正在读取公开 TODO 快照…</div>
		<div v-else-if="query.error.value && !query.data.value" class="todo-state todo-state--error">
			无法读取快照：{{ query.error.value.message }}
		</div>
		<div v-else-if="!visibleTree.length" class="todo-state">当前筛选条件下没有 TODO。</div>
		<ResizablePanelGroup
			v-else
			direction="horizontal"
			auto-save-id="github-todo-panels"
			class="todo-layout"
			:style="layoutStyle"
		>
			<ResizablePanel :default-size="38" :min-size="24" :max-size="56" class="todo-layout__tree-panel">
				<TodoTree
					v-if="viewMode === 'tree'"
					:nodes="visibleTree"
					:expanded="expanded"
					:selected-id="selectedId"
					@select="select"
					@toggle="toggle"
				/>
				<TodoFlatList v-else :rows="flatRows" :selected-id="selectedId" @select="select" />
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
	flex-wrap: wrap;
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
.todo-dashboard__actions {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	flex: 0 0 auto;
}
.todo-view-toggle {
	display: inline-flex;
	border: 1px solid var(--vp-c-divider);
	border-radius: 6px;
	overflow: hidden;
	background: var(--vp-c-bg-soft);
}
.todo-view-toggle button {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	border: 0;
	background: transparent;
	color: var(--vp-c-text-2);
	cursor: pointer;
	padding: 0.6rem 0.75rem;
	font-size: 0.85rem;
	transition:
		background-color 150ms ease,
		color 150ms ease;
}
.todo-view-toggle button + button {
	border-left: 1px solid var(--vp-c-divider);
}
.todo-view-toggle button:hover {
	color: var(--vp-c-text-1);
	background: color-mix(in srgb, var(--vp-c-brand-soft) 58%, transparent);
}
.todo-view-toggle button.is-active {
	background: var(--vp-c-brand-soft);
	color: var(--vp-c-brand-1);
	font-weight: 600;
}
.todo-refresh__spinner {
	animation: todo-spin 700ms linear infinite;
}
@keyframes todo-spin {
	to {
		transform: rotate(360deg);
	}
}
.todo-refresh-feedback {
	margin: 0;
	padding: 0.45rem 0.6rem;
	border-radius: 6px;
	color: var(--vp-c-text-2) !important;
	background: var(--vp-c-bg-soft);
	font-size: 0.8rem;
	max-width: 30ch;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.todo-refresh-feedback--error {
	color: var(--vp-c-danger-1) !important;
	background: color-mix(in srgb, var(--vp-c-danger-soft, var(--vp-c-danger-1)) 12%, transparent);
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
@media (max-width: 900px) {
	.todo-layout {
		display: block;
		height: auto !important;
	}
	.todo-layout__tree-panel,
	.todo-layout__details-panel {
		width: 100% !important;
		min-width: 0;
	}
	.todo-dashboard__actions {
		flex-wrap: wrap;
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
