import test from "node:test";
import assert from "node:assert/strict";
import { MIN_REFRESH_INDICATOR_MS, withMinimumDuration } from "./use-todo-query.ts";

test("keeps the refresh indicator visible for a minimum duration", async () => {
	const startedAt = Date.now();
	await withMinimumDuration(startedAt, Promise.resolve("ok"));
	assert.ok(Date.now() - startedAt >= MIN_REFRESH_INDICATOR_MS);
});
