# GitHub TODO Scanner Git-first/degit Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace REST content scanning with a manifest-driven degit snapshot pipeline while preserving the existing parser and JSON contract.

**Architecture:** The REST client remains only a best-effort manifest refresher. A Git ref resolver selects `dev`, `main`, or `master` with `git ls-remote`; a degit adapter downloads a clean snapshot and falls back to temporary Git/SSH for private failures. The collector scans and deletes temporary directories, while bounded cache metadata prevents local accumulation.

**Tech Stack:** Node.js >=22.14.0, TypeScript/tsx, UnJS `degit` and `citty`, existing `ofetch`/`consola`, Node built-in `node:test`, native Git.

## Global Constraints

- `fork=true` repositories are excluded by default and recorded with `skipReason=fork`.
- Branch order is `dev`, then `main`, then `master`; no default-branch fallback.
- API failure may reuse an existing manifest but must set `manifestStale=true`.
- No extracted snapshot directory or `.git` directory persists after a run.
- Windows cache is bounded to 512 MiB and 7 days; Actions does not cache private source code by default.
- Actions strict mode fails without a manifest, with manifest age over 30 days, or with any original repository scan failure.
- Tokens are read from environment/credential helpers and never placed in URLs, logs, artifacts, or cache indexes.

---

### Task 1: Manifest schema and fork filtering

**Files:**

- Create: `scripts/get-todo/repositories.json`
- Create: `scripts/get-todo/manifest.ts`
- Create: `scripts/get-todo/manifest.test.ts`
- Modify: `scripts/get-todo/types.ts`

**Interfaces:**

- `loadManifest(path: string): Promise<RepositoryManifest>`
- `writeManifest(path: string, manifest: RepositoryManifest): Promise<void>`
- `filterScannableRepositories(manifest, includeForks = false): ManifestRepository[]`

- [ ] **Step 1: Write failing manifest tests**

Assert schema parsing, atomic write/readback, default fork exclusion, archived inclusion, and stale age calculation.

- [ ] **Step 2: Run `pnpm exec tsx --test scripts/get-todo/manifest.test.ts` and verify red**

Expected: module-not-found failure for `manifest.ts`.

- [ ] **Step 3: Implement manifest types, loader, atomic writer, and fork filter**

Reject invalid schema/version, keep source metadata only, and write with UTF-8 temporary file plus rename.

- [ ] **Step 4: Run the focused manifest test and verify green**

Expected: all manifest assertions pass.

---

### Task 2: Git ref resolver

**Files:**

- Create: `scripts/get-todo/git-client.ts`
- Create: `scripts/get-todo/git-client.test.ts`

**Interfaces:**

- `resolvePreferredBranch(remote: string, token?: string): Promise<{ branch: string; commitSha: string } | null>`
- `listRemoteBranches(remote: string, token?: string): Promise<Map<string, string>>`

- [ ] **Step 1: Write failing tests with a fake command runner**

Return refs for `dev`, `main`, and `master`; assert dev wins, missing refs return null, and authorization is passed without appearing in error text.

- [ ] **Step 2: Run the focused test and verify red**

Run `pnpm exec tsx --test scripts/get-todo/git-client.test.ts`; expect missing-module failure.

- [ ] **Step 3: Implement `git ls-remote --heads` with safe credential injection**

Use `http.extraheader` or SSH agent configuration outside command arguments, parse SHA/ref pairs, and return sanitized errors.

- [ ] **Step 4: Run the focused test and verify green**

Expected: branch priority and credential redaction assertions pass.

---

### Task 3: degit adapter and private fallback

**Files:**

- Add dependency: `degit`
- Create: `scripts/get-todo/degit-client.ts`
- Create: `scripts/get-todo/degit-client.test.ts`

**Interfaces:**

- `downloadSnapshot(input: SnapshotRequest): Promise<SnapshotResult>`
- `SnapshotRequest { fullName, branch, commitSha, destination, token?, sshMode? }`
- `SnapshotResult { source: "degit" | "git-fallback"; commitSha; cacheStatus }`

- [ ] **Step 1: Write failing adapter tests**

Inject a fake degit emitter and fake Git fallback; assert `repo#branch`, temporary destination, `.git` removal, retry-once behavior, and sanitized errors.

- [ ] **Step 2: Run the focused test and verify red**

Run `pnpm exec tsx --test scripts/get-todo/degit-client.test.ts`; expect missing adapter failure.

- [ ] **Step 3: Implement degit tar download and fallback**

Call the degit ESM API in tar mode, forward only safe progress events, retry once with cache disabled after a stale/corrupt cache, then clone privately into a separate temporary directory and copy files without `.git`.

- [ ] **Step 4: Run the focused test and verify green**

Expected: public degit and private fallback cases pass.

---

### Task 4: Bounded cache and cleanup

**Files:**

