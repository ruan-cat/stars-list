<script setup lang="ts">
import { SplitterPanel } from "reka-ui";
withDefaults(defineProps<{ defaultSize?: number; minSize?: number; maxSize?: number; class?: string }>(), {
	defaultSize: 50,
	minSize: 10,
	maxSize: 90,
});
</script>
<template>
	<SplitterPanel :default-size="defaultSize" :min-size="minSize" :max-size="maxSize" :class="class"
		><slot
	/></SplitterPanel>
</template>
