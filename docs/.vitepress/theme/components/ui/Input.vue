<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import ShadcnInput from "./input/Input.vue";

/** 业务输入框兼容层：保留 modelValue/defaultValue 与原生 input 事件。 */
defineOptions({ inheritAttrs: false });

const props = defineProps<{
	modelValue?: string | number;
	defaultValue?: string | number;
	class?: HTMLAttributes["class"];
}>();

const emit = defineEmits<{
	(e: "update:modelValue", value: string | number): void;
	(e: "input", event: Event): void;
}>();
</script>

<template>
	<ShadcnInput
		:model-value="props.modelValue"
		:default-value="props.defaultValue"
		:class="['ui-input', props.class]"
		v-bind="$attrs"
		@update:model-value="emit('update:modelValue', $event)"
		@input="emit('input', $event)"
	/>
</template>
