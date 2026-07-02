# RP-BETA-INTEGRATION-11 Local Migration Chain Blocker Repair For QA Report Approved Snapshot Compatibility

## Purpose

RP-BETA-INTEGRATION-11 repairs the QA report approved-plan-snapshot index blocker in `supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql`.

Repair decision:

- `qa_report_approved_snapshot_nullable_fk_compatibility_repair`

Local reset decision:

- `local_chain_blocker_repaired_but_new_blocker_found`

## Original Blocker

RP-BETA-INTEGRATION-10 stopped at:

- Migration: `supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql`
- Error: `column "approved_plan_snapshot_id" does not exist`
- Failing statement: `create index if not exists idx_qa_reports_project_snapshot on public.qa_reports(project_id, approved_plan_snapshot_id)`

Creative Skill catalog migrations were not reached.

## Files Inspected

- `supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql`
- `supabase/migrations/202605130008_render_preview_export_revision_qa.sql`
- `supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql`
- `supabase/migrations/202605180007_reeditpro_rls_policies.sql`
- `src/types/edit-planning-db.ts`
- `src/types/review-render-export.ts`
- `docs/creative-skills/local-migration-chain-blocker-repair-202605180006-qa-check-result-column.md`
- `docs/creative-skills/implementation-handoff.md`
- `docs/creative-skills/beta-integration-merge-readiness-report.md`

## Root Cause

`202605130008_render_preview_export_revision_qa.sql` already creates `public.qa_reports` without `approved_plan_snapshot_id`.

`202605180006_reeditpro_qa_exports_audit.sql` declares `approved_plan_snapshot_id` inside `create table if not exists public.qa_reports (...)`, but that create-table path is skipped when the older table already exists.

The later `idx_qa_reports_project_snapshot` index then references a missing column.

## Schema Intent

`202605180006_reeditpro_qa_exports_audit.sql` states that QA reports tie back to approved snapshots and jobs when execution exists.

`202605180004_reeditpro_credits_approval_snapshots.sql` creates `public.approved_plan_snapshots` before `202605180006` runs. That table is documented as the immutable worker execution contract.

Because older QA reports cannot be deterministically mapped to immutable approved snapshots, the compatibility pointer remains nullable and is not backfilled.

## SQL Patch

The repair adds a nullable compatibility column and idempotent FK before the index:

```sql
alter table public.qa_reports
  add column if not exists approved_plan_snapshot_id uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'qa_reports_approved_plan_snapshot_id_fkey') then
    alter table public.qa_reports
      add constraint qa_reports_approved_plan_snapshot_id_fkey
      foreign key (approved_plan_snapshot_id) references public.approved_plan_snapshots(id) on delete set null;
  end if;
end $$;
```

The existing index remains:

```sql
create index if not exists idx_qa_reports_project_snapshot on public.qa_reports(project_id, approved_plan_snapshot_id);
```

No backfill, `not null` constraint, QA runtime, export execution, credit reservation, credit spend, refund, approval grant, provider behavior, worker behavior, UI behavior, or app behavior was added.

## Static SQL Review

- `qa_reports.approved_plan_snapshot_id` is added before `idx_qa_reports_project_snapshot`.
- `qa_reports_approved_plan_snapshot_id_fkey` references `public.approved_plan_snapshots(id)` with `on delete set null`.
- `public.approved_plan_snapshots` is created in `202605180004` before this migration.
- The prior `"check" text` repair remains intact.
- No new migration file was created.
- Creative Skill catalog migrations were not modified.
- The canonical manifest, TypeScript contracts, mock fixture, config, package files, runtime code, providers, workers, UI, and app behavior were not modified.

## Local Safety Preflight

Preflight passed:

- `supabase/config.toml` retained `project_id = "reeditpro-local"`.
- DB port remained `55432`.
- Ports `55430` through `55439` were free before start.
- No remote-risk Supabase environment variable names were found.
- No remote Supabase target, production URL, access token, service-role string, or Yuza reference was found in the local config scan.

## Local Supabase Result

Local commands:

- `supabase start`: passed for `reeditpro-local`.
- `supabase db reset --local --no-seed`: passed the repaired `qa_reports.approved_plan_snapshot_id` blocker, then failed in the next migration.
- `supabase stop --project-id reeditpro-local`: passed.

Raw local command output stayed under `/tmp` and was not copied into docs.

## New Blocker

Migration:

- `supabase/migrations/202605180007_reeditpro_rls_policies.sql`

Sanitized error:

```text
cannot change name of input parameter "target_workspace_id"
```

Failing statement excerpt:

```sql
create or replace function public.is_workspace_member(workspace_uuid uuid)
returns boolean
```

Cause summary:

- An earlier migration already defines `public.is_workspace_member` with an input parameter named `target_workspace_id`.
- PostgreSQL does not allow `create or replace function` to change an input parameter name for an existing function signature.

## Creative Skill Catalog Status

Creative Skill catalog migrations were not reached.

Minimal Creative Skill catalog smoke did not run.

## Local Side Artifacts

Existing local Supabase side artifacts remain present and untracked:

- `supabase/.branches/`
- `supabase/.temp/`

They were left in place and not staged.

## Protected-File Hash Result

Protected hashes changed only for the approved target migration:

- `supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql`

Protected files that remained unchanged include:

- `supabase/config.toml`
- prior repaired migrations
- Creative Skill catalog migrations
- canonical seed manifest
- RP-SKILLS TypeScript contracts
- mock fixture
- package files

## Sanitization Statement

Docs and final reporting include only sanitized command names, exit statuses, migration names, counts, and summarized errors. Local keys, passwords, JWTs, access tokens, full connection strings, and full environment dumps were not copied into repo docs.

## Beta Integration Status

- `blocked_not_merge_ready`

## Next Prompt

Recommended next prompt:

`RP-BETA-INTEGRATION-12 - Local Migration Chain Repair for 202605180007 Workspace Member Function Signature Compatibility`

The next prompt should patch only the concrete `is_workspace_member` function input-parameter compatibility issue in `202605180007_reeditpro_rls_policies.sql`, then rerun local-only reset.
