<script setup lang="ts">
import { Primitive } from "reka-ui";
withDefaults(defineProps<{ variant?: "default" | "ghost"; disabled?: boolean }>(), { variant: "default" });
</script>
<template>
	<Primitive as="button" class="ui-button" :class="`ui-button--${variant}`" :disabled="disabled"><slot /></Primitive>
</template>

<style scoped>
.ui-button {
	background: var(--vp-c-brand-3);
	color: var(--vp-c-white);
	border: 0;
	border-radius: 6px;
	padding: 0.6rem 0.9rem;
	cursor: pointer;
}
.ui-button--ghost {
	background: transparent;
	color: var(--vp-c-text-1);
}
.ui-button:disabled {
	opacity: 0.6;
	cursor: wait;
}
</style>
