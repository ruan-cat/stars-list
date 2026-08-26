<script setup lang="ts">
import { SplitterGroup } from "reka-ui";
defineProps<{ direction: "horizontal" | "vertical"; autoSaveId?: string }>();
</script>
<template>
	<SplitterGroup :direction="direction" :auto-save-id="autoSaveId" :keyboard-resize-by="4"><slot /></SplitterGroup>
</template>
