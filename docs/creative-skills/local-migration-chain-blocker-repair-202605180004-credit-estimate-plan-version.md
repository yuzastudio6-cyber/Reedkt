# RP-BETA-INTEGRATION-07 Local Migration Chain Blocker Repair For Credit Estimate Plan Version Compatibility

## Summary

RP-BETA-INTEGRATION-07 repairs the credit-estimate plan-version compatibility blocker in `supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql`.

Repair decision:

- `credit_estimate_plan_version_nullable_fk_compatibility_repair`

Local reset decision:

- `local_chain_blocker_repaired_but_new_blocker_found`

## Root Cause

An earlier migration, `202605130004_credit_ledger_approval_gate.sql`, creates `public.credit_estimates` with legacy `edit_plan_id` lineage and without `edit_plan_version_id`.

The later migration, `202605180004_reeditpro_credits_approval_snapshots.sql`, defines `edit_plan_version_id` inside `create table if not exists public.credit_estimates (...)`. Because the table already exists, PostgreSQL does not add the missing column before the newer index runs.

The local reset then failed at:

```sql
create index if not exists idx_credit_estimates_project_plan
on public.credit_estimates(project_id, edit_plan_version_id)
```

Sanitized error:

```text
column "edit_plan_version_id" does not exist
```

## Source-Truth Findings

- `202605180003_reeditpro_intent_plan_versions.sql` creates `edit_plan_versions`.
- `202605180004_reeditpro_credits_approval_snapshots.sql` models credit estimates, approval records, and approved snapshots around `edit_plan_version_id`.
- Older `credit_estimates` rows may remain plan-level only, so there is no deterministic backfill from `edit_plan_id` to `edit_plan_version_id`.
- `on delete set null` preserves older credit estimate rows if a future version row is deleted.

## Patch

The repair adds a nullable compatibility column and idempotent FK before the failing index path:

```sql
alter table public.credit_estimates
  add column if not exists edit_plan_version_id uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'credit_estimates_edit_plan_version_id_fkey') then
    alter table public.credit_estimates
      add constraint credit_estimates_edit_plan_version_id_fkey
      foreign key (edit_plan_version_id) references public.edit_plan_versions(id) on delete set null;
  end if;
end $$;
```

No `not null`, backfill, credit reservation, credit spend, refund, grant, package change, runtime change, or TypeScript change was added.

## Preserved Behavior

- Legacy `credit_estimates.edit_plan_id` remains unchanged.
- Existing credit estimate rows remain untouched.
- No credits were reserved, spent, refunded, or granted.
- Creative Skill catalog migrations and canonical seed manifest were not modified.
- TypeScript contracts, mock fixtures, package files, config, runtime code, UI, providers, workers, Qwen files, staging, commits, merges, pushes, and deploys were not changed.

## Local Verification

Safety preflight passed:

- `supabase/config.toml` retained `project_id = "reeditpro-local"`.
- Local DB port remained `55432`.
- Ports `55430` through `55439` were free before start.
- No remote-risk Supabase environment variable names were found.
- Supabase CLI and Docker were available.

Local commands:

- `supabase start`: passed for `reeditpro-local`.
- `supabase db reset --local --no-seed`: passed the repaired `credit_estimates.edit_plan_version_id` blocker and then stopped at the next migration.
- `supabase stop --project-id reeditpro-local`: passed.

Raw local status and command outputs stayed under `/tmp/rp-beta-integration-07/` and were not copied into docs.

## New Blocker

Migration:

- `supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql`

Sanitized error:

```text
column "approved_plan_snapshot_id" does not exist
```

Failing statement:

```sql
create index if not exists idx_generation_requests_project_snapshot
on public.generation_requests(project_id, approved_plan_snapshot_id)
```

Cause summary:

- `202605130007_generation_providers_generated_assets.sql` already creates `generation_requests` without `approved_plan_snapshot_id`.
- `202605180005_reeditpro_generation_assets_jobs.sql` defines `approved_plan_snapshot_id` only inside `create table if not exists public.generation_requests (...)`.
- Because the table already exists, the newer index cannot compile.

## Creative Skill Catalog Status

Creative Skill catalog migrations were not reached.

Minimal Creative Skill catalog smoke did not run.

## Validation Notes

Required final validation for this pass:

- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --check`
- `npm run lint`
- ASCII and trailing-whitespace checks over edited SQL/Markdown
- protected-file hash comparison
- docs secret scan
- no staged files

## Next Prompt

Recommended next prompt:

`RP-BETA-INTEGRATION-08 - Local Migration Chain Repair for 202605180005 Generation Request Snapshot Compatibility`

The next prompt should patch only the concrete `generation_requests.approved_plan_snapshot_id` compatibility issue in `202605180005_reeditpro_generation_assets_jobs.sql`, then rerun local-only reset.
