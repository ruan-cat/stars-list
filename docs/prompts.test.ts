import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { escapeVueInterpolations } from "./escape-vue-interpolations.ts";

test("escapes Vue interpolations in prompt archive HTML", () => {
	assert.equal(
		escapeVueInterpolations("<code>{{ secrets.GITHUB_TOKEN }}</code>"),
		"<code>&#123;&#123; secrets.GITHUB_TOKEN &#125;&#125;</code>",
	);
});

test("keeps the prompt archive source available to the VitePress page", async () => {
	const content = await readFile(new URL("./prompts/index.md", import.meta.url), "utf8");
	assert.match(content, /^---\r?\n/);
	assert.match(content, /GITHUB_TOKEN/);
});
