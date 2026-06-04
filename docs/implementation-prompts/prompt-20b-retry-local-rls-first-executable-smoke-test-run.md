# Prompt 20B-Retry Local RLS First Executable Smoke Test Run

## Summary

Run the first guarded local-only RLS smoke test from a clean sibling worktree based on Prompt 20P2.

- Branch: `codex/rp-foundation-20b-retry-local-rls-first-executable-smoke-test-run`
- Base: `origin/codex/rp-foundation-20p2-storage-ownership-privilege-follow-up`
- PR: [PR #166](https://github.com/yuzastudio6-cyber/Reedkt/pull/166)
- PR title: `[foundation] Prompt 20B retry local RLS first executable smoke test run`
- Exact capability enabled: `none; first local-only RLS smoke validation`

## Allowed Scope

- Start or confirm local Supabase only.
- Capture sanitized localhost DB evidence only.
- Export `REEDITPRO_LOCAL_SUPABASE_DB_URL` only for a verified localhost target.
- Run `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql` only through the guarded runner.
- Make minimal SQL-candidate compatibility fixes if needed for the actual local schema.
- Update evidence, manifests, scorecards, blockers, and trackers.

## Forbidden Scope

- No staging Supabase, remote Supabase, production Supabase, `supabase link`, remote SQL, or migration deployment to remote.
- No raw manual `psql` outside the guarded runner.
- No provider calls, rendering/export, tool execution, worker execution, production job claims, media processing, storage transfer, signed URL creation, credit mutation, Stripe/payment processing, external telemetry, dependency mutation, production/beta unlock, or broad service-role handlers.

## Deliverables

- `docs/prompt-20b-retry-local-rls-first-executable-smoke-test-run.md`
- Updated `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql` if needed.
- Updated local Supabase/RLS evidence, SQL manifest, beta scorecard, blocker inventory, production status, source map, milestone plan, implementation prompts README, and local SQL README.

## Validation Checklist

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-20p2-storage-ownership-privilege-follow-up...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run foundation:validate`
- `npm run --silent supabase:local:toolchain:probe`
- `supabase start`
- `supabase status --output json` with sanitized localhost evidence only
- `npm run --silent supabase:local:preflight`
- `npm run supabase:rls:list-tests`
- `npm run supabase:rls:local:dry-run`
- `npm run supabase:rls:local:run -- --confirm-local-only --file database/test-sql/local/001_auth_workspace_minimal_local_rls.sql`
- `npm run build`
- `npm run build:server`
- `npm run foundation:validate:with-build`

## Acceptance Criteria

- Local Supabase starts successfully.
- Host, port, database, and local-only DB evidence are recorded without secrets.
- Guarded runner executes exactly the first local SQL candidate.
- SQL either passes or records exact failure evidence.
- No staging/remote/production target is touched.
- No runtime execution or beta/production capability is enabled.

## Result

- Local `supabase start` passed.
- Sanitized localhost DB evidence was captured: host `127.0.0.1`, port `54330`, database `postgres`, local-only yes.
- The first guarded SQL run found a fixture/schema mismatch on `workspaces.metadata_json`.
- A fixture-only compatibility update was made to the local SQL candidate.
- The final guarded SQL run passed and executed exactly `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql`.
- `npm run build` and `npm run build:server` remain locally environment-blocked by the known Darwin Rolldown native binding code-signature issue; `npm run foundation:validate:with-build` exits `0` with `overallStatus=environment_blocked`.
