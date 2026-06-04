# Prompt 20L Local Supabase Migration Chain Repair Follow-Up 5

Prompt 20L repairs the next local-only Supabase migration-chain blocker found by Prompt 20K.

Exact production capability enabled: `none; local-only migration chain repair`.

No staging Supabase, remote Supabase, production Supabase, remote SQL, SQL/RLS smoke test, provider call, rendering/export, tool execution, worker execution, production job claim, media processing, browser capture, storage transfer, signed URL creation, credit mutation, Stripe checkout/webhook/payment processing, external telemetry, deployment, production migration deployment, dependency mutation, production/beta unlock, or broad service-role handler was enabled.

## Original Error

Prompt 20K repaired the Prompt 5/6-era credit/approval compatibility blocker and advanced the local migration chain to:

- `supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql`

Failure:

```text
ERROR: column "approved_plan_snapshot_id" does not exist (SQLSTATE 42703)
At statement: 11
create index if not exists idx_generation_requests_project_snapshot on public.generation_requests(project_id, approved_plan_snapshot_id)
```

## Root Cause

Earlier schema-era migration `202605130007_generation_providers_generated_assets.sql` creates `public.generation_requests` before `202605180005_reeditpro_generation_assets_jobs.sql` runs. Because the later migration uses `create table if not exists`, the Prompt 7/8-era table definition is skipped when the earlier table already exists.

The later migration then assumed:

- `public.generation_requests.approved_plan_snapshot_id` exists before `idx_generation_requests_project_snapshot` is created;
- `public.generated_asset_versions.version` exists before `idx_generated_asset_versions_asset_version` is created.

The older generated-asset version table uses `version_number`; the mapping from `version_number` to `version` is direct and safe to backfill locally when both columns exist.

## SQL Repair

Prompt 20L changes only:

- `supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql`

The repair:

- adds nullable compatibility column `generation_requests.approved_plan_snapshot_id uuid` when missing;
- guards `generation_requests_approved_plan_snapshot_id_fkey` behind checks for `generation_requests`, `approved_plan_snapshots`, source/target columns, and scoped constraint absence;
- guards `idx_generation_requests_project_snapshot` behind checks for `generation_requests.project_id`, `generation_requests.approved_plan_snapshot_id`, and index absence;
- adds nullable compatibility column `generated_asset_versions.version integer` when missing;
- backfills `generated_asset_versions.version` from `version_number` only when `version_number` exists and `version` is null;
- guards `idx_generated_asset_versions_asset_version` behind checks for `generated_asset_versions.generated_asset_id`, `generated_asset_versions.version`, and index absence.

Prompt 20L did not rename tables, drop data, reorder migrations, rewrite migration history broadly, redesign generation/jobs schema, or add unrelated product/runtime changes.

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

Prompt 20L passed the repaired migration:

- `202605180005_reeditpro_generation_assets_jobs.sql`

The chain then failed at the next migration:

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

Next blocker classification: another local migration-chain blocker in `supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql`. The column name `check` is parsed as a SQL keyword in the `qa_check_results` table definition.

## Validation Commands

| Command | Result |
| --- | --- |
| `git diff --check` | Passed |
| `git diff --check origin/codex/rp-foundation-20k-local-supabase-migration-chain-repair-follow-up-4...HEAD` | Passed |
| `npm ci` | Passed; existing 5 moderate audit findings reported, no `npm audit fix` run |
| `npm run lint` | Passed |
| `npm run typecheck:server` | Passed |
| `npm run foundation:validate` | Passed |
| `npm run --silent supabase:local:toolchain:probe` | Passed; reports Supabase CLI 2.104.0, Docker 29.5.2, `psql` 18.4, `remoteRiskDetected=false`, local candidate present, and missing local DB URL |
| `npm run --silent supabase:local:preflight` | Passed; reports `remoteRiskDetected=false`, `canStartLocalSupabase=true`, `canResetLocalSupabase=true`, `canRunLocalSql=false`, and blocker `local_db_url_missing` |
| `supabase stop --no-backup` | Passed before local start; local-only cleanup, no backup |
| `supabase start` | Failed after passing `202605180005_reeditpro_generation_assets_jobs.sql`; stopped at `202605180006_reeditpro_qa_exports_audit.sql` on `check text` syntax |
| `supabase status` | Not run because start failed |
| `npm run supabase:rls:list-tests` | Not run after the failed start |
| `npm run supabase:rls:local:dry-run` | Not run after the failed start |
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

- Local migration chain now fails in `202605180006_reeditpro_qa_exports_audit.sql` on the `qa_check_results.check text` column definition.
- No localhost-only DB URL has been captured.
- No SQL/RLS smoke test has executed.
- Staging and remote Supabase validation remain prohibited and unrun.
- Production beta remains blocked.
- Local Darwin full build remains environment-blocked by the known Rolldown native binding/code-signature issue; Linux CI remains the build evidence path.

## Next Prompt Recommendation

Recommended next prompt: Prompt 20M - Local Supabase Migration Chain Repair Follow-Up 6, focused on the next exact migration-chain blocker in `202605180006_reeditpro_qa_exports_audit.sql`.

## Prompt 20M Follow-Up

Prompt 20M repaired the `qa_check_results.check text` syntax blocker in `supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql` by renaming the column to `check_type`, matching existing backend service reads. It also added nullable `qa_reports.approved_plan_snapshot_id` compatibility handling and guarded the approved snapshot FK/index.

After the repair, local `supabase start` passed `202605180006_reeditpro_qa_exports_audit.sql` and advanced to the next migration-chain blocker:

```text
ERROR: cannot change name of input parameter "target_workspace_id" (SQLSTATE 42P13)
At statement: 10
create or replace function public.is_workspace_member(workspace_uuid uuid)
```

No SQL/RLS smoke test ran, no localhost-only DB URL was captured, and no staging/remote/production Supabase target was touched.

Prompt 20B remains blocked until the local migration chain starts successfully. The next milestone should be Prompt 20N - Local Supabase Migration Chain Repair Follow-Up 7, focused on `202605180007_reeditpro_rls_policies.sql`.
