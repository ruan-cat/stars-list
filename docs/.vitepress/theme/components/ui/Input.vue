<script setup lang="ts">
import { Primitive } from "reka-ui";
defineProps<{ modelValue?: string; type?: string; placeholder?: string; ariaLabel?: string }>();
const emit = defineEmits<{ input: [Event] }>();
</script>
<template>
	<Primitive
		as="input"
		class="ui-input"
		:type="type ?? 'text'"
		:value="modelValue"
		:placeholder="placeholder"
		:aria-label="ariaLabel"
		@input="emit('input', $event)"
	/>
</template>

<style scoped>
.ui-input {
	min-width: 0;
	width: 100%;
	box-sizing: border-box;
	border: 1px solid var(--vp-c-divider);
	border-radius: 6px;
	background: var(--vp-c-bg-soft);
	color: var(--vp-c-text-1);
	padding: 0.6rem 0.7rem;
}
</style>
