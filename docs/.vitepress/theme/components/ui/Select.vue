<script setup lang="ts">
import { computed } from "vue";
import { X } from "lucide-vue-next";
import { Icon, type IconifyIcon } from "@iconify/vue";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./select";
export interface SelectOptionIcon {
	icon: IconifyIcon;
	color?: string;
}
const props = defineProps<{
	modelValue: string;
	options: string[];
	placeholder: string;
	ariaLabel: string;
	optionIcons?: Record<string, SelectOptionIcon>;
}>();
const emit = defineEmits<{ change: [string] }>();
const ALL_VALUE = "__all__";
const selectedValue = computed(() => props.modelValue || ALL_VALUE);
const optionValues = computed(() => props.options.filter(Boolean));
const selectedIcon = computed(() => (props.modelValue ? props.optionIcons?.[props.modelValue] : undefined));
function update(value: string) {
	emit("change", value === ALL_VALUE ? "" : value);
}
</script>
<template>
	<div class="relative min-w-0 w-full">
		<Select :model-value="selectedValue" @update:model-value="update"
			><SelectTrigger
				class="relative flex w-full items-center gap-2 rounded-md border border-border bg-muted px-3 py-2.5 pr-14 text-left text-foreground data-[state=open]:text-primary"
				:aria-label="ariaLabel"
				><Icon
					v-if="selectedIcon"
					class="size-[15px] shrink-0"
					:icon="selectedIcon.icon"
					:style="selectedIcon.color ? { color: selectedIcon.color } : undefined"
					width="15"
					height="15"
					aria-hidden="true" /><SelectValue :placeholder="placeholder" /></SelectTrigger
			><button
				v-if="modelValue"
				class="absolute right-7 top-1/2 inline-flex size-[1.35rem] -translate-y-1/2 items-center justify-center rounded border-0 bg-transparent text-muted-foreground hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				type="button"
				:aria-label="`清空${ariaLabel}筛选`"
				@pointerdown.stop.prevent
				@click.stop="update(ALL_VALUE)"
			>
				<X :size="13" aria-hidden="true" /></button
			><SelectContent class="ui-select__content" position="popper" align="start" :side-offset="4"
				><SelectGroup
					><SelectItem :value="ALL_VALUE">{{ placeholder }}</SelectItem
					><SelectItem v-for="option in optionValues" :key="option" :value="option"
						><span class="flex min-w-0 items-center gap-2"
							><Icon
								v-if="optionIcons?.[option]"
								class="size-[15px] shrink-0"
								:icon="optionIcons[option].icon"
								:style="optionIcons[option].color ? { color: optionIcons[option].color } : undefined"
								width="15"
								height="15"
								aria-hidden="true"
							/>{{ option }}</span
						></SelectItem
					></SelectGroup
				></SelectContent
			></Select
		>
	</div>
</template>
<style>
.ui-select__content {
	min-width: var(--reka-select-trigger-width);
	border-color: var(--vp-c-divider);
	background: var(--vp-c-bg);
	color: var(--vp-c-text-1);
}
.ui-select__content [data-reka-select-viewport] {
	max-height: min(320px, var(--reka-select-content-available-height, 320px));
	overflow-y: scroll !important;
	scrollbar-width: thin;
	scrollbar-color: var(--vp-c-text-3) transparent;
}
.ui-select__content [data-reka-select-viewport]::-webkit-scrollbar {
	display: block;
	width: 0.4rem;
	height: 0.4rem;
}
</style>
