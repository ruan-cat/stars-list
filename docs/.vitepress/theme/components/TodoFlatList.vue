<script setup lang="ts">
import type { TodoTreeNode } from "../todo-tree";
import TodoNodeIcon from "./TodoNodeIcon.vue";
defineProps<{ rows: TodoTreeNode[]; selectedId: string | null }>();
const emit = defineEmits<{ select: [string] }>();
</script>

<template>
	<!-- TODO 平铺列表：将过滤后的树按深度优先顺序展平成单行列表，与树形视图共用选中态 -->
	<div class="todo-flat" role="listbox" aria-label="TODO 平铺列表">
		<button
			v-for="row in rows"
			:key="row.id"
			type="button"
			class="todo-flat__row"
			:class="{ 'is-selected': selectedId === row.id }"
			role="option"
			:aria-selected="selectedId === row.id"
			@click="emit('select', row.id)"
		>
			<span class="todo-flat__head">
				<TodoNodeIcon :node="row" />
				<span class="todo-flat__text">{{ row.label }}</span>
			</span>
			<span class="todo-flat__meta">{{ row.repo }} · {{ row.path }}:{{ row.todo?.line ?? "?" }}</span>
		</button>
		<p v-if="!rows.length" class="todo-flat__empty">当前筛选条件下没有 TODO。</p>
	</div>
</template>

<style scoped>
.todo-flat {
	height: 100%;
	padding: 0.4rem;
	background: var(--vp-c-bg-soft);
	overflow: auto;
	min-width: 0;
}
.todo-flat__row {
	display: block;
	width: 100%;
	box-sizing: border-box;
	border: 0;
	border-radius: 6px;
	background: transparent;
	color: var(--vp-c-text-1);
	cursor: pointer;
	padding: 0.45rem 0.6rem;
	text-align: left;
	transition: background-color 150ms ease;
}
.todo-flat__row:hover {
	background: color-mix(in srgb, var(--vp-c-brand-soft) 58%, transparent);
}
.todo-flat__row.is-selected {
	background: var(--vp-c-brand-soft);
}
.todo-flat__head {
	display: flex;
	align-items: center;
	gap: 0.45rem;
	min-width: 0;
	line-height: 1.4;
}
.todo-flat__text {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.todo-flat__meta {
	display: block;
	margin: 0.12rem 0 0 1.45rem;
	color: var(--vp-c-text-3);
	font-size: 0.75rem;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-variant-numeric: tabular-nums;
}
.todo-flat__row.is-selected .todo-flat__meta,
.todo-flat__row:hover .todo-flat__meta {
	color: var(--vp-c-text-2);
}
.todo-flat__empty {
	color: var(--vp-c-text-2) !important;
	padding: 2rem;
	text-align: center;
	border: 1px dashed var(--vp-c-divider);
	border-radius: 8px;
}
</style>
