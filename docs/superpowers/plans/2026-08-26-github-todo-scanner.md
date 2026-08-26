# GitHub TODO Scanner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable TypeScript collector and CLI that scans `ruan-cat` owned GitHub repositories and emits an auditable TODO JSON artifact.

**Architecture:** A pure line-oriented parser is isolated from an `ofetch` GitHub client. A collector composes repository discovery, `dev/main/master` branch selection, recursive tree/blob retrieval, filtering and error aggregation. A `citty` CLI writes the versioned artifact atomically; a validator and fixtures provide offline acceptance.

**Tech Stack:** Node.js >=22.14.0, TypeScript executed by `tsx`, UnJS `ofetch` and `citty`, existing `consola`, Node built-in `node:test`.

## Global Constraints

- Only uppercase standalone `TODO` is recognized; `todo`, `Todo`, and `TODOLIST` are ignored.
- Branch priority is `dev`, then `main`, then `master`; no other fallback is allowed.
- Local no-token mode scans public repositories and reports `partial`; GitHub Actions without a token exits non-zero.
- Token names are `GITHUB_TOKEN` first and `GITHUB_PAT_TOKEN` second; tokens never enter logs or JSON.
- Markdown empty TODO continuation skips blank lines and stops at headings, fences, or another TODO.
- Numeric empty headings such as `## 015 <!-- TODO: -->` are blacklisted.
- TypeScript uses double quotes, tabs, explicit return types, JSDoc on exported entry points, and `consola.withTag(packageName)`.
- Keep the existing dirty `docs/prompts/index.md` change untouched.

---

### Task 1: Dependencies, scripts, and test harness

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `scripts/get-todo/todo-parser.test.ts`

**Interfaces:**

- Produces package scripts `todo:scan`, `todo:validate`, and a Node test command using `tsx`.

- [ ] **Step 1: Add failing parser test imports and cases**

Create a test file importing the not-yet-created `parseTodoFile` and asserting the seven supplied examples, blacklist, case sensitivity, and unresolved empty TODO behavior.

- [ ] **Step 2: Run the test to verify the expected missing-module failure**

Run `pnpm exec tsx --test scripts/get-todo/todo-parser.test.ts`.
Expected: FAIL because `scripts/get-todo/todo-parser.ts` does not exist.

- [ ] **Step 3: Add runtime dependencies and scripts**

Add `ofetch`, `citty`, and `tsx` with pnpm; add:

```json
"todo:scan": "tsx scripts/get-todo/cli.ts",
"todo:validate": "tsx scripts/get-todo/validate.ts",
"todo:test": "tsx --test scripts/get-todo/*.test.ts"
```

- [ ] **Step 4: Install and verify the dependency graph**

Run `pnpm install --frozen-lockfile=false`, then `pnpm list ofetch citty tsx` and confirm exit code 0.

---

### Task 2: Pure TODO parser

**Files:**

- Create: `scripts/get-todo/types.ts`
- Create: `scripts/get-todo/todo-parser.ts`
- Test: `scripts/get-todo/todo-parser.test.ts`

**Interfaces:**

- Consumes `parseTodoFile(input: ParseTodoInput): ParseResult`.
- Produces `TodoMatch`, `TodoKind`, and `ParseResult` types consumed by the collector.

- [ ] **Step 1: Keep the tests red and run the focused test**

Run `pnpm exec tsx --test scripts/get-todo/todo-parser.test.ts`; confirm failures name missing parser behavior rather than test syntax errors.

- [ ] **Step 2: Implement parser types and regex helpers**

Define `ParseTodoInput { path, content, sha, branch, repo, visibility, language, htmlUrl }`, `TodoMatch` with 1-based `line`, `kind`, `text`, `todoAnnotation`, `rawLine`, and a stable `id` input. Implement exact uppercase token matching, Markdown heading/inline/standalone precedence, numeric empty-heading blacklist, comment prefixes, and empty TODO continuation boundaries.

- [ ] **Step 3: Run parser tests to verify green**

Run `pnpm exec tsx --test scripts/get-todo/todo-parser.test.ts`; expect all parser cases to pass.

- [ ] **Step 4: Refactor only after green**

Extract small helpers for line classification and whitespace normalization while keeping the public parser signature unchanged; rerun the focused test.

---

### Task 3: GitHub REST client

**Files:**

- Create: `scripts/get-todo/github-client.ts`
- Create: `scripts/get-todo/github-client.test.ts`

**Interfaces:**

- Produces `GitHubClient` methods `listOwnedRepositories`, `branchExists`, `getRecursiveTree`, `getTree`, and `getBlobText`.
- Uses `ofetch` with `Accept: application/vnd.github+json`, API version header, optional Bearer token, timeout, pagination and retry/backoff.

- [ ] **Step 1: Write failing client contract tests**

Use an injected fetch implementation to assert pagination, `dev/main/master` probing, and `403/429` retry metadata without contacting GitHub.

- [ ] **Step 2: Run client tests and verify red**

Run `pnpm exec tsx --test scripts/get-todo/github-client.test.ts`; expect failures because the client is absent.

