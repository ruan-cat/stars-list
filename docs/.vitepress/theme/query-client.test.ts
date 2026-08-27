import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "vue";
import { createTodoQueryClient, installTodoQuery } from "./query-client.ts";

test("keeps the seven-day TODO cache window in the browser", () => {
	const client = createTodoQueryClient(false);
	const defaults = client.getDefaultOptions().queries;

	assert.equal(defaults?.staleTime, 30 * 60 * 1000);
	assert.equal(defaults?.gcTime, 7 * 24 * 60 * 60 * 1000);
});

test("disables the Query GC timer during SSR", () => {
	const client = createTodoQueryClient(true);
	const defaults = client.getDefaultOptions().queries;

	assert.equal(defaults?.staleTime, 30 * 60 * 1000);
	assert.equal(defaults?.gcTime, Infinity);
});

test("installs Vue Query on a Vue app", () => {
	const app = createApp({ render: () => null });

	assert.doesNotThrow(() => installTodoQuery(app));
	assert.ok(app._context.provides);
});
