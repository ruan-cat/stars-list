<script setup lang="ts">
import type { SplitterPanelProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { reactiveOmit } from "@vueuse/core";
import { ResizablePanel as ShadcnPanel } from "./resizable";

const props = defineProps<SplitterPanelProps & { class?: HTMLAttributes["class"] }>();
const delegatedProps = reactiveOmit(props, "class");
</script>

<template>
	<ShadcnPanel v-bind="delegatedProps" :class="props.class"><slot /></ShadcnPanel>
</template>
