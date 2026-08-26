import type { TodoKind, TodoMatch, TodoScanArtifact } from "../../../scripts/get-todo/types.ts";

export type TodoTreeNodeType = "repository" | "branch" | "directory" | "file" | "todo";

export interface TodoTreeNode {
	id: string;
	type: TodoTreeNodeType;
	label: string;
	count: number;
	children: TodoTreeNode[];
	parentId?: string;
	repo?: string;
	branch?: string;
	path?: string;
	todo?: TodoMatch;
}

export interface TodoFilters {
	text?: string;
	search?: string;
	repo?: string | string[];
	repository?: string | string[];
	path?: string;
	branch?: string | string[];
	kind?: TodoKind | TodoKind[] | string;
}

export interface TodoTreeState {
	expanded: Record<string, boolean>;
	selectedId?: string | null;
}

function basename(repo: string): string {
	return repo.includes("/") ? repo.slice(repo.lastIndexOf("/") + 1) : repo;
}

function nodeIdPart(value: string): string {
	return encodeURIComponent(value);
}

function countTodos(node: TodoTreeNode): number {
	return node.type === "todo" ? 1 : node.children.reduce((sum, child) => sum + countTodos(child), 0);
}

function sortNodes(nodes: TodoTreeNode[]): TodoTreeNode[] {
	return nodes.sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id));
}

function ensureChild(
	parent: TodoTreeNode,
	type: TodoTreeNodeType,
	label: string,
	id: string,
	extra: Partial<TodoTreeNode> = {},
) {
	let child = parent.children.find((item) => item.id === id);
	if (!child) {
		child = { id, type, label, count: 0, children: [], parentId: parent.id, ...extra };
		parent.children.push(child);
	}
	return child;
}

/** 将 artifact 中的平面 TODO 记录转换为 Explorer 层级树。 */
export function buildTodoTree(artifact: TodoScanArtifact): TodoTreeNode[] {
	const roots: TodoTreeNode[] = [];
	const rootByRepo = new Map<string, TodoTreeNode>();
	const repositories = new Set<string>(artifact.repositories.map((repo) => repo.fullName));
	for (const repository of artifact.repositories) {
		const repoNode: TodoTreeNode = {
			id: `repo:${repository.fullName}`,
			type: "repository",
			label: repository.fullName,
			repo: repository.fullName,
			count: 0,
			children: [],
		};
		rootByRepo.set(repository.fullName, repoNode);
		roots.push(repoNode);
		if (repository.selectedBranch) {
			ensureChild(
				repoNode,
				"branch",
				repository.selectedBranch,
				`${repoNode.id}/branch:${nodeIdPart(repository.selectedBranch)}`,
				{
					repo: repository.fullName,
					branch: repository.selectedBranch,
				},
			);
		}
	}
	for (const todo of [...artifact.todos].sort((a, b) => a.id.localeCompare(b.id))) {
		const fullName = [...repositories].find((name) => name === todo.repo || basename(name) === todo.repo) ?? todo.repo;
		let repoNode = rootByRepo.get(fullName);
		if (!repoNode) {
			repoNode = {
				id: `repo:${fullName}`,
				type: "repository",
				label: fullName,
				repo: fullName,
				count: 0,
				children: [],
			};
			rootByRepo.set(fullName, repoNode);
			roots.push(repoNode);
		}
		const branchNode = ensureChild(
			repoNode,
			"branch",
			todo.branch,
			`${repoNode.id}/branch:${nodeIdPart(todo.branch)}`,
			{ repo: fullName, branch: todo.branch },
		);
		const segments = todo.path.split("/");
		const file = segments.pop() ?? todo.path;
		let parent = branchNode;
		let pathPrefix = "";
		for (const segment of segments) {
			pathPrefix = pathPrefix ? `${pathPrefix}/${segment}` : segment;
			parent = ensureChild(parent, "directory", segment, `${branchNode.id}/dir:${nodeIdPart(pathPrefix)}`, {
				repo: fullName,
				branch: todo.branch,
				path: pathPrefix,
			});
		}
		const fileNode = ensureChild(parent, "file", file, `${branchNode.id}/file:${nodeIdPart(todo.path)}`, {
			repo: fullName,
			branch: todo.branch,
			path: todo.path,
		});
		fileNode.children.push({
			id: `todo:${nodeIdPart(todo.id)}`,
			type: "todo",
			label: todo.text || todo.todoAnnotation || `TODO · ${todo.line}`,
			count: 1,
			children: [],
			parentId: fileNode.id,
			repo: fullName,
			branch: todo.branch,
			path: todo.path,
			todo,
		});
	}
	const finalize = (node: TodoTreeNode) => {
		sortNodes(node.children);
		node.children.forEach(finalize);
		node.count = countTodos(node);
	};
	roots.forEach(finalize);
	return sortNodes(roots);
}

function values(value: string | string[] | undefined): string[] {
	const items = value === undefined ? [] : Array.isArray(value) ? value : [value];
	return items.filter((item) => item.trim().length > 0);
}

function matches(todo: TodoMatch, filters: TodoFilters): boolean {
	const text = (filters.text ?? filters.search ?? "").trim().toLowerCase();
	if (text && !`${todo.text} ${todo.todoAnnotation} ${todo.path}`.toLowerCase().includes(text)) return false;
	const repoFilters = values(filters.repo ?? filters.repository);
	if (repoFilters.length && !repoFilters.some((repo) => repo === todo.repo || basename(repo) === todo.repo))
		return false;
	if (filters.path && !todo.path.toLowerCase().includes(filters.path.toLowerCase())) return false;
	const branchFilters = values(filters.branch);
	if (branchFilters.length && !branchFilters.includes(todo.branch)) return false;
	const kindFilters = values(filters.kind as string | string[] | undefined);
	if (kindFilters.length && !kindFilters.includes(todo.kind)) return false;
	return true;
}

/** 过滤树并重新计算父节点计数，不修改输入树。 */
export function filterTodoTree(nodes: TodoTreeNode[], filters: TodoFilters): TodoTreeNode[] {
	const visit = (node: TodoTreeNode): TodoTreeNode | null => {
		if (node.type === "todo") return node.todo && matches(node.todo, filters) ? { ...node, children: [] } : null;
		const children = node.children.map(visit).filter((child): child is TodoTreeNode => child !== null);
		if (!children.length) return null;
		return { ...node, children, count: children.reduce((sum, child) => sum + child.count, 0) };
	};
	return nodes.map(visit).filter((node): node is TodoTreeNode => node !== null);
}

export function countVisibleTodos(nodes: TodoTreeNode[]): number {
	return nodes.reduce((sum, node) => sum + countTodos(node), 0);
}

export function toggleTodoNode(state: TodoTreeState, nodeId: string): TodoTreeState {
	return { ...state, expanded: { ...state.expanded, [nodeId]: !(state.expanded[nodeId] ?? true) } };
}
