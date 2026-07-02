# RP-BETA-INTEGRATION-09 Local Migration Chain Blocker Repair For Generated Asset Version Compatibility

## Purpose

RP-BETA-INTEGRATION-09 repairs the generated-asset version index blocker in `supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql`.

Repair decision:

- `generated_asset_version_number_index_retarget_repair`

Local reset decision:

- `local_chain_blocker_repaired_but_new_blocker_found`

## Original Blocker

RP-BETA-INTEGRATION-08 stopped at:

- Migration: `supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql`
- Error: `column "version" does not exist`
- Failing statement: `create index if not exists idx_generated_asset_versions_asset_version on public.generated_asset_versions(generated_asset_id, version)`

Creative Skill catalog migrations were not reached.

## Files Inspected

- `supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql`
- `supabase/migrations/202605130007_generation_providers_generated_assets.sql`
- `src/types/generation.ts`
- `generation-provider-architecture.md`
- `docs/creative-skills/implementation-handoff.md`
- `docs/creative-skills/beta-integration-merge-readiness-report.md`

## Root Cause

`202605130007_generation_providers_generated_assets.sql` already creates `public.generated_asset_versions` with `version_number`.

`202605180005_reeditpro_generation_assets_jobs.sql` declares `version` inside `create table if not exists public.generated_asset_versions (...)`, but that create-table path is skipped when the older table already exists.

The later index then references a missing `version` column.

## Schema Intent

`version_number` is the existing generated asset version ordering field:

- The older migration defines `version_number integer not null`.
- The older migration enforces `version_number > 0`.
- The older migration adds a unique constraint on `(generated_asset_id, version_number)`.
- The older migration already indexes `version_number`.
- `src/types/generation.ts` exposes `versionNumber`.

Adding a separate `version` compatibility column would duplicate version semantics and risk inconsistent ordering.

## SQL Patch

The repair retargets the index to the existing canonical field:

```sql
create index if not exists idx_generated_asset_versions_asset_version
on public.generated_asset_versions(generated_asset_id, version_number);
```

The index name remains unchanged because it still represents generated asset version lookup.

No `version` column, backfill, unique constraint change, provider execution, job execution, credit reservation, credit spend, refund, approval grant, runtime behavior, or app behavior was added.

## Static SQL Review

- No index in `202605180005` still targets `generated_asset_versions(generated_asset_id, version)`.
- The repaired index targets `generated_asset_versions(generated_asset_id, version_number)`.
- `version_number` exists in the older generated asset versions table.
- No new migration file was created.
- Creative Skill catalog migrations were not modified.
- The canonical manifest, TypeScript contracts, mock fixtures, config, package files, runtime code, providers, workers, UI, and app behavior were not modified.

## Local Safety Preflight

Preflight passed:

- `supabase/config.toml` retained `project_id = "reeditpro-local"`.
- DB port remained `55432`.
- Ports `55430` through `55439` were free before start.
- No remote-risk Supabase environment variable names were found.
- Supabase CLI was available at `2.105.0` with telemetry disabled for the process.
- Docker was available.

## Local Supabase Result

Local commands:

- `supabase start`: passed for `reeditpro-local`.
- `supabase db reset --local --no-seed`: passed the repaired generated asset version index blocker, then failed in the next migration.
- `supabase stop --project-id reeditpro-local`: passed.

Raw local command output stayed under `/tmp/rp-beta-integration-09/` and was not copied into docs.

## New Blocker

Migration:

- `supabase/migrations/202605180006_reeditpro_qa_exports_audit.sql`

Sanitized error:

```text
syntax error at or near "text"
```

Failing statement excerpt:

```sql
create table if not exists public.qa_check_results (
  id uuid primary key default gen_random_uuid(),
  qa_report_id uuid not null references public.qa_reports(id) on delete cascade,
  category text,
  label text,
  check text,
  status text,
  severity text,
  fallback_actions_json jsonb not null default '[]'::jsonb,
  notes_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
```

Cause summary:

- `check` is parsed as a PostgreSQL keyword in this column definition context.
- `src/types/edit-planning-db.ts` includes a `check` field, so the next repair should decide whether to quote `"check"` or rename the database column with compatibility notes.

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

`RP-BETA-INTEGRATION-10 - Local Migration Chain Repair for 202605180006 QA Check Result Column Compatibility`

The next prompt should patch only the concrete `qa_check_results.check` syntax issue in `202605180006_reeditpro_qa_exports_audit.sql`, then rerun local-only reset.
