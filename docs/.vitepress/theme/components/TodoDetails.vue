<script setup lang="ts">
import { ExternalLink, FileCode2, FolderTree, GitBranch, Layers3 } from "lucide-vue-next";
import { Icon } from "@iconify/vue";
import repositoryMetaIcon from "@iconify-icons/mdi/source-repository";
import pathMetaIcon from "@iconify-icons/mdi/file-tree";
import branchMetaIcon from "@iconify-icons/mdi/source-branch";
import lineMetaIcon from "@iconify-icons/mdi/format-line-spacing";
import type { TodoTreeNode } from "../todo-tree";
defineProps<{ node: TodoTreeNode | null }>();
const metadataIcons = { repo: repositoryMetaIcon, path: pathMetaIcon, branch: branchMetaIcon, line: lineMetaIcon };
</script>
<template>
	<aside class="todo-details" aria-live="polite">
		<template v-if="node">
			<div class="todo-details__eyebrow">
				<span class="todo-details__type-icon" aria-hidden="true"
					><FileCode2 v-if="node.type === 'todo' || node.type === 'file'" :size="15" /><FolderTree
						v-else-if="node.type === 'directory'"
						:size="15" /><GitBranch v-else-if="node.type === 'branch'" :size="15" /><Layers3 v-else :size="15"
				/></span>
				<span>{{ node.type }}</span>
			</div>
			<h2>{{ node.label }}</h2>
			<p class="todo-details__summary">{{ node.todo?.text || `当前节点包含 ${node.count} 项 TODO。` }}</p>
			<div class="todo-details__section">
				<p class="todo-details__section-title">上下文</p>
				<dl class="todo-details__meta">
					<div v-if="node.todo?.repo || node.repo">
						<dt>
							<Icon class="metadata-icon" :icon="metadataIcons.repo" width="14" height="14" aria-hidden="true" />仓库
						</dt>
						<dd>{{ node.todo?.repo ?? node.repo }}</dd>
					</div>
					<div v-if="node.todo?.path || node.path">
						<dt>
							<Icon class="metadata-icon" :icon="metadataIcons.path" width="14" height="14" aria-hidden="true" />路径
						</dt>
						<dd>{{ node.todo?.path ?? node.path }}</dd>
					</div>
					<div v-if="node.todo?.branch || node.branch">
						<dt>
							<Icon class="metadata-icon" :icon="metadataIcons.branch" width="14" height="14" aria-hidden="true" />分支
						</dt>
						<dd>{{ node.todo?.branch ?? node.branch }}</dd>
					</div>
					<div v-if="node.todo?.line">
						<dt>
							<Icon class="metadata-icon" :icon="metadataIcons.line" width="14" height="14" aria-hidden="true" />行号
						</dt>
						<dd>{{ node.todo.line }}</dd>
					</div>
				</dl>
			</div>
			<div v-if="node.todo?.commitSha || node.todo?.source" class="todo-details__section">
				<p class="todo-details__section-title">来源</p>
				<p class="todo-details__source">
					{{ node.todo.commitSha ? `commit ${node.todo.commitSha.slice(0, 8)}` : node.todo.source }}
				</p>
			</div>
			<div v-if="node.todo?.htmlUrl" class="todo-details__action-bar">
				<a class="todo-details__action" :href="node.todo.htmlUrl" target="_blank" rel="noreferrer"
					><span>在 GitHub 查看</span><ExternalLink :size="15" aria-hidden="true"
				/></a>
			</div>
		</template>
		<p v-else class="todo-details__empty">选择左侧节点查看详情。</p>
	</aside>
</template>

<style scoped>
.todo-details {
	padding: 1.25rem;
	background: var(--vp-c-bg);
}
.todo-details__eyebrow {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	color: var(--vp-c-brand-1);
	font-size: 0.72rem;
	font-weight: 700;
	letter-spacing: 0.12em;
	text-transform: uppercase;
}
.todo-details__type-icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: var(--vp-c-brand-1);
}
.todo-details h2 {
	margin: 0.75rem 0 0;
	color: var(--vp-c-text-1);
	font-size: 1.35rem;
	line-height: 1.35;
	overflow-wrap: anywhere;
}
.todo-details__summary {
	margin: 0.55rem 0 0;
	color: var(--vp-c-text-2) !important;
	font-size: 0.95rem;
	line-height: 1.65;
}
.todo-details__section {
	margin-top: 1.35rem;
	padding-top: 1rem;
	border-top: 1px solid var(--vp-c-divider);
}
.todo-details__section-title {
	margin: 0 0 0.65rem;
	color: var(--vp-c-text-3) !important;
	font-size: 0.72rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
}
.todo-details__meta {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 0.8rem;
	font-size: 0.85rem;
}
.todo-details__meta div {
	min-width: 0;
}
.todo-details__meta dt {
	display: inline-flex;
	align-items: center;
	gap: 0.2rem;
	margin-bottom: 0.22rem;
	color: var(--vp-c-text-3);
	font-size: 0.75rem;
}
.metadata-icon {
	flex: 0 0 14px;
	color: var(--vp-c-brand-1);
}
.todo-details__meta dd {
	margin: 0;
	color: var(--vp-c-text-1);
	overflow-wrap: anywhere;
}
.todo-details__source {
	margin: 0;
	color: var(--vp-c-text-2) !important;
	font-family: var(--vp-font-family-mono);
	font-size: 0.8rem;
}
/* 详情内容超出面板高度时，动作栏吸附在滚动区底部，保证"在 GitHub 查看"按钮始终可见、不被裁切 */
.todo-details__action-bar {
	position: sticky;
	bottom: 0;
	margin: 1.35rem -1.25rem 0;
	padding: 0.9rem 1.25rem 0.35rem;
	background: linear-gradient(to top, var(--vp-c-bg) 78%, transparent);
}
.todo-details__action {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	padding: 0.55rem 0.7rem;
	border: 1px solid var(--vp-c-divider);
	border-radius: 6px;
	color: var(--vp-c-brand-1) !important;
	font-size: 0.85rem;
	font-weight: 600;
	text-decoration: none;
	transition:
		border-color 160ms ease,
		background-color 160ms ease;
}
.todo-details__action:hover {
	border-color: var(--vp-c-brand-1);
	background: var(--vp-c-brand-soft);
}
.todo-details a {
	color: var(--vp-c-brand-1);
}
.todo-details__empty {
	color: var(--vp-c-text-2) !important;
	padding: 2rem;
	text-align: center;
	border: 1px dashed var(--vp-c-divider);
	border-radius: 8px;
}
@media (max-width: 720px) {
	.todo-details {
		border-top: 1px solid var(--vp-c-divider);
	}
}
</style>