- [ ] **Step 3: Implement the client**

Implement typed REST calls, parse `Link` pagination, select the first available branch, retrieve recursive trees, fall back to directory trees when `truncated=true`, reject binary/oversized blobs before fetching, and surface sanitized errors containing status and repository context only.

- [ ] **Step 4: Run client tests to verify green**

Run `pnpm exec tsx --test scripts/get-todo/github-client.test.ts`; expect all contract tests to pass.

---

### Task 4: Collector and JSON contract

**Files:**

- Create: `scripts/get-todo/collector.ts`
- Create: `scripts/get-todo/collector.test.ts`

**Interfaces:**

- Produces `collectTodos(options: CollectorOptions): Promise<TodoScanArtifact>`.
- Consumes `GitHubClient`, parser, extension filters, max-byte limit, and concurrency limit 4.

- [ ] **Step 1: Write failing collector tests**

Inject a fake client returning public/private repositories, a `dev` branch, tree entries, and blob text; assert artifact counts, repository status, `partial` mode, stable IDs, `visibility`, and `language`.

- [ ] **Step 2: Run collector tests and verify red**

Run `pnpm exec tsx --test scripts/get-todo/collector.test.ts`; expect failures because collector is absent.

- [ ] **Step 3: Implement collection orchestration**

Discover `type=owner` repositories, apply token-mode rules, select branches, filter files by extension/path/size, fetch blobs with a four-worker queue, parse matches, aggregate errors and produce deterministic repository/TODO ordering.

- [ ] **Step 4: Run collector tests to verify green**

Run `pnpm exec tsx --test scripts/get-todo/collector.test.ts`; expect all assertions to pass.

---

### Task 5: CLI, atomic output, and contract validator

**Files:**

- Create: `scripts/get-todo/cli.ts`
- Create: `scripts/get-todo/validate.ts`
- Create: `scripts/get-todo/cli.test.ts`
- Modify: `package.json`

**Interfaces:**

- `cli.ts` accepts `--owner`, `--output`, `--extensions`, `--max-file-bytes`, and `--fixture`; exits 0 for local partial scans and non-zero for Actions auth failure or global failure.
- `validate.ts` accepts a JSON path and exits non-zero for missing fields, invalid enum values, or count mismatches.

- [ ] **Step 1: Write failing CLI/validator tests**

Assert fixture mode writes JSON via temporary rename, validator accepts a valid artifact, rejects a missing `schemaVersion`, and logs no token value.

- [ ] **Step 2: Run CLI tests and verify red**

Run `pnpm exec tsx --test scripts/get-todo/cli.test.ts`; expect failures because entry points are absent.

- [ ] **Step 3: Implement CLI and validator**

Use `citty` for options, existing package metadata plus `consola.withTag(packageName)`, explicit UTF-8 writes, deterministic JSON formatting, and sanitized summaries. Keep `artifacts/github-todos/ruan-cat.json` tracked so the VitePress site can consume the latest artifact; do not add this directory to `.gitignore`.

- [ ] **Step 4: Run CLI tests to verify green**

Run `pnpm exec tsx --test scripts/get-todo/cli.test.ts`; expect all tests to pass.

---

### Task 6: Fixtures, documentation, and end-to-end verification

**Files:**

- Create: `scripts/get-todo/fixtures/sample.md`
- Create: `scripts/get-todo/fixtures/sample.ts`
- Create: `scripts/get-todo/fixtures/expected.json`
- Create: `artifacts/github-todos/ruan-cat.json` (tracked latest artifact)
- Create or modify: `.github/workflows/get-todo.yml`
- Modify: `README.md` or `docs/prompts/index.md` only if a usage link is needed

**Interfaces:**

- Produces an offline fixture command and an optional daily Actions workflow that invokes the same CLI.

- [ ] **Step 1: Run the complete offline suite**

Run `pnpm todo:test`; expect all parser, client, collector, and CLI tests to pass.

- [ ] **Step 2: Run fixture collection and validation**

Run `pnpm todo:scan -- --fixture scripts/get-todo/fixtures --output artifacts/github-todos/ruan-cat.json`, then `pnpm todo:validate -- artifacts/github-todos/ruan-cat.json`; expect exit code 0 and the seven sample matches.

- [ ] **Step 3: Run real authenticated read-only smoke**

With `GITHUB_PAT_TOKEN` available, run `pnpm todo:scan -- --owner ruan-cat --output artifacts/github-todos/ruan-cat.json`; inspect counts, selected `dev` branches, private repository entries, and redacted logs.

- [ ] **Step 4: Run style and integrity gates**

Run `pnpm exec prettier --experimental-cli --check "scripts/get-todo/**/*.{ts,json,md}" package.json`, `pnpm todo:validate -- artifacts/github-todos/ruan-cat.json`, and `git diff --check`.

- [ ] **Step 5: Verify worktree scope**

Run `git status --short --untracked-files=all`; confirm only intended scanner files, generated artifact/workflow/docs, dependency manifests, and the pre-existing `docs/prompts/index.md` modification are present.
