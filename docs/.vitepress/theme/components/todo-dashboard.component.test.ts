import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { TodoScanArtifact } from "../../../scripts/get-todo/types";
import TodoDashboard from "./TodoDashboard.vue";
import TodoFilters from "./TodoFilters.vue";

enableAutoUnmount(afterEach);

const artifact: TodoScanArtifact = {
	schemaVersion: 1,
	generatedAt: "2026-08-31T00:00:00.000Z",
	scan: {
		owner: "ruan-cat",
		repositoryScope: "owner",
		branchStrategy: ["main"],
		authMode: "public-only",
		completeness: "complete",
		extensions: [".md"],
		maxFileBytes: 1000,
	},
	summary: {
		repositoryCount: 1,
		scannedRepositoryCount: 1,
		todoCount: 1,
		unresolvedEmptyTodoCount: 0,
		skippedFileCount: 0,
		errorCount: 0,
	},
	repositories: [
		{
			fullName: "ruan-cat/demo",
			visibility: "public",
			selectedBranch: "main",
			status: "scanned",
			todoCount: 1,
			errors: [],
		},
	],
	todos: [
		{
			id: "todo-1",
			repo: "demo",
			path: "README.md",
			branch: "main",
			line: 1,
			kind: "markdown-inline",
			text: "document",
			todoAnnotation: "document",
			rawLine: "<!-- TODO document -->",
			sha: "sha",
			htmlUrl: "https://github.com/ruan-cat/demo/blob/main/README.md#L1",
			visibility: "public",
			language: "Markdown",
		},
	],
	errors: [],
};

function mountDashboard() {
	return mount(TodoDashboard, {
		attachTo: document.body,
		global: {
			plugins: [
				[
					VueQueryPlugin,
					{
						queryClient: new QueryClient({
							defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
						}),
					},
				],
			],
		},
	});
}

function mountFilters() {
	return mount(TodoFilters, {
		attachTo: document.body,
		props: {
			modelValue: { search: "", repo: "", branch: "", kind: "" },
			artifact,
		},
	});
}

describe("TodoFilters component contract", () => {
	test("opens the repository trigger with Enter and returns focus after Escape", async () => {
		const wrapper = mountFilters();
		const trigger = wrapper.get('[aria-label="仓库"]');
		trigger.element.focus();

		await trigger.trigger("keydown", { key: "Enter" });
		await flushPromises();
		expect(trigger.attributes("aria-expanded")).toBe("true");

		await trigger.trigger("keydown", { key: "ArrowDown" });
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
		await flushPromises();
		await new Promise((resolve) => setTimeout(resolve, 30));
		expect(trigger.attributes("aria-expanded")).toBe("false");
		expect(document.activeElement).toBe(trigger.element);
	});

	test("opens with Space and moves the highlighted option with both arrow keys", async () => {
		const wrapper = mountFilters();
		const trigger = wrapper.get('[aria-label="仓库"]');
		trigger.element.focus();

		await trigger.trigger("keydown", { key: " " });
		await flushPromises();
		expect(trigger.attributes("aria-expanded")).toBe("true");
		expect(document.activeElement?.getAttribute("role")).toBe("option");

		document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
		await vi.waitFor(() => expect(document.activeElement?.textContent).toContain("demo"));

		document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
		await vi.waitFor(() => expect(document.activeElement?.textContent).toContain("所有仓库"));

		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
		await flushPromises();
		await new Promise((resolve) => setTimeout(resolve, 30));
		expect(trigger.attributes("aria-expanded")).toBe("false");
		expect(document.activeElement).toBe(trigger.element);
	});

	test("submits the highlighted repository with ArrowDown and Enter", async () => {
		const wrapper = mountFilters();
		const trigger = wrapper.get('[aria-label="仓库"]');
		trigger.element.focus();
		await trigger.trigger("keydown", { key: "Enter" });
		await flushPromises();
		document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
		await flushPromises();
		await vi.waitFor(() => expect(document.activeElement?.textContent).toContain("demo"));
		document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
		await flushPromises();
		await new Promise((resolve) => setTimeout(resolve, 30));

		const updates = wrapper.emitted("update:modelValue") as [[Record<string, string>]] | undefined;
		expect(updates?.at(-1)?.[0]).toMatchObject({ repo: "demo" });
		expect(trigger.attributes("aria-expanded")).toBe("false");
		expect(document.activeElement).toBe(trigger.element);
	});

	test("restores trigger focus when Reka emits close-auto-focus", async () => {
		const wrapper = mountFilters();
		const trigger = wrapper.get('[aria-label="仓库"]');
		trigger.element.focus();
		await trigger.trigger("keydown", { key: "Enter" });
		await flushPromises();

		const content = wrapper.findAllComponents({ name: "SelectContent" })[0];
		expect(content).toBeDefined();
		const closeEvent = new Event("closeAutoFocus", { cancelable: true });
		content?.vm.$emit("closeAutoFocus", closeEvent);
		await flushPromises();
		await new Promise((resolve) => setTimeout(resolve, 30));

		expect(document.activeElement).toBe(trigger.element);
	});

	test("keeps the search and three select controls enabled and keyboard reachable", () => {
		const wrapper = mountFilters();
		expect(wrapper.get('[aria-label="搜索 TODO"]').attributes("type")).toBe("search");
		const controls = [
			wrapper.get('[aria-label="搜索 TODO"]'),
			wrapper.get('[aria-label="仓库"]'),
			wrapper.get('[aria-label="分支"]'),
			wrapper.get('[aria-label="类型"]'),
		];
		expect(controls.every((control) => control.attributes("disabled") === undefined)).toBe(true);
		expect(controls.every((control) => control.attributes("aria-disabled") === undefined)).toBe(true);
		expect(wrapper.findAll("[aria-label]").map((item) => item.attributes("aria-label"))).toEqual([
			"筛选 TODO",
			"搜索 TODO",
			"仓库",
			"分支",
			"类型",
		]);
	});
});

