import test from "node:test";
import assert from "node:assert/strict";
import { shouldGenerateDerivedDocs } from "./derived-docs.ts";

test("generates derived docs in GitHub Actions", () => {
	assert.equal(shouldGenerateDerivedDocs({ GITHUB_ACTIONS: "true" }), true);
});

test("generates derived docs only when explicitly enabled locally", () => {
	assert.equal(shouldGenerateDerivedDocs({ GENERATE_DERIVED_DOCS: "true" }), true);
	assert.equal(shouldGenerateDerivedDocs({}), false);
});
