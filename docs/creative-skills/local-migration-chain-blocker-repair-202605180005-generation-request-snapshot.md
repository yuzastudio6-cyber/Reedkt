# RP-BETA-INTEGRATION-08 Local Migration Chain Blocker Repair For Generation Request Snapshot Compatibility

## Purpose

RP-BETA-INTEGRATION-08 repairs the generation-request approved-snapshot compatibility blocker in `supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql`.

Repair decision:

- `generation_request_snapshot_nullable_fk_compatibility_repair`

Local reset decision:

- `local_chain_blocker_repaired_but_new_blocker_found`

## Original Blocker

RP-BETA-INTEGRATION-07 stopped at:

- Migration: `supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql`
- Error: `column "approved_plan_snapshot_id" does not exist`
- Failing statement: `create index if not exists idx_generation_requests_project_snapshot on public.generation_requests(project_id, approved_plan_snapshot_id)`

Creative Skill catalog migrations were not reached.

## Files Inspected

- `supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql`
- `supabase/migrations/202605130007_generation_providers_generated_assets.sql`
- `supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql`
- `supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql`
- `supabase/migrations/202605180007_reeditpro_rls_policies.sql`
- `supabase/migrations/202605210001_e2e_runtime_readiness_tables.sql`
- `generation-provider-architecture.md`
- `database-architecture.md`
- `src/types/generation.ts`
- `src/types/edit-planning-db.ts`
- `docs/creative-skills/implementation-handoff.md`
- `docs/creative-skills/beta-integration-merge-readiness-report.md`

## Root Cause

`202605130007_generation_providers_generated_assets.sql` already creates `public.generation_requests` without `approved_plan_snapshot_id`.

`202605180005_reeditpro_generation_assets_jobs.sql` declares `approved_plan_snapshot_id` inside `create table if not exists public.generation_requests (...)`, but that create-table path is skipped when the older table already exists.

The later index then references a missing column.

## Schema Intent

The relationship is intentional:

- `202605180005` comments state that provider generation requests must reference `approved_plan_snapshot_id` before worker execution starts.
- `202605180004` creates `approved_plan_snapshots` before `202605180005` runs.
- ReeditPro architecture docs require provider generation to stay behind approved-plan, credit, and worker gates.
- Older generation request rows cannot be deterministically mapped to approved snapshots, so the compatibility column must remain nullable and unbackfilled.

## SQL Patch

The repair adds a nullable compatibility column and idempotent FK before the failing index:

```sql
alter table public.generation_requests
  add column if not exists approved_plan_snapshot_id uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'generation_requests_approved_plan_snapshot_id_fkey') then
    alter table public.generation_requests
      add constraint generation_requests_approved_plan_snapshot_id_fkey
      foreign key (approved_plan_snapshot_id) references public.approved_plan_snapshots(id) on delete set null;
  end if;
end $$;
```

No `not null`, backfill, provider execution, job execution, credit reservation, credit spend, refund, approval grant, runtime behavior, or app behavior was added.

## Static SQL Review

- The compatibility column is added before `idx_generation_requests_project_snapshot`.
- The FK is added before `idx_generation_requests_project_snapshot`.
- `approved_plan_snapshots(id)` exists from `202605180004`.
- No new migration file was created.
- Creative Skill catalog migrations were not modified.
- The canonical manifest, TypeScript contracts, mock fixtures, config, package files, runtime code, providers, workers, UI, and app behavior were not modified.

## Local Safety Preflight

Preflight passed:

- `supabase/config.toml` retained `project_id = "reeditpro-local"`.
- DB port remained `55432`.
- Ports `55430` through `55439` were free before start.
- No remote-risk Supabase environment variable names were found.
- Docker was available.
- Supabase CLI was available at `2.105.0` when run with telemetry disabled for the process.

The first plain `supabase --version` attempt hit a local telemetry rename error under the user home directory. The verification commands were rerun with `SUPABASE_TELEMETRY_DISABLED=1`, which avoided the telemetry file issue without changing repo-tracked files.

## Local Supabase Result

Local commands:

- `supabase start`: passed for `reeditpro-local`.
- `supabase db reset --local --no-seed`: passed the repaired `generation_requests.approved_plan_snapshot_id` blocker, then failed later in the same migration.
- `supabase stop --project-id reeditpro-local`: passed.

Raw local command output stayed under `/tmp/rp-beta-integration-08/` and was not copied into docs.

## New Blocker

Migration:

- `supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql`

Sanitized error:

```text
column "version" does not exist
```

Failing statement:

```sql
create index if not exists idx_generated_asset_versions_asset_version
on public.generated_asset_versions(generated_asset_id, version)
```

Cause summary:

- `202605130007_generation_providers_generated_assets.sql` already creates `generated_asset_versions` with `version_number`, not `version`.
- `202605180005_reeditpro_generation_assets_jobs.sql` defines `version` only inside `create table if not exists public.generated_asset_versions (...)`.
- Because the table already exists, the newer index cannot compile.

## Creative Skill Catalog Status

Creative Skill catalog migrations were not reached.

Minimal Creative Skill catalog smoke did not run.

## Local Side Artifacts

Existing local Supabase side artifacts remain present and untracked:

- `supabase/.branches/`
- `supabase/.temp/`

They were left in place and not staged.

## Protected-File Hash Result

Protected files remained unchanged except for the approved target migration `202605180005_reeditpro_generation_assets_jobs.sql`.

## Sanitization Statement

Docs and final reporting must include only sanitized command names, exit statuses, migration names, counts, and summarized errors. Local keys, passwords, JWTs, access tokens, full connection strings, and full environment dumps must not be copied into repo docs.

## Beta Integration Status

- `blocked_not_merge_ready`

## Next Prompt

Recommended next prompt:

`RP-BETA-INTEGRATION-09 - Local Migration Chain Repair for 202605180005 Generated Asset Version Compatibility`

The next prompt should patch only the concrete `generated_asset_versions.version` compatibility issue in `202605180005_reeditpro_generation_assets_jobs.sql`, then rerun local-only reset.
