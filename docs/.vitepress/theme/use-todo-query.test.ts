import test from "node:test";
import assert from "node:assert/strict";
import { createSingleFlight, MIN_REFRESH_INDICATOR_MS, withMinimumDuration } from "./use-todo-query.ts";

test("keeps the refresh indicator visible for a minimum duration", async () => {
	const startedAt = Date.now();
	await withMinimumDuration(startedAt, Promise.resolve("ok"));
	assert.ok(Date.now() - startedAt >= MIN_REFRESH_INDICATOR_MS);
});

test("coalesces concurrent refresh calls and allows a new call after settlement", async () => {
	let calls = 0;
	let resolveRequest: ((value: string) => void) | undefined;
	const flight = createSingleFlight(() =>
		(calls += 1) === 1
			? new Promise<string>((resolve) => {
					resolveRequest = resolve;
				})
			: Promise.resolve("next"),
	);
	const first = flight();
	const second = flight();
	assert.strictEqual(first, second);
	assert.equal(calls, 1);
	resolveRequest?.("fresh");
	assert.equal(await first, "fresh");
	assert.equal(await flight(), "next");
	assert.equal(calls, 2);
});
