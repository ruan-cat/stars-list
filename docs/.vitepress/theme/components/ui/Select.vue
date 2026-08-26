<script setup lang="ts">
import {
	SelectContent,
	SelectItem,
	SelectItemText,
	SelectIcon,
	SelectPortal,
	SelectRoot,
	SelectTrigger,
	SelectValue,
	SelectViewport,
} from "reka-ui";
import { computed } from "vue";
import { ChevronDown } from "lucide-vue-next";
const props = defineProps<{ modelValue: string; options: string[]; placeholder: string; ariaLabel: string }>();
const emit = defineEmits<{ change: [string] }>();
const ALL_VALUE = "__all__";
const selectedValue = computed(() => props.modelValue || ALL_VALUE);
const optionValues = computed(() => props.options.filter((option) => option.length > 0));
function update(value: string) {
	emit("change", value === ALL_VALUE ? "" : value);
}
</script>
<template>
	<SelectRoot :model-value="selectedValue" @update:model-value="update"
		><SelectTrigger class="ui-select" :aria-label="ariaLabel"
			><SelectValue :placeholder="placeholder" /><SelectIcon as-child
				><ChevronDown
					class="ui-select__icon"
					:size="15"
					:stroke-width="2"
					aria-hidden="true" /></SelectIcon></SelectTrigger
		><SelectPortal
			><SelectContent class="ui-select__content" position="popper" align="start" :side-offset="4"
				><SelectViewport
					><SelectItem :value="ALL_VALUE" class="ui-select__item"
						><SelectItemText>{{ placeholder }}</SelectItemText></SelectItem
					><SelectItem v-for="option in optionValues" :key="option" :value="option" class="ui-select__item"
						><SelectItemText>{{ option }}</SelectItemText></SelectItem
					></SelectViewport
				></SelectContent
			></SelectPortal
		></SelectRoot
	>
</template>

<style scoped>
.ui-select {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
	min-width: 0;
	width: 100%;
	box-sizing: border-box;
	border: 1px solid var(--vp-c-divider);
	border-radius: 6px;
	background: var(--vp-c-bg-soft);
	color: var(--vp-c-text-1);
	padding: 0.6rem 0.7rem;
	text-align: left;
	cursor: pointer;
}
.ui-select__icon {
	flex: 0 0 auto;
	color: var(--vp-c-text-3);
	transition:
		transform 160ms ease,
		color 160ms ease;
}
.ui-select[data-state="open"] .ui-select__icon {
	transform: rotate(180deg);
	color: var(--vp-c-brand-1);
}
:global(.ui-select__content) {
	z-index: 30;
	min-width: var(--reka-select-trigger-width);
	border: 1px solid var(--vp-c-divider);
	border-radius: 6px;
	background: var(--vp-c-bg);
	color: var(--vp-c-text-1);
	padding: 0.25rem;
	box-shadow: var(--vp-shadow-3);
	transform-origin: var(--reka-select-content-transform-origin);
	animation: ui-select-content-in 140ms ease-out;
}
:global(.ui-select__item) {
	padding: 0.4rem 0.55rem;
	border-radius: 4px;
	cursor: pointer;
}
:global(.ui-select__item[data-highlighted]) {
	background: var(--vp-c-brand-soft);
	outline: none;
}
@keyframes ui-select-content-in {
	from {
		opacity: 0;
		transform: translateY(-4px) scale(0.98);
	}
	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}
</style>