- Create: `scripts/get-todo/cache.ts`
- Create: `scripts/get-todo/cache.test.ts`
- Modify: `scripts/get-todo/cli.ts`

**Interfaces:**

- `createRunDirectory(): Promise<string>`
- `pruneCache(options: CacheOptions): Promise<CacheReport>`
- `cleanupRunDirectory(path: string): Promise<void>`

- [ ] **Step 1: Write failing cache tests**

Create temporary cache entries with old timestamps and sizes over 512 MiB; assert oldest-first pruning, 7-day expiry, path safety, and cleanup in a simulated rejection path.

- [ ] **Step 2: Run cache tests and verify red**

Run `pnpm exec tsx --test scripts/get-todo/cache.test.ts`; expect missing-module failure.

- [ ] **Step 3: Implement bounded cache and `finally` cleanup**

Use only `%LOCALAPPDATA%\ruan-cat\github-todo` and `%TEMP%` run directories, validate resolved paths before deletion, and expose `--clear-cache`.

- [ ] **Step 4: Run cache tests and verify green**

Expected: all pruning and cleanup assertions pass.

---

### Task 5: Local snapshot collector integration

**Files:**

- Create: `scripts/get-todo/local-snapshot-collector.ts`
- Create: `scripts/get-todo/local-snapshot-collector.test.ts`
- Modify: `scripts/get-todo/collector.ts`
- Modify: `scripts/get-todo/types.ts`

**Interfaces:**

- `collectFromManifest(options: SnapshotCollectorOptions): Promise<TodoScanArtifact>`

- [ ] **Step 1: Write failing integration tests**

Inject manifest, ref resolver, snapshot adapter and parser fixture; assert fork exclusion, branch/commit metadata, `manifestStale`, source/cache fields, and complete/partial status.

- [ ] **Step 2: Run integration tests and verify red**

Run `pnpm exec tsx --test scripts/get-todo/local-snapshot-collector.test.ts`; expect missing-module failure.

- [ ] **Step 3: Implement manifest-driven collection**

Refresh manifest best-effort, use old manifest on rate-limit, process at most four repositories concurrently, scan filtered files with existing parser, and always clean run directories.

- [ ] **Step 4: Run integration tests and verify green**

Expected: all source, fork, stale and cleanup assertions pass.

---

### Task 6: CLI/workflow migration

**Files:**

- Modify: `scripts/get-todo/cli.ts`
- Modify: `package.json`
- Modify: `.github/workflows/get-todo.yml`
- Modify: `.github/workflows/schedules.yml` only if the TODO workflow is merged into the existing schedule

**Interfaces:**

- Add `--transport degit|api`, default `degit`.
- Add `--manifest`, `--include-forks`, `--clear-cache`, `--strict`.

- [ ] **Step 1: Write failing CLI tests for transport selection**

Assert default degit, explicit API fallback, strict stale failure, and one combined commit message for manifest/artifact changes.

- [ ] **Step 2: Run CLI tests and verify red**

Run `pnpm exec tsx --test scripts/get-todo/cli.test.ts`; assert the new options fail before implementation.

- [ ] **Step 3: Implement CLI and workflow wiring**

Make degit the default content transport, keep API as explicit diagnostic fallback, pass PAT through environment, and commit only complete outputs with `🐎 ci(todo): 更新 GitHub TODO 扫描清单与结果`.

- [ ] **Step 4: Run CLI tests and validate workflow formatting**

Run `pnpm todo:test` and `pnpm exec prettier --experimental-cli --check --no-parallel ".github/workflows/*.yml" "scripts/get-todo/**/*.{ts,json,md}" package.json`.

---

### Task 7: End-to-end acceptance and handoff evidence

**Files:**

- Modify: `scripts/get-todo/fixtures/expected.json`
- Create: `scripts/get-todo/fixtures/manifest.json`
- Create: `docs/superpowers/reports/2026-08-26-github-todo-git-first-verification.md`

- [ ] **Step 1: Run the complete offline suite**

Run `pnpm todo:test`; record the exact pass count.

- [ ] **Step 2: Run a public degit smoke**

Use `octocat/Hello-World#master` or another public fixture, verify the destination has no `.git`, and run the existing parser against it.

- [ ] **Step 3: Run private fallback only with authorized credentials**

Use `GITHUB_PAT_TOKEN` or SSH agent, inspect process arguments and JSON for redaction, and delete all temporary directories afterward.

- [ ] **Step 4: Simulate API rate-limit fallback**

Use a fake manifest refresher that returns 403/429, verify old manifest scanning, `manifestStale=true`, and strict-mode behavior.

- [ ] **Step 5: Run final integrity gates**

Run TypeScript typecheck, Prettier check, `git diff --check`, artifact validation, and `git status --short --untracked-files=all`; confirm no `.git` snapshot directories or token-like literals remain.
