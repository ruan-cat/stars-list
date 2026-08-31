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
	<aside
		class="h-full min-h-0 overflow-auto bg-background p-5 max-[900px]:h-auto max-[900px]:overflow-visible"
		aria-live="polite"
	>
		<template v-if="node">
			<div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-primary">
				<span class="inline-flex items-center justify-center text-primary" aria-hidden="true"
					><FileCode2 v-if="node.type === 'todo' || node.type === 'file'" :size="15" /><FolderTree
						v-else-if="node.type === 'directory'"
						:size="15" /><GitBranch v-else-if="node.type === 'branch'" :size="15" /><Layers3 v-else :size="15"
				/></span>
				<span>{{ node.type }}</span>
			</div>
			<h2 class="mt-3 text-[1.35rem] leading-[1.35] text-foreground [overflow-wrap:anywhere]">{{ node.label }}</h2>
			<p class="mt-2 text-[.95rem] leading-[1.65] text-muted-foreground">
				{{ node.todo?.text || `当前节点包含 ${node.count} 项 TODO。` }}
			</p>
			<div class="mt-5 border-t border-border pt-4">
				<p class="mb-2.5 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">上下文</p>
				<dl class="grid grid-cols-2 gap-3 text-sm">
					<div v-if="node.todo?.repo || node.repo">
						<dt class="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
							<Icon
								class="size-3.5 shrink-0 text-primary"
								:icon="metadataIcons.repo"
								width="14"
								height="14"
								aria-hidden="true"
							/>仓库
						</dt>
						<dd class="m-0 text-foreground [overflow-wrap:anywhere]">{{ node.todo?.repo ?? node.repo }}</dd>
					</div>
					<div v-if="node.todo?.path || node.path">
						<dt class="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
							<Icon
								class="size-3.5 shrink-0 text-primary"
								:icon="metadataIcons.path"
								width="14"
								height="14"
								aria-hidden="true"
							/>路径
						</dt>
						<dd class="m-0 text-foreground [overflow-wrap:anywhere]">{{ node.todo?.path ?? node.path }}</dd>
					</div>
					<div v-if="node.todo?.branch || node.branch">
						<dt class="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
							<Icon
								class="size-3.5 shrink-0 text-primary"
								:icon="metadataIcons.branch"
								width="14"
								height="14"
								aria-hidden="true"
							/>分支
						</dt>
						<dd class="m-0 text-foreground [overflow-wrap:anywhere]">{{ node.todo?.branch ?? node.branch }}</dd>
					</div>
					<div v-if="node.todo?.line">
						<dt class="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
							<Icon
								class="size-3.5 shrink-0 text-primary"
								:icon="metadataIcons.line"
								width="14"
								height="14"
								aria-hidden="true"
							/>行号
						</dt>
						<dd class="m-0 text-foreground [overflow-wrap:anywhere]">{{ node.todo.line }}</dd>
					</div>
				</dl>
			</div>
			<div v-if="node.todo?.commitSha || node.todo?.source" class="mt-5 border-t border-border pt-4">
				<p class="mb-2.5 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">来源</p>
				<p class="m-0 font-mono text-xs text-muted-foreground">
					{{ node.todo.commitSha ? `commit ${node.todo.commitSha.slice(0, 8)}` : node.todo.source }}
				</p>
			</div>
			<div
				v-if="node.todo?.htmlUrl"
				class="sticky bottom-0 -mx-5 mt-5 bg-gradient-to-t from-background via-background/90 to-transparent px-5 pb-1 pt-3"
			>
				<a
					class="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-semibold text-primary no-underline transition-colors hover:border-primary hover:bg-accent"
					:href="node.todo.htmlUrl"
					target="_blank"
					rel="noreferrer"
					><span>在 GitHub 查看</span><ExternalLink :size="15" aria-hidden="true"
				/></a>
			</div>
		</template>
		<p v-else class="rounded-md border border-dashed border-border p-8 text-center text-muted-foreground">
			选择左侧节点查看详情。
		</p>
	</aside>
</template>
<!-- Visual styling is expressed with Tailwind semantic tokens above. -->
