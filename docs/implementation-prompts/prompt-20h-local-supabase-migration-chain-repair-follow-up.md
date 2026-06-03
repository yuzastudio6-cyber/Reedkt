# Prompt 20H Local Supabase Migration Chain Repair Follow-Up

## Summary

Implement Prompt 20H in a clean sibling worktree based on `origin/codex/rp-foundation-20b-local-rls-first-executable-smoke-test`, branch `codex/rp-foundation-20h-local-supabase-migration-chain-repair-follow-up`, with PR title `[foundation] Prompt 20H local Supabase migration chain repair follow-up`.

This is a local-only migration-chain repair milestone. It fixes the known `202605180001_reeditpro_core_workspace_projects.sql` failure where `projects_current_edit_session_id_fkey` assumes `public.projects.current_edit_session_id` exists after an earlier schema-era `public.projects` table already exists.

## Allowed Scope

- Patch only the known local migration-chain blocker in `supabase/migrations/202605180001_reeditpro_core_workspace_projects.sql`.
- Run local safety preflight and local `supabase start` only if no remote risk is detected and local start is allowed.
- Record exact local migration-chain evidence.
- Update Prompt 20B evidence, status, source-of-truth, beta blocker, and implementation prompt trackers.

## Forbidden Scope

- No RLS SQL test execution.
- No staging Supabase, remote Supabase, production Supabase, `supabase link`, remote SQL, remote migration, or deployment.
- No provider call, rendering/export, tool execution, worker execution, production job claim, media processing, browser capture, storage transfer, signed URL creation, credit mutation, Stripe checkout/webhook/payment processing, external telemetry, production/beta unlock, dependency mutation, or broad service-role handler.

## Acceptance Criteria

- `current_edit_session_id` is added as a nullable compatibility column before the FK is created.
- The FK creation is guarded by table, column, and constraint checks.
- Same-migration compatibility blockers discovered by local start are repaired only with additive nullable columns, guarded backfill, and guarded constraints.
- Local start is attempted only after local-only safety gates pass.
- If local start fails on a new migration-chain blocker, the exact error is recorded and SQL/RLS tests remain unrun.
- Trackers clearly recommend the next safe Prompt 20-series follow-up.

## Validation Checklist

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-20b-local-rls-first-executable-smoke-test...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run foundation:validate`
- `npm run --silent supabase:local:toolchain:probe`
- `npm run --silent supabase:local:preflight`
- `supabase start` only after no-remote local safety gates pass
- `npm run build`
- `npm run build:server`
- `npm run foundation:validate:with-build`

## Implementation Result

Prompt 20H repaired the `projects_current_edit_session_id_fkey` blocker and two same-migration compatibility blockers that local start exposed: missing `workspaces/projects.owner_id` and missing `chat_messages.edit_session_id`.

Local `supabase start` now passes `202605180001_reeditpro_core_workspace_projects.sql` and advances to the next migration:

```text
ERROR: column "status" does not exist (SQLSTATE 42703)
At statement: 8
create index if not exists idx_media_assets_project_status on public.media_assets(project_id, status)
```

No SQL/RLS smoke tests ran. No localhost-only DB URL was captured.

Recommended next prompt: Prompt 20I - Local Supabase Migration Chain Repair Follow-Up, focused on `202605180002_reeditpro_media_source_sequence.sql`.
