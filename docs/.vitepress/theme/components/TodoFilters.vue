<script setup lang="ts">
import { computed } from "vue";
import lockIcon from "@iconify-icons/mdi/lock";
import lockOpenIcon from "@iconify-icons/mdi/lock-open-variant";
import type { TodoScanArtifact } from "../todo-artifact";
import type { TodoFilters } from "../todo-tree";
import Input from "./ui/Input.vue";
import Select from "./ui/Select.vue";
import type { SelectOptionIcon } from "./ui/Select.vue";
const props = defineProps<{ modelValue: TodoFilters; artifact?: TodoScanArtifact }>();
const emit = defineEmits<{ "update:modelValue": [TodoFilters] }>();
const repos = computed(() => [...new Set(props.artifact?.todos.map((todo) => todo.repo) ?? [])].sort());
const branches = computed(() => [...new Set(props.artifact?.todos.map((todo) => todo.branch) ?? [])].sort());
const kinds = computed(() => [...new Set(props.artifact?.todos.map((todo) => todo.kind) ?? [])].sort());
const repoOptions = computed(() => ["", ...repos.value]);
const branchOptions = computed(() => ["", ...branches.value]);
const kindOptions = computed(() => ["", ...kinds.value]);

/**
 * 仓库可见性图标：闭源（private）用锁，开源用开锁，帮助用户在仓库变多后快速区分。
 * artifact 的 repositories 记录 fullName + visibility，而下拉值是 todo.repo（basename），按 basename 建索引。
 */
const repoIcons = computed(() => {
	const map: Record<string, SelectOptionIcon> = {};
	for (const repository of props.artifact?.repositories ?? []) {
		const name = repository.fullName.includes("/")
			? repository.fullName.slice(repository.fullName.lastIndexOf("/") + 1)
			: repository.fullName;
		map[name] =
			repository.visibility === "private"
				? { icon: lockIcon, color: "var(--vp-c-text-3)" }
				: { icon: lockOpenIcon, color: "var(--vp-c-brand-1)" };
	}
	return map;
});
function update(key: keyof TodoFilters, value: string) {
	emit("update:modelValue", { ...props.modelValue, [key]: value });
}
</script>
<template>
	<div
		class="my-4 grid min-w-0 grid-cols-[2fr_repeat(3,minmax(0,1fr))] gap-2.5 max-[720px]:grid-cols-2"
		role="search"
		aria-label="筛选 TODO"
	>
		<Input
			class="max-[720px]:col-span-2"
			:model-value="modelValue.search"
			type="search"
			placeholder="搜索 TODO 文本、路径…"
			aria-label="搜索 TODO"
			@input="update('search', ($event.target as HTMLInputElement).value)"
		/>
		<Select
			:model-value="modelValue.repo as string"
			:options="repoOptions"
			:option-icons="repoIcons"
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
