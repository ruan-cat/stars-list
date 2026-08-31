<script setup lang="ts">
import type { SplitterResizeHandleEmits, SplitterResizeHandleProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { reactiveOmit } from "@vueuse/core";
import { useForwardPropsEmits } from "reka-ui";
import { ResizableHandle as ShadcnHandle } from "./resizable";
import { cn } from "@/lib/utils";

const props = defineProps<SplitterResizeHandleProps & { class?: HTMLAttributes["class"] }>();
const emits = defineEmits<SplitterResizeHandleEmits>();
const delegatedProps = reactiveOmit(props, "class");
const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
	<ShadcnHandle
		v-bind="forwarded"
		:aria-label="props['aria-label'] ?? '调整左右面板宽度'"
		:class="
			cn(
				'relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 [&[data-orientation=vertical]]:h-px [&[data-orientation=vertical]]:w-full',
				props.class,
			)
		"
	/>
</template>
