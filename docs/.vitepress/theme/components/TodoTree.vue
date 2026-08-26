<script setup lang="ts">
import type { TodoTreeNode } from "../todo-tree";
import TreeToggle from "./ui/TreeToggle.vue";
defineProps<{ nodes: TodoTreeNode[]; expanded: Set<string>; selectedId: string | null }>();
const emit = defineEmits<{ select: [string]; toggle: [string] }>();
</script>
<template>
	<nav class="todo-tree" aria-label="TODO Explorer">
		<ul>
			<li v-for="node in nodes" :key="node.id">
				<div class="todo-tree__row" :class="{ 'is-selected': selectedId === node.id }">
					<TreeToggle
						v-if="node.children?.length"
						:expanded="expanded.has(node.id)"
						:label="expanded.has(node.id) ? '收起' : '展开'"
						@click="emit('toggle', node.id)"
					/>
					<span v-else class="todo-tree__spacer" aria-hidden="true" />
					<button
						class="todo-tree__label"
						type="button"
						:aria-selected="selectedId === node.id"
						@click="emit('select', node.id)"
					>
						<span>{{ node.label }}</span
						><small>{{ node.count }}</small>
					</button>
				</div>
				<Transition name="todo-tree-branch">
					<div v-if="node.children?.length && expanded.has(node.id)" class="todo-tree__children">
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
.todo-tree {
	padding: 0.65rem;
	background: var(--vp-c-bg-soft);
	overflow: auto;
	min-width: 0;
}
.todo-tree .todo-tree {
	width: 100%;
	padding: 0;
	background: transparent;
	overflow: visible;
}
.todo-tree ul {
	list-style: none;
	margin: 0;
	padding: 0 0 0 0.85rem;
	border-left: 0;
	width: 100%;
	box-sizing: border-box;
}
.todo-tree > ul {
	padding-left: 0;
	border-left: 0;
}
.todo-tree li,
.todo-tree__row {
	width: 100%;
	box-sizing: border-box;
}
.todo-tree__children {
	position: relative;
	min-height: 0;
	overflow: hidden;
	margin-left: 0;
	padding-left: 0.75rem;
}
.todo-tree__children::before {
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0.15rem;
	width: 2px;
	border-radius: 999px;
	background: color-mix(in srgb, var(--vp-c-text-3) 32%, transparent);
	content: "";
	pointer-events: none;
	transition: background-color 160ms ease;
}
.todo-tree__children:has(.todo-tree__row:hover)::before,
.todo-tree__children:has(.todo-tree__row.is-selected)::before {
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
.todo-tree__row {
	position: relative;
	display: flex;
	align-items: center;
	min-height: 1.75rem;
	border-radius: 5px;
	transition: background-color 150ms ease;
}
.todo-tree__row:hover {
	background: color-mix(in srgb, var(--vp-c-brand-soft) 58%, transparent);
}
.todo-tree__row.is-selected {
	background: var(--vp-c-brand-soft);
}
.todo-tree__label {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 2.25rem;
	align-items: center;
	gap: 0.5rem;
	flex: 1;
	min-width: 0;
	width: 100%;
	border: 0;
	background: transparent;
	color: var(--vp-c-text-1);
	cursor: pointer;
	text-align: left;
	padding: 0.2rem 0.45rem;
	line-height: 1.35;
}
.todo-tree__label small {
	color: var(--vp-c-text-3);
	font-variant-numeric: tabular-nums;
	text-align: right;
}
.todo-tree__row:hover .todo-tree__label small,
.todo-tree__row.is-selected .todo-tree__label small {
	color: var(--vp-c-text-2);
}
.todo-tree__spacer {
	width: 1.6rem;
}
@media (max-width: 720px) {
	.todo-tree__row {
		min-height: 2.25rem;
	}
}
</style>
