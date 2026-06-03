# Prompt 20B Local RLS First Executable Smoke Test

## Summary

Prompt 20B attempts the first local-only executable RLS smoke test for ReeditPro after Prompt 20G repaired the provider-model seed ambiguity.

- Branch: `codex/rp-foundation-20b-local-rls-first-executable-smoke-test`
- Base: `origin/codex/rp-foundation-20g-local-supabase-migration-chain-repair`
- PR title: `[foundation] Prompt 20B local RLS first executable smoke test`
- Exact production capability enabled: `none; local-only RLS smoke validation`

## Allowed Scope

- Safe local toolchain probe.
- Local Supabase preflight.
- Local `supabase start` only after `remoteRiskDetected=false` and `canStartLocalSupabase=true`.
- Local `supabase status --output json` only if start succeeds.
- One minimal local-only SQL candidate under `database/test-sql/local/`.
- Guarded local SQL runner execution only after local start succeeds and a localhost-only DB URL is verified.
- Evidence and tracker updates.

## Forbidden Scope

No staging Supabase, remote Supabase, production Supabase, `supabase link`, remote SQL, remote migrations, deployment, provider calls, rendering/export, tool execution, worker execution, production job claim, media processing, storage transfer, signed URL creation, credit mutation, Stripe/payment processing, external telemetry, beta/production unlock, or broad service-role handler.

## Deliverables

- `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql`
- `docs/prompt-20b-validation-results.md`
- updates to local Supabase evidence, manifest, beta scorecard, blocker inventory, source-of-truth map, production milestone plan, and implementation prompt tracker
- local runner dotfile/AppleDouble ignore hardening

## Acceptance Criteria

- First local SQL candidate exists and is local-only, synthetic, rollback-scoped, and auth/workspace/project-only.
- Local Supabase lifecycle is attempted only after safety gates pass.
- If the migration chain fails, SQL execution stops and the exact migration error is recorded.
- No remote/staging/production Supabase target is touched.
- Next prompt recommendation is clear.

## Result

Prompt 20B created the SQL candidate and attempted local `supabase start`. The migration chain failed at `202605180001_reeditpro_core_workspace_projects.sql` because the existing `public.projects` table did not include `current_edit_session_id` before the migration attempted to add `projects_current_edit_session_id_fkey`.

No SQL/RLS smoke test ran. Prompt 20H is recommended.
