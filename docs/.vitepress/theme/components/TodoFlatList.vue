<script setup lang="ts">
import type { TodoTreeNode } from "../todo-tree";
import TodoNodeIcon from "./TodoNodeIcon.vue";
defineProps<{ rows: TodoTreeNode[]; selectedId: string | null }>();
const emit = defineEmits<{ select: [string] }>();
</script>

<template>
	<!-- TODO 平铺列表：将过滤后的树按深度优先顺序展平成单行列表，与树形视图共用选中态 -->
	<div
		class="h-full min-w-0 overflow-auto bg-muted p-1.5 max-[900px]:h-auto max-[900px]:overflow-visible"
		role="listbox"
		aria-label="TODO 平铺列表"
	>
		<button
			v-for="row in rows"
			:key="row.id"
			type="button"
			:class="[
				'block w-full cursor-pointer rounded-md border-0 bg-transparent px-2.5 py-2 text-left text-foreground transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
				{ 'bg-accent': selectedId === row.id },
			]"
			role="option"
			:aria-selected="selectedId === row.id"
			@click="emit('select', row.id)"
		>
			<span class="flex min-w-0 items-center gap-2 leading-[1.4]">
				<TodoNodeIcon :node="row" />
				<span class="min-w-0 truncate">{{ row.label }}</span>
			</span>
			<span class="ml-[1.45rem] block truncate text-xs tabular-nums text-muted-foreground"
				>{{ row.repo }} · {{ row.path }}:{{ row.todo?.line ?? "?" }}</span
			>
		</button>
		<p
			v-if="!rows.length"
			class="mx-2 my-8 rounded-md border border-dashed border-border p-8 text-center text-muted-foreground"
		>
			当前筛选条件下没有 TODO。
		</p>
	</div>
</template>
