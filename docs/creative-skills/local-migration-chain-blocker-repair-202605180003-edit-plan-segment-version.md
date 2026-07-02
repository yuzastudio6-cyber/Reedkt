# RP-BETA-INTEGRATION-05 Local Migration Chain Blocker Repair For Edit Plan Segment Version Compatibility

## Summary

RP-BETA-INTEGRATION-05 repairs the `edit_plan_segments.edit_plan_version_id` compatibility blocker in `supabase/migrations/202605180003_reeditpro_intent_plan_versions.sql`.

Repair decision:

- `edit_plan_version_nullable_fk_compatibility_repair`

Local reset decision:

- `local_chain_blocker_repaired_but_new_blocker_found`

## Root Cause

An earlier migration, `202605130002_intent_edit_planning_tables.sql`, creates `public.edit_plan_segments` with the older `edit_plan_id` shape.

The later migration, `202605180003_reeditpro_intent_plan_versions.sql`, defines a newer version-aware `edit_plan_segments` shape with `edit_plan_version_id`, but it does so inside `create table if not exists`. Because the table already exists, PostgreSQL does not add the missing column.

The local reset then failed at:

```sql
create index if not exists idx_edit_plan_segments_plan_order
on public.edit_plan_segments(edit_plan_version_id, segment_order);
```

Sanitized error:

```text
column "edit_plan_version_id" does not exist
```

## Source-Truth Findings

- The active `202605180003` migration expects `edit_plan_segments.edit_plan_version_id`.
- The draft `003_intent_and_plan_versions.draft.sql` expects segments to belong to `edit_plan_versions`.
- `src/lib/supabase-schema-plan.ts` maps `edit_plan_version_id` to `edit_plan_versions.id`.
- Later RLS in `202605180007_reeditpro_rls_policies.sql` joins `edit_plan_segments.edit_plan_version_id` to `edit_plan_versions`.
- The older concrete `202605130002` migration still owns the legacy `edit_plan_id` segment shape.

## Patch

The repair adds the missing compatibility column before the existing index:

```sql
alter table public.edit_plan_segments
  add column if not exists edit_plan_version_id uuid;
```

It also adds an idempotent FK to `edit_plan_versions(id)`:

```sql
foreign key (edit_plan_version_id)
references public.edit_plan_versions(id)
on delete set null
```

The column remains nullable. No backfill was added because the migration does not create deterministic `edit_plan_versions` rows for preexisting `edit_plan_id` segments.

## Preserved Behavior

- Existing `edit_plan_id` data remains untouched.
- Existing `segment_order` remains untouched.
- Existing index name and target remain unchanged.
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
- `supabase db reset --local --no-seed`: passed the repaired `202605180003` blocker and then stopped at the next migration.
- `supabase stop --project-id reeditpro-local`: passed.

Raw local status output stayed under `/tmp/rp-beta-integration-05/` and was not copied into docs.

## New Blocker

Migration:

- `supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql`

Sanitized error:

```text
column "approved_plan_snapshot_id" referenced in foreign key does not exist
```

Failing block:

```sql
alter table public.credit_reservations
  add constraint credit_reservations_approved_plan_snapshot_id_fkey
  foreign key (approved_plan_snapshot_id) references public.approved_plan_snapshots(id) on delete set null;
```

Cause summary:

- Older migrations already create `credit_reservations` without `approved_plan_snapshot_id`.
- `202605180004` defines `approved_plan_snapshot_id` only inside `create table if not exists public.credit_reservations (...)`.
- Because the table already exists, the compatibility column is missing when the FK block runs.

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

`RP-BETA-INTEGRATION-06 - Local Migration Chain Repair for 202605180004 Approved Plan Snapshot Compatibility`

The next prompt should patch only the concrete `approved_plan_snapshot_id` compatibility issue in `202605180004_reeditpro_credits_approval_snapshots.sql`, then rerun local-only reset.
