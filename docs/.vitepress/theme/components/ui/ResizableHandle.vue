<script setup lang="ts">
import { SplitterResizeHandle } from "reka-ui";
</script>
<template>
	<SplitterResizeHandle class="ui-resizable-handle" aria-label="调整左右面板宽度"
		><span aria-hidden="true"></span
	></SplitterResizeHandle>
</template>

<style scoped>
.ui-resizable-handle {
	position: relative;
	z-index: 2;
	flex: 0 0 10px;
	width: 10px;
	cursor: col-resize;
	background: var(--vp-c-bg);
	outline: none;
}
.ui-resizable-handle span {
	position: absolute;
	top: 50%;
	left: 50%;
	width: 2px;
	height: 40px;
	border-radius: 999px;
	background: var(--vp-c-divider);
	transform: translate(-50%, -50%);
	transition:
		height 160ms ease,
		background-color 160ms ease;
}
.ui-resizable-handle:hover span,
.ui-resizable-handle:focus-visible span,
.ui-resizable-handle[data-resize-handle-active] span {
	height: 64px;
	background: var(--vp-c-brand-1);
}
.ui-resizable-handle:focus-visible {
	box-shadow: 0 0 0 2px var(--vp-c-brand-soft);
}
</style>
