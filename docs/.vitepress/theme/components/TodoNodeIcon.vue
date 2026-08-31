<script setup lang="ts">
import { computed } from "vue";
import { Icon } from "@iconify/vue";
import type { TodoTreeNode } from "../todo-tree";
import repositoryIcon from "@iconify-icons/mdi/source-repository";
import branchIcon from "@iconify-icons/mdi/source-branch";
import folderIcon from "@iconify-icons/vscode-icons/default-folder";
import folderOpenIcon from "@iconify-icons/vscode-icons/default-folder-opened";
import fileIcon from "@iconify-icons/vscode-icons/default-file";
import markdownIcon from "@iconify-icons/vscode-icons/file-type-markdown";
import typescriptIcon from "@iconify-icons/vscode-icons/file-type-typescript";
import javascriptIcon from "@iconify-icons/vscode-icons/file-type-js";
import vueIcon from "@iconify-icons/vscode-icons/file-type-vue";
import jsonIcon from "@iconify-icons/vscode-icons/file-type-json";
import yamlIcon from "@iconify-icons/vscode-icons/file-type-yaml";
import cssIcon from "@iconify-icons/vscode-icons/file-type-css";
import htmlIcon from "@iconify-icons/vscode-icons/file-type-html";
import pythonIcon from "@iconify-icons/vscode-icons/file-type-python";
import rustIcon from "@iconify-icons/vscode-icons/file-type-rust";
import goIcon from "@iconify-icons/vscode-icons/file-type-go";
import javaIcon from "@iconify-icons/vscode-icons/file-type-java";
import shellIcon from "@iconify-icons/vscode-icons/file-type-shell";
import sqlIcon from "@iconify-icons/vscode-icons/file-type-sql";

const props = defineProps<{ node: TodoTreeNode }>();
const icon = computed(() => {
	if (props.node.type === "repository") return repositoryIcon;
	if (props.node.type === "branch") return branchIcon;
	if (props.node.type === "directory") return props.node.children.length ? folderOpenIcon : folderIcon;
	const extension = (props.node.path?.split(".").pop() ?? "").toLowerCase();
	return (
		(
			{
				md: markdownIcon,
				mdx: markdownIcon,
				ts: typescriptIcon,
				tsx: typescriptIcon,
				js: javascriptIcon,
				jsx: javascriptIcon,
				vue: vueIcon,
				json: jsonIcon,
				yml: yamlIcon,
				yaml: yamlIcon,
				css: cssIcon,
				scss: cssIcon,
				html: htmlIcon,
				py: pythonIcon,
				rs: rustIcon,
				go: goIcon,
				java: javaIcon,
				sh: shellIcon,
				ps1: shellIcon,
				sql: sqlIcon,
			} as Record<string, typeof fileIcon>
		)[extension] ?? fileIcon
	);
});
</script>

<template><Icon class="block size-4 shrink-0" :icon="icon" width="16" height="16" aria-hidden="true" /></template>
