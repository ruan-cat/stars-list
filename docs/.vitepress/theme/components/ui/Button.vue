<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import ShadcnButton from "./button/Button.vue";

/** 业务按钮兼容层：保留 TodoDashboard 的 variant/disabled API。 */
withDefaults(
	defineProps<{
		variant?: "default" | "ghost";
		disabled?: boolean;
		class?: HTMLAttributes["class"];
	}>(),
	{ variant: "default", disabled: false },
);
</script>

<template>
	<ShadcnButton :variant="variant" :disabled="disabled" :class="['ui-button', $attrs.class]" v-bind="$attrs">
		<slot />
	</ShadcnButton>
</template>
