# Prompt 3C Validation Toolchain Results

Prompt 3C creates a reusable validation runner and Linux CI route for foundation validation. It does not expand product/backend functionality.

PR: [#79](https://github.com/yuzastudio6-cyber/Reedkt/pull/79)

## Files Inspected

- `PRODUCTION_FOUNDATION_STATUS.md`
- `docs/source-of-truth-map.md`
- `docs/production-milestone-plan.md`
- `docs/auth-rls-validation-environment-runbook.md`
- `docs/prompt-03b-validation-environment-results.md`
- `docs/prompt-03a-auth-rls-fix-results.md`
- `docs/prompt-03-validation-results.md`
- `docs/auth-profile-workspace-production-path.md`
- `docs/auth-profile-workspace-hardening-checklist.md`
- `docs/auth-profile-workspace-rls-test-plan.md`
- `docs/auth-profile-workspace-route-contract.md`
- `scripts/validation/auth-rls-validation-diagnostics.mjs`
- `scripts/validation/supabase-schema-static-audit.mjs`
- `package.json`
- `package-lock.json`
- Vite and TypeScript config files
- `database/test-sql/006_auth_workspace_rls_smoke_tests.draft.sql`

## Changes Made

- Added `scripts/validation/run-foundation-validation.mjs`.
- Added package scripts `foundation:validate` and `foundation:validate:with-build`.
- Added `.github/workflows/foundation-validation.yml` for Linux CI validation.
- Added `docs/validation-toolchain-repair-runbook.md`.
- Updated Prompt 3B and source-of-truth docs with the Prompt 3C route.

## Validation Commands

Prompt 3C validation must record:

- `npm ci`
- `npm run --silent schema:static-audit`
- `npm run --silent auth:rls:diagnostics`
- `npm run foundation:validate`
- `npm run foundation:validate:with-build`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `git diff --check`
- `git diff --check origin/codex/rp-foundation-03b-auth-rls-validation-environment-fix...HEAD`

## Current Results

Direct npm remains host-blocked unless `PATH` prefers the arm64 Codex Node binary:

```text
env: node: Bad CPU type in executable
```

`npm ci` passed with:

```sh
PATH="/Applications/Codex.app/Contents/Resources:$PATH" npm ci
```

Result:

- 315 packages installed.
- 5 moderate npm audit findings reported.
- No `npm audit fix` was run.
- `package-lock.json` was not changed.
- `node_modules` was not committed.

Static audit passed with:

```sh
PATH="/Applications/Codex.app/Contents/Resources:$PATH" npm run --silent schema:static-audit
```

Summary:

- connects to Supabase: `false`
- reads environment secrets: `false`
- executes SQL: `false`
- uses Node built-ins only: `true`
- active migration files scanned: 21
- draft migration files scanned: 8
- test SQL files scanned: 6

Auth/RLS diagnostics passed with:

```sh
PATH="/Applications/Codex.app/Contents/Resources:$PATH" npm run --silent auth:rls:diagnostics
```

Summary:

- Node: `v24.14.0`
- platform/architecture: `darwin arm64`
- Supabase CLI found at `/usr/local/bin/supabase`
- Supabase CLI version attempt failed with `Unknown system error -86`
- blocked table matches: 0
- legacy `user_profiles` matches: 0
- forbidden runtime-domain matches: 0
- route metadata domain mentions: 34 expected metadata/notes mentions

Default foundation validation passed:

```sh
PATH="/Applications/Codex.app/Contents/Resources:$PATH" npm run foundation:validate
```

Result summary:

- overall status: `passed`
- lint: `passed`
- server typecheck: `passed`
- static schema audit: `passed`
- auth/RLS diagnostics: `passed`
- build: `skipped` by default

Foundation validation with build ran and classified the local full-build blocker:

```sh
PATH="/Applications/Codex.app/Contents/Resources:$PATH" npm run foundation:validate:with-build
```

Result summary:

- overall status: `environment_blocked`
- lint: `passed`
- server typecheck: `passed`
- static schema audit: `passed`
- auth/RLS diagnostics: `passed`
- build: `environment_blocked`

Direct `npm run lint` passed.

Direct `npm run typecheck:server` passed.

Direct `npm run build` remains environment-blocked after TypeScript reaches Vite/Rolldown:

```text
Error: Cannot find native binding.
ERR_DLOPEN_FAILED ... @rolldown/binding-darwin-arm64 ... code signature ... not valid for use in process:
mapping process and mapped file (non-platform) have different Team IDs
```

The Prompt 3C runner correctly classifies this as `environment_blocked`, not `code_failed`.

Whitespace validation passed:

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-03b-auth-rls-validation-environment-fix...HEAD`

GitHub Actions CI status is pending until PR checks run.

## RLS Status

`database/test-sql/006_auth_workspace_rls_smoke_tests.draft.sql` remains draft-only. Prompt 3C does not run local SQL/RLS, connect to remote Supabase, or promote the draft SQL file.

## Prompt 4 Decision

Default foundation validation passed locally. Prompt 4 should proceed only after the PR has a passing Linux CI full-build path. If Linux CI fails or local Supabase validation must be repaired first, recommend Prompt 3D - CI/Local Supabase Validation Repair.
