# Prompt 20M Local Supabase Migration Chain Repair Follow-Up 6

Prompt 20M repairs the next local-only Supabase migration-chain blocker found by Prompt 20L.

Exact production capability enabled: `none; local-only migration chain repair`.

No staging Supabase, remote Supabase, production Supabase, remote SQL, SQL/RLS smoke test, provider call, rendering/export, tool execution, worker execution, production job claim, media processing, browser capture, storage transfer, signed URL creation, credit mutation, Stripe checkout/webhook/payment processing, external telemetry, deployment, production migration deployment, dependency mutation, production/beta unlock, or broad service-role handler was enabled.

## Original Error

Prompt 20L repaired the Prompt 7/8-era generation/assets/jobs compatibility blocker and advanced the local migration chain to:

- `supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql`

Failure:

```text
ERROR: syntax error at or near "text" (SQLSTATE 42601)
At statement: 1
create table if not exists public.qa_check_results (
  id uuid primary key default gen_random_uuid(),
  qa_report_id uuid not null references public.qa_reports(id) on delete cascade,
  category text,
  label text,
  check text,
        ^
```

## Root Cause

The migration attempted to create `public.qa_check_results` with an unquoted column named `check`. PostgreSQL parses `check` as a constraint keyword in this context, so the table definition fails before the local migration chain can reach RLS policies.

Existing backend service code already reads `qa_check_results.check_type`, so `check_type` is the canonical safe column name for this local repair. Quoting `"check"` was intentionally avoided because it would preserve an awkward keyword-shaped column and conflict with service expectations.

Static inspection also found a predictable same-migration schema-era conflict: earlier migrations may create `public.qa_reports` before this migration runs, so the later `create table if not exists` can skip the Prompt 11-era `approved_plan_snapshot_id` shape before `idx_qa_reports_project_snapshot` is created.

## SQL Repair

Prompt 20M changes only:

- `supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql`

The repair:

- renames `qa_check_results.check text` to `qa_check_results.check_type text`;
- adds nullable compatibility column `qa_reports.approved_plan_snapshot_id uuid` when missing;
- guards `qa_reports_approved_plan_snapshot_id_fkey` behind checks for `qa_reports`, `approved_plan_snapshots`, source/target columns, and scoped constraint absence;
- guards `idx_qa_reports_project_snapshot` behind checks for `qa_reports.project_id`, `qa_reports.approved_plan_snapshot_id`, and index absence.

Prompt 20M did not backfill `approved_plan_snapshot_id`, rename tables, drop data, reorder migrations, rewrite migration history broadly, redesign QA/export/audit schema, or add unrelated product/runtime changes.

## Local Validation Result

Local safety gates were run with the local tool PATH:

```text
/tmp/reeditpro-local-bin:/Applications/Postgres.app/Contents/Versions/latest/bin:/Applications/Codex.app/Contents/Resources:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
```

Local tool status:

- Supabase CLI: `/tmp/reeditpro-local-bin/supabase`, version `2.104.0`
- `psql`: `/Applications/Postgres.app/Contents/Versions/latest/bin/psql`, version `18.4`
- Docker daemon: reachable, server `29.5.2`
- `remoteRiskDetected=false`
- `canStartLocalSupabase=true`
- `canResetLocalSupabase=true`

`supabase stop --no-backup` was run before local start to clear stale local state. `supabase start` was attempted only after local-only gates passed.

Prompt 20M passed the repaired migration:

- `202605180006_reeditpro_qa_exports_audit.sql`

The chain then failed at the next migration:

```text
ERROR: cannot change name of input parameter "target_workspace_id" (SQLSTATE 42P13)
At statement: 10
create or replace function public.is_workspace_member(workspace_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = workspace_uuid
      and wm.user_id = auth.uid()
  );
$$
```

