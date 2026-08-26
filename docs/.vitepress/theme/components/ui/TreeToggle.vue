<script setup lang="ts">
import { Primitive } from "reka-ui";
import { ChevronRight } from "lucide-vue-next";

defineProps<{ expanded: boolean; label: string }>();
</script>

<template>
	<Primitive
		as="button"
		type="button"
		class="ui-tree-toggle"
		:class="{ 'is-expanded': expanded }"
		:aria-expanded="expanded"
		:aria-label="label"
	>
		<ChevronRight :size="14" :stroke-width="2" aria-hidden="true" />
	</Primitive>
</template>

<style scoped>
.ui-tree-toggle {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1.5rem;
	height: 1.5rem;
	flex: 0 0 1.5rem;
	border: 0;
	border-radius: 5px;
	background: transparent;
	color: var(--vp-c-text-2);
	cursor: pointer;
	transition:
		background-color 160ms ease,
		color 160ms ease;
}
.ui-tree-toggle svg {
	transition: transform 160ms ease;
}
.ui-tree-toggle.is-expanded svg {
	transform: rotate(90deg);
}
.ui-tree-toggle:hover {
	background: var(--vp-c-brand-soft);
	color: var(--vp-c-brand-1);
}
.ui-tree-toggle:focus-visible {
	outline: 2px solid var(--vp-c-brand-1);
	outline-offset: 1px;
}
@media (max-width: 720px) {
	.ui-tree-toggle {
		width: 2rem;
		height: 2rem;
		flex-basis: 2rem;
	}
}
</style>