describe("TodoDashboard loading and refresh contract", () => {
	let originalFetch: typeof globalThis.fetch;

	beforeEach(() => {
		originalFetch = globalThis.fetch;
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	test("exposes a retryable initial failure without fake counts", async () => {
		globalThis.fetch = vi
			.fn()
			.mockRejectedValueOnce(new Error("forced initial failure"))
			.mockResolvedValueOnce(new Response(JSON.stringify(artifact), { status: 200 }));
		const wrapper = mountDashboard();
		await vi.waitFor(() => expect(wrapper.get('[role="alert"]').text()).toContain("Failed to fetch TODO artifact"));

		expect(wrapper.get('[role="alert"]').text()).toContain("Failed to fetch TODO artifact");
		expect(wrapper.text()).not.toContain("0 可见 TODO");
		const refreshButton = wrapper.get('[aria-label="刷新快照"]');
		expect(refreshButton.attributes("disabled")).toBeUndefined();

		refreshButton.element.focus();
		await refreshButton.trigger("click");
		await vi.waitFor(() => expect(refreshButton.attributes("disabled")).toBeDefined());
		await vi.waitFor(() => expect(refreshButton.attributes("disabled")).toBeUndefined());
		await new Promise((resolve) => setTimeout(resolve, 30));
		expect(wrapper.text()).toContain("1 个仓库");
		expect(document.activeElement).toBe(refreshButton.element);
	});

	test("disables refresh while pending and coalesces duplicate clicks", async () => {
		let resolveRefresh: ((value: Response) => void) | undefined;
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(new Response(JSON.stringify(artifact), { status: 200 }))
			.mockImplementationOnce(
				() =>
					new Promise<Response>((resolve) => {
						resolveRefresh = resolve;
					}),
			);
		globalThis.fetch = fetchMock;
		const wrapper = mountDashboard();
		await vi.waitFor(() => expect(wrapper.text()).toContain("1 可见 TODO"));

		const refreshButton = wrapper.get('[aria-label="刷新快照"]');
		refreshButton.element.focus();
		await refreshButton.trigger("click");
		await vi.waitFor(() => expect(refreshButton.attributes("disabled")).toBeDefined());
		expect(refreshButton.attributes("aria-busy")).toBe("true");
		await refreshButton.trigger("click");
		expect(fetchMock).toHaveBeenCalledTimes(2);

		resolveRefresh?.(new Response(JSON.stringify(artifact), { status: 200 }));
		await vi.waitFor(() => expect(refreshButton.attributes("disabled")).toBeUndefined());
		await new Promise((resolve) => setTimeout(resolve, 30));
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(document.activeElement).toBe(refreshButton.element);
	});
});
