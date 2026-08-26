<script setup lang="ts">
import { computed } from "vue";
import type { TodoScanArtifact } from "../todo-artifact";
import type { TodoFilters } from "../todo-tree";
import Input from "./ui/Input.vue";
import Select from "./ui/Select.vue";
const props = defineProps<{ modelValue: TodoFilters; artifact?: TodoScanArtifact }>();
const emit = defineEmits<{ "update:modelValue": [TodoFilters] }>();
const repos = computed(() => [...new Set(props.artifact?.todos.map((todo) => todo.repo) ?? [])].sort());
const branches = computed(() => [...new Set(props.artifact?.todos.map((todo) => todo.branch) ?? [])].sort());
const kinds = computed(() => [...new Set(props.artifact?.todos.map((todo) => todo.kind) ?? [])].sort());
const repoOptions = computed(() => ["", ...repos.value]);
const branchOptions = computed(() => ["", ...branches.value]);
const kindOptions = computed(() => ["", ...kinds.value]);
function update(key: keyof TodoFilters, value: string) {
	emit("update:modelValue", { ...props.modelValue, [key]: value });
}
</script>
<template>
	<div class="todo-filters" role="search" aria-label="筛选 TODO">
		<Input
			:model-value="modelValue.search"
			type="search"
			placeholder="搜索 TODO 文本、路径…"
			aria-label="搜索 TODO"
			@input="update('search', ($event.target as HTMLInputElement).value)"
		/>
		<Select
			:model-value="modelValue.repo as string"
			:options="repoOptions"
			placeholder="所有仓库"
			aria-label="仓库"
			@change="update('repo', $event)"
		/>
		<Select
			:model-value="modelValue.branch as string"
			:options="branchOptions"
			placeholder="所有分支"
			aria-label="分支"
			@change="update('branch', $event)"
		/>
		<Select
			:model-value="modelValue.kind as string"
			:options="kindOptions"
			placeholder="所有类型"
			aria-label="类型"
			@change="update('kind', $event)"
		/>
	</div>
</template>

<style scoped>
.todo-filters {
	display: grid;
	grid-template-columns: 2fr repeat(3, 1fr);
	gap: 0.6rem;
	margin: 1rem 0;
}
@media (max-width: 720px) {
	.todo-filters {
		grid-template-columns: 1fr 1fr;
	}
	.todo-filters :deep(.ui-input) {
		grid-column: 1/-1;
	}
}
</style>