Next blocker classification: another local migration-chain blocker in `supabase/migrations/202605180007_reeditpro_rls_policies.sql`. A prior migration creates `public.is_workspace_member` with input parameter `target_workspace_id`; `create or replace function` cannot rename an existing function input parameter in place.

## Validation Commands

| Command | Result |
| --- | --- |
| `git diff --check` | Passed |
| `git diff --check origin/codex/rp-foundation-20l-local-supabase-migration-chain-repair-follow-up-5...HEAD` | Passed |
| `npm ci` | Passed; existing 5 moderate audit findings reported, no `npm audit fix` run |
| `npm run lint` | Passed |
| `npm run typecheck:server` | Passed |
| `npm run foundation:validate` | Passed |
| `npm run --silent supabase:local:toolchain:probe` | Passed; reports Supabase CLI 2.104.0, Docker 29.5.2, `psql` 18.4, `remoteRiskDetected=false`, local candidate present, and missing local DB URL |
| `npm run --silent supabase:local:preflight` | Passed; reports `remoteRiskDetected=false`, `canStartLocalSupabase=true`, `canResetLocalSupabase=true`, `canRunLocalSql=false`, and blocker `local_db_url_missing` |
| `supabase stop --no-backup` | Passed before local start; local-only cleanup, no backup |
| `supabase start` | Failed after passing `202605180006_reeditpro_qa_exports_audit.sql`; stopped at `202605180007_reeditpro_rls_policies.sql` on `is_workspace_member` input parameter rename |
| `supabase status` | Not run because start failed |
| `npm run build` | Environment-blocked locally by the known Darwin Rolldown native binding/code-signature failure |
| `npm run build:server` | Environment-blocked locally by the same Rolldown native binding/code-signature failure after server typecheck passed |
| `npm run foundation:validate:with-build` | Completed with default checks passed and full build classified as local `environment_blocked` |

## Localhost DB URL Status

No localhost-only DB URL was captured because `supabase start` failed before a complete local start.

`supabase status` was not run.

## SQL/RLS Status

No SQL/RLS smoke test ran.

The first local executable SQL candidate remains unexecuted:

- `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql`

## Remaining Blockers

- Local migration chain now fails in `202605180007_reeditpro_rls_policies.sql` because `public.is_workspace_member(workspace_uuid uuid)` attempts to rename an existing function input parameter from `target_workspace_id`.
- No localhost-only DB URL has been captured.
- No SQL/RLS smoke test has executed.
- Staging and remote Supabase validation remain prohibited and unrun.
- Production beta remains blocked.
- Local Darwin full build remains environment-blocked by the known Rolldown native binding/code-signature issue; Linux CI remains the build evidence path.

## Next Prompt Recommendation

Recommended next prompt: Prompt 20N - Local Supabase Migration Chain Repair Follow-Up 7, focused on the next exact migration-chain blocker in `202605180007_reeditpro_rls_policies.sql`.

## Prompt 20N Follow-Up

Prompt 20N repaired the `202605180007_reeditpro_rls_policies.sql` helper parameter-name conflict by preserving the earlier `target_workspace_id` input parameter names for:

- `public.is_workspace_member(uuid)`
- `public.is_workspace_owner_or_admin(uuid)`

The project helper functions remained unchanged.

Local safety gates still reported `remoteRiskDetected=false` and `canStartLocalSupabase=true`, so Prompt 20N ran `supabase stop --no-backup` and retried `supabase start`. The retry did not reach migration application because the local DB port was unavailable:

```text
failed to start docker container "supabase_db_reeditpro-local": Error response from daemon: ports are not available: exposing port TCP 0.0.0.0:54322 -> 127.0.0.1:0: listen tcp 0.0.0.0:54322: bind: address already in use
```

Non-mutating port inspection showed `rapportd` listening on `*:54322`.

No `supabase status` command was run, no localhost-only DB URL was captured, and no SQL/RLS smoke test ran. The next safe milestone should clear or route around the local-only port conflict, then retry `supabase start` before Prompt 20B SQL execution.
