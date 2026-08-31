<script setup lang="ts">
import type { TodoTreeNode } from "../todo-tree";
import TreeToggle from "./ui/TreeToggle.vue";
import TodoNodeIcon from "./TodoNodeIcon.vue";
defineProps<{ nodes: TodoTreeNode[]; expanded: Set<string>; selectedId: string | null }>();
const emit = defineEmits<{ select: [string]; toggle: [string] }>();
</script>
<template>
	<nav
		class="todo-tree-root h-full min-w-0 overflow-auto bg-muted p-2.5 max-[900px]:h-auto max-[900px]:overflow-visible"
		aria-label="TODO Explorer"
	>
		<ul class="!m-0 !w-full !list-none !p-0">
			<li v-for="node in nodes" :key="node.id">
				<div
					:class="[
						'todo-tree__row group relative flex min-h-7 w-full items-center rounded-md transition-colors hover:bg-accent/60',
						{ 'bg-accent': selectedId === node.id, 'is-selected': selectedId === node.id },
					]"
				>
					<TreeToggle
						v-if="node.children?.length"
						:expanded="expanded.has(node.id)"
						:label="expanded.has(node.id) ? '收起' : '展开'"
						@click="emit('toggle', node.id)"
					/>
					<span v-else class="w-6 shrink-0" aria-hidden="true" />
					<button
						class="grid min-w-0 flex-1 cursor-pointer grid-cols-[minmax(0,1fr)_2.25rem] items-center gap-2 border-0 bg-transparent px-1.5 py-1 text-left leading-[1.35] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
						type="button"
						:aria-selected="selectedId === node.id"
						@click="emit('select', node.id)"
					>
						<span class="flex min-w-0 items-center gap-2"
							><TodoNodeIcon :node="node" /><span>{{ node.label }}</span></span
						><small
							class="text-right tabular-nums text-muted-foreground group-focus-within:text-foreground group-hover:text-foreground"
							>{{ node.count }}</small
						>
					</button>
				</div>
				<Transition name="todo-tree-branch">
					<div
						v-if="node.children?.length && expanded.has(node.id)"
						class="todo-tree__children relative min-h-0 overflow-hidden pl-3"
					>
						<TodoTree
							:nodes="node.children"
							:expanded="expanded"
							:selected-id="selectedId"
							@select="emit('select', $event)"
							@toggle="emit('toggle', $event)"
						/>
					</div>
				</Transition>
			</li>
		</ul>
	</nav>
</template>

<style scoped>
.todo-tree-root .todo-tree-root {
	height: auto;
	width: 100%;
	overflow: visible;
	background: transparent;
	padding: 0;
}
.todo-tree-root .todo-tree-root > ul {
	position: relative;
}
.todo-tree-root .todo-tree-root > ul::before {
	position: absolute;
	top: 0;
	bottom: 0;
	/* The recursive nav sits inside .todo-tree__children's 0.75rem inset. */
	left: -0.6rem;
	width: 2px;
	border-radius: 999px;
	background: color-mix(in srgb, var(--vp-c-text-3) 32%, transparent);
	content: "";
	pointer-events: none;
	transition: background-color 160ms ease;
}
.todo-tree-root .todo-tree-root > ul:has(.todo-tree__row:hover)::before,
.todo-tree-root .todo-tree-root > ul:has(.todo-tree__row.is-selected)::before {
	background: var(--vp-c-brand-1);
}
.todo-tree-branch-enter-active,
.todo-tree-branch-leave-active {
	display: grid;
	grid-template-rows: 1fr;
	opacity: 1;
	transition:
		grid-template-rows 180ms ease,
		opacity 160ms ease;
}
.todo-tree-branch-enter-from,
.todo-tree-branch-leave-to {
	grid-template-rows: 0fr;
	opacity: 0;
}
</style>
