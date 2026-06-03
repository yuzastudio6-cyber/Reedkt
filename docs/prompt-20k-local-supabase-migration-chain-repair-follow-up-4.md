# Prompt 20K Local Supabase Migration Chain Repair Follow-Up 4

Prompt 20K repairs the next local-only Supabase migration-chain blocker found by Prompt 20J.

Exact production capability enabled: `none; local-only migration chain repair`.

No staging Supabase, remote Supabase, production Supabase, remote SQL, SQL/RLS smoke test, provider call, rendering/export, tool execution, worker execution, production job claim, media processing, browser capture, storage transfer, signed URL creation, credit mutation, Stripe checkout/webhook/payment processing, external telemetry, deployment, production migration deployment, dependency mutation, production/beta unlock, or broad service-role handler was enabled.

## Original Error

Prompt 20J repaired the Prompt 4/5-era intent-plan compatibility blocker and advanced the local migration chain to:

- `supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql`

Failure:

```text
ERROR: column "approved_plan_snapshot_id" referenced in foreign key constraint does not exist (SQLSTATE 42703)
At statement: 12
credit_reservations_approved_plan_snapshot_id_fkey
```

## Root Cause

Earlier schema-era migrations create `public.credit_reservations`, `public.credit_ledger_entries`, and `public.credit_estimates` before the Prompt 5/6-era credit/approval migration runs. Because `202605180004_reeditpro_credits_approval_snapshots.sql` uses `create table if not exists`, the newer canonical table definitions are skipped when older tables already exist.

The migration then attempted to add approved snapshot foreign keys and create a project/plan estimate index against columns that the older tables did not have.

## SQL Repair

Prompt 20K changes only:

- `supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql`

The repair:

- adds nullable compatibility column `credit_reservations.approved_plan_snapshot_id uuid` when missing;
- adds nullable compatibility column `credit_ledger_entries.approved_plan_snapshot_id uuid` when missing;
- adds nullable compatibility column `credit_estimates.edit_plan_version_id uuid` when missing;
- guards `credit_reservations_approved_plan_snapshot_id_fkey` behind checks for both tables, source/target columns, and scoped constraint absence;
- guards `credit_ledger_entries_approved_plan_snapshot_id_fkey` behind checks for both tables, source/target columns, and scoped constraint absence;
- guards `approval_records_approved_snapshot_id_fkey` behind checks for both tables, source/target columns, and scoped constraint absence;
- guards `idx_credit_estimates_project_plan` behind checks for `credit_estimates.project_id`, `credit_estimates.edit_plan_version_id`, and index absence.

Prompt 20K did not backfill `approved_plan_snapshot_id` from legacy credit approval or edit plan fields because that mapping is not proven. It did not rename tables, drop data, reorder migrations, rewrite migration history broadly, or add unrelated product/runtime changes.

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

`supabase stop --no-backup` was run before local start to clear stale local state. `supabase start` was attempted only after local-only gates passed.

Prompt 20K passed the repaired migration:

- `202605180004_reeditpro_credits_approval_snapshots.sql`

The chain then failed at the next migration:

```text
ERROR: column "approved_plan_snapshot_id" does not exist (SQLSTATE 42703)
At statement: 11
create index if not exists idx_generation_requests_project_snapshot on public.generation_requests(project_id, approved_plan_snapshot_id)
```

Next blocker classification: another schema-era migration-chain conflict in `supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql`. Earlier migrations create `public.generation_requests`; the Prompt 7/8-era generation/jobs migration uses `create table if not exists` and then assumes `approved_plan_snapshot_id` exists before creating `idx_generation_requests_project_snapshot`.

## Validation Commands

| Command | Result |
| --- | --- |
| `git diff --check` | Passed |
| `git diff --check origin/codex/rp-foundation-20j-local-supabase-migration-chain-repair-follow-up-3...HEAD` | Passed |
| `npm ci` | Passed; existing 5 moderate audit findings reported, no `npm audit fix` run |
| `npm run lint` | Passed |
| `npm run typecheck:server` | Passed |
| `npm run foundation:validate` | Passed |
| `npm run --silent supabase:local:toolchain:probe` | Passed; reports Supabase CLI 2.104.0, Docker 29.5.2, `psql` 18.4, `remoteRiskDetected=false`, local candidate present, and missing local DB URL |
| `npm run --silent supabase:local:preflight` | Passed; reports `remoteRiskDetected=false`, `canStartLocalSupabase=true`, `canResetLocalSupabase=true`, `canRunLocalSql=false`, and blocker `local_db_url_missing` |
| `supabase stop --no-backup` | Passed before local start and after the failed start; local-only cleanup, no backup |
| `supabase start` | Failed after passing `202605180004_reeditpro_credits_approval_snapshots.sql`; stopped at `202605180005_reeditpro_generation_assets_jobs.sql` on missing `public.generation_requests.approved_plan_snapshot_id` |
| `supabase status` | Not run because start failed |
| `npm run supabase:rls:list-tests` | Not run after the failed start |
| `npm run supabase:rls:local:dry-run` | Not run after the failed start |

## Localhost DB URL Status

No localhost-only DB URL was captured because `supabase start` failed before a complete local start.

`supabase status` was not run.

## SQL/RLS Status

No SQL/RLS smoke test ran.

The first local executable SQL candidate remains unexecuted:

- `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql`

## Remaining Blockers

- Local migration chain now fails in `202605180005_reeditpro_generation_assets_jobs.sql` while creating `idx_generation_requests_project_snapshot`.
- No localhost-only DB URL has been captured.
- No SQL/RLS smoke test has executed.
- Staging and remote Supabase validation remain prohibited and unrun.
- Production beta remains blocked.

## Next Prompt Recommendation

Recommended next prompt: Prompt 20L - Local Supabase Migration Chain Repair Follow-Up 5, focused on the next exact schema-era conflict in `202605180005_reeditpro_generation_assets_jobs.sql`.
