# RP-BETA-INTEGRATION-10 Local Migration Chain Blocker Repair For QA Check Result Column Compatibility

## Purpose

RP-BETA-INTEGRATION-10 repairs the QA check result column syntax blocker in `supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql`.

Repair decision:

- `quote_reserved_check_column_repair`

Local reset decision:

- `local_chain_blocker_repaired_but_new_blocker_found`

## Original Blocker

RP-BETA-INTEGRATION-09 stopped at:

- Migration: `supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql`
- Error: `syntax error at or near "text"`
- Failing statement excerpt: `check text` inside `create table if not exists public.qa_check_results (...)`

Creative Skill catalog migrations were not reached.

## Files Inspected

- `supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql`
- `supabase/migrations/202605130008_render_preview_export_revision_qa.sql`
- `src/types/edit-planning-db.ts`
- `src/types/review-render-export.ts`
- `src/types/edit-quality.ts`
- `docs/creative-skills/local-migration-chain-blocker-repair-202605180005-generated-asset-version.md`
- `docs/creative-skills/implementation-handoff.md`
- `docs/creative-skills/beta-integration-merge-readiness-report.md`

## Root Cause

The `qa_check_results` table attempted to define a column with:

```sql
check text,
```

PostgreSQL parses `check` as constraint syntax in this column-definition position, so the statement fails before the type token.

## Schema Intent

The migration stores compact QA check result rows with:

- `category`
- `label`
- `check`
- `status`
- `severity`
- fallback and notes JSON

`src/types/edit-planning-db.ts` already defines `QACheckResultRecord.check: string`, which matches the logical database field in this migration.

The newer render/export lane uses `qa_report_items.check_type` and `NormalizedQAReportItemRecord.checkType`, but that is a separate normalized QA report item table from `202605130008_render_preview_export_revision_qa.sql`.

Because this repair is a compatibility/syntax repair for the existing `qa_check_results` table, quoting the column preserves the existing logical field and avoids inventing a new name.

## SQL Patch

The repair changes only the reserved column token:

```sql
"check" text,
```

No QA field was renamed. No compatibility column, table, index, policy, RLS rule, QA runtime, export behavior, credit behavior, approval behavior, provider behavior, worker behavior, UI behavior, or app behavior was added.

## Static SQL Review

- `qa_check_results` now defines `"check" text`.
- The old unquoted `check text` fragment no longer appears in the target migration.
- No later index, constraint, or comment in `202605180006_reeditpro_qa_exports_audit.sql` references the column, so no further SQL reference updates were required.
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
- `supabase db reset --local --no-seed`: passed the repaired `qa_check_results.check` syntax blocker, then failed later in the same migration.
- `supabase stop --project-id reeditpro-local`: passed.

Raw local command output stayed under `/tmp` and was not copied into docs.

## New Blocker

Migration:

- `supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql`

Sanitized error:

```text
column "approved_plan_snapshot_id" does not exist
```

Failing statement:

```sql
create index if not exists idx_qa_reports_project_snapshot on public.qa_reports(project_id, approved_plan_snapshot_id)
```

Cause summary:

- `202605130008_render_preview_export_revision_qa.sql` already creates `public.qa_reports`.
- The later `create table if not exists public.qa_reports (...)` path in `202605180006_reeditpro_qa_exports_audit.sql` is skipped when the older table exists.
- The skipped table shape includes `approved_plan_snapshot_id`, so the later index references a missing compatibility column.

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

`RP-BETA-INTEGRATION-11 - Local Migration Chain Repair for 202605180006 QA Reports Approved Snapshot Compatibility`

The next prompt should patch only the concrete `qa_reports.approved_plan_snapshot_id` compatibility issue in `202605180006_reeditpro_qa_exports_audit.sql`, then rerun local-only reset.
