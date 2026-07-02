# RP-BETA-INTEGRATION-06 Local Migration Chain Blocker Repair For Approved Plan Snapshot Compatibility

## Summary

RP-BETA-INTEGRATION-06 repairs the approved-plan-snapshot compatibility blocker in `supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql`.

Repair decision:

- `approved_plan_snapshot_nullable_fk_compatibility_repair`

Local reset decision:

- `local_chain_blocker_repaired_but_new_blocker_found`

## Root Cause

An earlier migration, `202605130004_credit_ledger_approval_gate.sql`, creates `public.credit_reservations` and `public.credit_ledger_entries` without `approved_plan_snapshot_id`.

The later migration, `202605180004_reeditpro_credits_approval_snapshots.sql`, defines `approved_plan_snapshot_id` for those tables inside `create table if not exists`. Because the tables already exist, PostgreSQL does not add the missing columns before the FK block runs.

The local reset then failed at the approved snapshot FK block.

Sanitized error:

```text
column "approved_plan_snapshot_id" referenced in foreign key does not exist
```

## Source-Truth Findings

- `202605180004_reeditpro_credits_approval_snapshots.sql` creates `approved_plan_snapshots` as the immutable execution contract.
- `credit_reservations` and `credit_ledger_entries` both include `approved_plan_snapshot_id` in the newer table shape.
- `approval_records` is first created in `202605180004` and already includes `approved_snapshot_id`.
- Schema validation and worker/runtime docs expect future approved snapshot lineage before execution.

## Patch

The repair adds nullable compatibility columns after `approved_plan_snapshots` is created and before the FK block:

```sql
alter table public.credit_reservations
  add column if not exists approved_plan_snapshot_id uuid;

alter table public.credit_ledger_entries
  add column if not exists approved_plan_snapshot_id uuid;
```

The existing FK names and targets remain unchanged:

- `credit_reservations_approved_plan_snapshot_id_fkey`
- `credit_ledger_entries_approved_plan_snapshot_id_fkey`
- `approval_records_approved_snapshot_id_fkey`

No backfill was added because older credit rows do not have deterministic approved snapshot rows.

## Preserved Behavior

- Existing credit reservations remain untouched.
- Existing credit ledger rows remain untouched.
- No credits were reserved, spent, released, refunded, or granted.
- No Creative Skill migrations were modified.
- No canonical seed manifest, TypeScript contracts, mocks, package files, runtime code, UI, providers, workers, staging, commits, merges, pushes, or deploys changed.

## Local Verification

Safety preflight passed:

- `supabase/config.toml` retained `project_id = "reeditpro-local"`.
- Local DB port remained `55432`.
- No remote-risk Supabase environment variable names were found.
- Ports `55430` through `55439` were free before start.
- Supabase CLI and Docker were available.

Local commands:

- `supabase start`: passed.
- `supabase db reset --local --no-seed`: passed the repaired approved-plan-snapshot FK blocker and then stopped later in the same migration.
- `supabase stop --project-id reeditpro-local`: passed.

Raw local status output stayed under `/tmp/rp-beta-integration-06/` and was not copied into docs.

## New Blocker

Migration:

- `supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql`

Sanitized error:

```text
column "edit_plan_version_id" does not exist
```

Failing statement:

```sql
create index if not exists idx_credit_estimates_project_plan
on public.credit_estimates(project_id, edit_plan_version_id)
```

Cause summary:

- Older migrations already create `credit_estimates` with `edit_plan_id`, not `edit_plan_version_id`.
- `202605180004` defines `edit_plan_version_id` only inside `create table if not exists public.credit_estimates (...)`.
- Because the table already exists, the compatibility column is missing when the index is created.

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

`RP-BETA-INTEGRATION-07 - Local Migration Chain Repair for 202605180004 Credit Estimate Plan Version Compatibility`

The next prompt should patch only the concrete `credit_estimates.edit_plan_version_id` compatibility issue in `202605180004_reeditpro_credits_approval_snapshots.sql`, then rerun local-only reset.
