<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
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
import "../tw.css";

const filters = ref<TodoFilterState>({ search: "", repo: "", branch: "", kind: "" });
const selectedId = ref<string | null>(null);
const expanded = ref<Set<string>>(new Set());
const viewMode = ref<"tree" | "flat">("tree");
const query = useTodoArtifactQuery();
const refresh = useTodoArtifactRefresh();
let refreshTrigger: HTMLButtonElement | null = null;
const isHydrated = ref(false);
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

/** 记录刷新触发控件，并在请求结束后恢复键盘焦点。 */
function refreshSnapshot(event: MouseEvent) {
	if (event.currentTarget instanceof HTMLButtonElement) refreshTrigger = event.currentTarget;
	refresh.mutate();
}
function restoreRefreshFocus() {
	if (typeof window === "undefined") return;
	window.requestAnimationFrame(() => {
		const trigger =
			refreshTrigger ??
			Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
				(button) => button.getAttribute("aria-label") === "刷新快照",
			) ??
			null;
		trigger?.focus();
	});
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
watch(refresh.isPending, (pending, wasPending) => {
	if (wasPending && !pending) restoreRefreshFocus();
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
	isHydrated.value = true;
	window.addEventListener("resize", measureViewportReserve);
});
watch([isHydrated, query.data, query.error], () => void nextTick(measureViewportReserve), { flush: "post" });
onBeforeUnmount(() => window.removeEventListener("resize", measureViewportReserve));
const layoutStyle = computed(() => ({ height: `calc(100dvh - ${viewportReserve.value}px)` }));
</script>

<template>
	<section class="todo-dashboard mx-auto max-w-[1440px] text-foreground" aria-label="GitHub TODO 浏览器">
		<header class="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
			<div class="min-w-0">
				<p class="mb-1.5 mt-0 text-[0.7rem] font-bold tracking-[0.12em] text-primary">REPOSITORY EXPLORER</p>
				<h1 class="m-0 text-[1.75rem] leading-tight text-foreground">GitHub TODO Tree</h1>
				<p class="m-0 text-sm text-muted-foreground">按仓库、分支、目录和文件追踪待办。</p>
			</div>
			<div class="flex shrink-0 flex-wrap items-center gap-2.5 max-[900px]:flex-wrap">
				<p
					v-if="refresh.error.value"
					class="m-0 max-w-[30ch] overflow-hidden text-ellipsis whitespace-nowrap rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive"
					role="alert"
					:title="refresh.error.value.message"
				>
					刷新失败：{{ refresh.error.value.message }}
				</p>
				<p
					v-else-if="justRefreshed"
					class="m-0 max-w-[30ch] overflow-hidden text-ellipsis whitespace-nowrap rounded-md bg-muted px-2.5 py-1.5 text-xs text-muted-foreground"
					role="status"
				>
					快照已更新，数据为最新。
				</p>
				<div
					class="inline-flex overflow-hidden rounded-md border border-border bg-muted"
					role="group"
					aria-label="视图切换"
				>
					<button
						type="button"
						:class="[
							'inline-flex cursor-pointer items-center gap-1.5 border-0 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
							viewMode === 'tree' ? 'bg-accent font-semibold text-primary' : '',
						]"
						:aria-pressed="viewMode === 'tree'"
						@click="viewMode = 'tree'"
					>
						<FolderTree :size="15" aria-hidden="true" />树形
					</button>
					<button
						type="button"
						:class="[
							'inline-flex cursor-pointer items-center gap-1.5 border-0 border-l border-border px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
							viewMode === 'flat' ? 'bg-accent font-semibold text-primary' : '',
						]"
						:aria-pressed="viewMode === 'flat'"
						@click="viewMode = 'flat'"
					>
						<List :size="15" aria-hidden="true" />平铺
					</button>
				</div>
				<Button
					:disabled="refresh.isPending.value"
					:aria-busy="refresh.isPending.value"
					aria-label="刷新快照"
					@click="refreshSnapshot"
				>
					<LoaderCircle
						v-if="refresh.isPending.value"
						class="animate-spin [animation-duration:700ms]"
						:size="15"
						aria-hidden="true"
					/>
					{{ refresh.isPending.value ? "正在读取最新快照…" : "刷新快照" }}
				</Button>
			</div>
		</header>
		<TodoFilters v-model="filters" :artifact="query.data.value" />
		<div ref="layoutAnchorRef" class="todo-layout-anchor">
			<TodoStatusBar
				:artifact="isHydrated ? query.data.value : undefined"
				:visible-tree="visibleTree"
				:is-loading="!isHydrated || query.isLoading.value"
				:error="isHydrated ? query.error.value : null"
			/>
		</div>
		<div
			v-if="!isHydrated || query.isLoading.value"
			class="rounded-md border border-dashed border-border p-8 text-center text-muted-foreground"
		>
			正在读取公开 TODO 快照…
		</div>
		<div
			v-else-if="isHydrated && query.error.value && !query.data.value"
			class="rounded-md border border-dashed border-border p-8 text-center text-destructive"
		>
			无法读取快照：{{ query.error.value.message }}
		</div>
		<div
			v-else-if="!visibleTree.length"
			class="rounded-md border border-dashed border-border p-8 text-center text-muted-foreground"
		>
			当前筛选条件下没有 TODO。
		</div>
		<ResizablePanelGroup
			v-else
			direction="horizontal"
			auto-save-id="github-todo-panels"
			class="flex min-h-0 w-full overflow-hidden rounded-lg border border-border max-[900px]:!block max-[900px]:!h-auto"
			:style="layoutStyle"
		>
			<ResizablePanel
				:default-size="38"
				:min-size="24"
				:max-size="56"
				class="min-w-[280px] overflow-hidden bg-muted max-[900px]:!h-auto max-[900px]:!w-full max-[900px]:min-w-0 max-[900px]:overflow-visible"
			>
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
			<ResizableHandle class="max-[900px]:hidden" />
			<ResizablePanel
				:default-size="62"
				:min-size="44"
				:max-size="76"
				class="min-w-[360px] overflow-hidden bg-background max-[900px]:!h-auto max-[900px]:!w-full max-[900px]:min-w-0 max-[900px]:overflow-visible"
			>
				<TodoDetails :node="selected" />
			</ResizablePanel>
		</ResizablePanelGroup>
	</section>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
	.todo-dashboard *,
	.todo-dashboard *::before,
	.todo-dashboard *::after {
		scroll-behavior: auto !important;
		transition: none !important;
	}
}
</style>
