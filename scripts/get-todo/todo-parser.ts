import type { ParseResult, ParseTodoInput, TodoKind, TodoMatch } from "./types.ts";

const MARKDOWN_EXTENSIONS = new Set([".md", ".mdx"]);
const TODO_MARKER = /\bTODO\b/;
const TODO_COMMENT = /<!--\s*TODO\b(?:\s*:\s*)?(.*?)\s*-->/;
const TODO_COMMENT_GLOBAL = /<!--\s*TODO\b(?:\s*:\s*)?(.*?)\s*-->/g;
const HEADING_WITH_TODO = /^(#{2,6})\s+(.*?)\s*<!--\s*TODO\b(?:\s*:\s*)?(.*?)\s*-->\s*(.*)$/;
const MARKDOWN_COMMENT_ONLY = /^\s*<!--\s*TODO\b(?:\s*:\s*)?(.*?)\s*-->\s*$/;
const SOURCE_COMMENT = /^\s*(?:\/\/|\/\*+|\*+|#|--|;|<!--)\s*TODO\b(?:\s*:\s*)?(.*?)\s*(?:\*\/|-->)?\s*$/;
const HEADING = /^\s*#{1,6}\s+/;
const FENCE = /^\s*(?:```|~~~)/;

function normalizeText(value: string): string {
	return value.replace(/\s+/g, " ").trim();
}

function isMarkdown(path: string): boolean {
	const dot = path.lastIndexOf(".");
	return dot >= 0 && MARKDOWN_EXTENSIONS.has(path.slice(dot).toLowerCase());
}

function createMatch(
	input: ParseTodoInput,
	line: number,
	kind: TodoKind,
	text: string,
	todoAnnotation: string,
	rawLine: string,
	ordinal: number,
): TodoMatch {
	return {
		id: `${input.repo}:${input.path}:${input.branch}:${line}:${kind}:${ordinal}`,
		repo: input.repo,
		path: input.path,
		branch: input.branch,
		line,
		kind,
		text: normalizeText(text),
		todoAnnotation: normalizeText(todoAnnotation),
		rawLine,
		sha: input.sha,
		htmlUrl: `${input.htmlUrl}#L${line}`,
		visibility: input.visibility,
		language: input.language,
	};
}

function findEmptyTodoContinuation(lines: string[], lineIndex: number): string | null {
	for (let index = lineIndex + 1; index < lines.length; index += 1) {
		const candidate = lines[index];
		if (!candidate.trim()) {
			continue;
		}
		if (HEADING.test(candidate) || FENCE.test(candidate) || TODO_MARKER.test(candidate)) {
			return null;
		}
		return normalizeText(candidate);
	}
	return null;
}

function parseMarkdownLine(input: ParseTodoInput, lines: string[], index: number, ordinal: number): TodoMatch[] {
	const rawLine = lines[index];
	const headingMatch = rawLine.match(HEADING_WITH_TODO);
	if (headingMatch) {
		const headingPrefix = normalizeText(headingMatch[2]);
		const annotation = normalizeText(headingMatch[3]);
		const headingText = normalizeText(headingMatch[4]);
		if (!headingText && !annotation && /^\d+$/.test(headingPrefix)) {
			return [];
		}
		if (!headingText) {
			return [];
		}
		return [createMatch(input, index + 1, "markdown-heading", headingText, annotation, rawLine, ordinal)];
	}

	const commentMatches = [...rawLine.matchAll(TODO_COMMENT_GLOBAL)];
	if (commentMatches.length === 0) {
		return [];
	}
	const trimmed = rawLine.trim();
	const standaloneMatch = trimmed.match(MARKDOWN_COMMENT_ONLY);
	if (standaloneMatch) {
		const annotation = normalizeText(standaloneMatch[1]);
		const text = annotation || findEmptyTodoContinuation(lines, index) || "";
		const kind: TodoKind = annotation ? "markdown-standalone" : text ? "markdown-standalone" : "unresolved_empty_todo";
		return [createMatch(input, index + 1, kind, text, annotation, rawLine, ordinal)];
	}

	return commentMatches.map((commentMatch, offset) => {
		const annotation = normalizeText(commentMatch[1]);
		return createMatch(input, index + 1, "markdown-inline", annotation, annotation, rawLine, ordinal + offset);
	});
}

function parseSourceLine(input: ParseTodoInput, line: string, index: number, ordinal: number): TodoMatch | null {
	const match = line.match(SOURCE_COMMENT);
	if (!match) {
		return null;
	}
	const text = normalizeText(match[1]);
	return createMatch(input, index + 1, "source-comment", text, text, line, ordinal);
}

/**
 * 解析单个文本文件中的 TODO 标记。
 * @example
 * parseTodoFile(input);
 */
export function parseTodoFile(input: ParseTodoInput): ParseResult {
	const lines = input.content.split(/\r?\n/);
	const matches: TodoMatch[] = [];
	let ordinal = 0;
	const markdown = isMarkdown(input.path);

	lines.forEach((line, index) => {
		const parsed = markdown
			? parseMarkdownLine(input, lines, index, ordinal)
			: parseSourceLine(input, line, index, ordinal);
		const lineMatches = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
		if (lineMatches.length > 0) {
			matches.push(...lineMatches);
			ordinal += lineMatches.length;
		}
	});

	return { matches };
}
