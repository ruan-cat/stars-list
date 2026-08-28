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
import { ChevronDown, X } from "lucide-vue-next";
import { Icon } from "@iconify/vue";

/** 选项图标的可选颜色，缺省跟随品牌色 */
export interface SelectOptionIcon {
	icon: string;
	color?: string;
}

const props = defineProps<{
	modelValue: string;
	options: string[];
	placeholder: string;
	ariaLabel: string;
	/** 可选：选项值 → iconify 图标（@iconify-icons/* 静态导入值），用于在触发器与选项前区分类型 */
	optionIcons?: Record<string, SelectOptionIcon>;
}>();
const emit = defineEmits<{ change: [string] }>();
const ALL_VALUE = "__all__";
const selectedValue = computed(() => props.modelValue || ALL_VALUE);
const optionValues = computed(() => props.options.filter((option) => option.length > 0));
const selectedIcon = computed(() => (props.modelValue ? props.optionIcons?.[props.modelValue] : undefined));
function update(value: string) {
	emit("change", value === ALL_VALUE ? "" : value);
}
</script>
<template>
	<div class="ui-select-wrap">
		<SelectRoot :model-value="selectedValue" @update:model-value="update"
			><SelectTrigger class="ui-select" :aria-label="ariaLabel"
				><Icon
					v-if="selectedIcon"
					class="ui-select__option-icon"
					:icon="selectedIcon.icon"
					:style="selectedIcon.color ? { color: selectedIcon.color } : undefined"
					width="15"
					height="15"
					aria-hidden="true" /><SelectValue :placeholder="placeholder" /><SelectIcon as-child
					><ChevronDown
						class="ui-select__icon"
						:size="15"
						:stroke-width="2"
						aria-hidden="true" /></SelectIcon></SelectTrigger
			><button
				v-if="modelValue"
				class="ui-select__clear"
				type="button"
				:aria-label="`清空${ariaLabel}筛选`"
				@pointerdown.stop.prevent
				@click.stop="update(ALL_VALUE)"
			>
				<X :size="13" :stroke-width="2" aria-hidden="true" /></button
			><SelectPortal
				><SelectContent class="ui-select__content" position="popper" align="start" :side-offset="4"
					><SelectViewport class="ui-select__viewport"
						><SelectItem :value="ALL_VALUE" class="ui-select__item"
							><SelectItemText>{{ placeholder }}</SelectItemText></SelectItem
						><SelectItem v-for="option in optionValues" :key="option" :value="option" class="ui-select__item"
							><span class="ui-select__item-label"
								><Icon
									v-if="optionIcons?.[option]"
									class="ui-select__option-icon"
									:icon="optionIcons[option].icon"
									:style="optionIcons[option].color ? { color: optionIcons[option].color } : undefined"
									width="15"
									height="15"
									aria-hidden="true"
								/><SelectItemText>{{ option }}</SelectItemText></span
							></SelectItem
						></SelectViewport
					></SelectContent
				></SelectPortal
			></SelectRoot
		>
	</div>
</template>

<style scoped>
.ui-select {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	gap: 0.5rem;
	min-width: 0;
	width: 100%;
	box-sizing: border-box;
	border: 1px solid var(--vp-c-divider);
	border-radius: 6px;
	background: var(--vp-c-bg-soft);
	color: var(--vp-c-text-1);
	padding: 0.6rem 0.7rem;
	padding-right: 3.6rem;
	text-align: left;
	cursor: pointer;
}
.ui-select-wrap {
	position: relative;
	min-width: 0;
	width: 100%;
}
.ui-select__clear {
	position: absolute;
	top: 50%;
	right: 1.8rem;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1.35rem;
	height: 1.35rem;
	border: 0;
	border-radius: 4px;
	background: transparent;
	color: var(--vp-c-text-3);
	cursor: pointer;
	transform: translateY(-50%);
}
.ui-select__clear:hover {
	background: var(--vp-c-brand-soft);
	color: var(--vp-c-brand-1);
}
.ui-select__clear:focus-visible {
	outline: 2px solid var(--vp-c-brand-1);
	outline-offset: 1px;
}
.ui-select__icon {
	position: absolute;
	right: 0.7rem;
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

<!-- 弹层经 SelectPortal 渲染在组件树之外，scoped 属性匹配不到，以下规则必须全局声明。
     另外 Reka UI 会在 viewport 上写内联 overflow，需要 !important 才能改成始终显示滚动条。 -->
<style>
.ui-select__content {
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
/* 选项过多时限制弹层高度并提供可见滚动条，避免下拉面板无限拉高。
   Reka UI 自带隐藏原生滚动条的样式（[data-reka-select-viewport] { scrollbar-width: none }
   + ::-webkit-scrollbar { display: none }），这里用"类名+属性"双选择器压过它，
   同时还原标准属性与 webkit 伪元素两套滚动条体系。 */
.ui-select__viewport[data-reka-select-viewport] {
	max-height: min(320px, var(--reka-select-content-available-height, 320px));
	/* 始终显示滚动条，向用户暗示选项可继续滚动（内联样式需 !important 压制） */
	overflow-y: scroll !important;
	scrollbar-width: thin;
	scrollbar-color: var(--vp-c-text-3) transparent;
}
.ui-select__viewport[data-reka-select-viewport]::-webkit-scrollbar {
	display: block;
	width: 0.4rem;
	height: 0.4rem;
}
.ui-select__item-label {
	display: flex;
	align-items: center;
	gap: 0.45rem;
	min-width: 0;
}
.ui-select__option-icon {
	flex: 0 0 15px;
	color: var(--vp-c-brand-1);
}
.ui-select__item {
	padding: 0.4rem 0.55rem;
	border-radius: 4px;
	cursor: pointer;
}
.ui-select__item[data-highlighted] {
	background: var(--vp-c-brand-soft);
	outline: none;
}
</style>
