# Supabase Deploy Plan

Target project: `reeditpro`.

Do not deploy to the Yuza Studio Supabase project.

## Current Decision

Deployment is blocked.

RP-FIX-02 aligned the migration documentation with the actual 18-file migration folder, but the migration chain still needs validation because the `20260513` and `20260518` schema chains overlap.

RP-FIX-03 added Supabase CLI setup, project-link readiness, ReeditPro project confirmation, and generated database type readiness docs. It did not install the CLI, link the project, deploy migrations, or generate types.

RP-FIX-04 reran the deploy gate checks and stopped before any remote action. The CLI is unavailable, deployment gate variables are missing, the project is not confirmed as `reeditpro`, and generated database types are absent.

## Required Safe Deployment Sequence

1. Confirm `supabase --version` works.
2. Confirm Supabase login or provide `SUPABASE_ACCESS_TOKEN` safely through the shell.
3. Run `supabase projects list` and confirm a project named exactly `reeditpro`.
4. Link only to the confirmed `reeditpro` project ref.
5. Confirm the repo is not linked to the wrong project. Do not trust `supabase/.temp/project-ref` alone.
6. Confirm migration order is accurate by comparing `supabase/migrations/` to `migration-order.md`.
7. Validate locally or on a disposable staging project.
8. Resolve or explicitly approve the overlapping schema-chain risk after validation.
9. Run `supabase migration list --linked`.
10. Run `supabase db push --dry-run --linked`.
11. Attempt schema-only backup with `supabase db dump --linked`.
12. Confirm `DEPLOY_TO_REEDITPRO_SUPABASE=true`.
13. Run `supabase db push --linked`.
14. Verify remote migration history and public tables.
15. Generate TypeScript database types.
16. Run build and lint.

Safe helper scripts are available for future operators:

```bash
npm run supabase:version
npm run supabase:types:local
npm run supabase:types:linked
npm run supabase:migrations:list
npm run supabase:db:dry-run
```

None of these scripts performs a real deployment.

## Current Migration Chain

The local chain contains 18 files:

1. `202605130001_core_reeditpro_tables.sql`
2. `202605130002_intent_edit_planning_tables.sql`
3. `202605130003_professional_edit_quality_engine.sql`
4. `202605130004_credit_ledger_approval_gate.sql`
5. `202605130005_job_orchestration_agent_runs.sql`
6. `202605130006_stroke_motion_data_model.sql`
7. `202605130007_generation_providers_generated_assets.sql`
8. `202605130008_render_preview_export_revision_qa.sql`
9. `202605180001_reeditpro_core_workspace_projects.sql`
10. `202605180002_reeditpro_media_source_sequence.sql`
11. `202605180003_reeditpro_intent_plan_versions.sql`
12. `202605180004_reeditpro_credits_approval_snapshots.sql`
13. `202605180005_reeditpro_generation_assets_jobs.sql`
14. `202605180006_reeditpro_qa_exports_audit.sql`
15. `202605180007_reeditpro_rls_policies.sql`
16. `202605180008_reeditpro_storage_buckets_policies.sql`
17. `202605190001_sfx_director_tables.sql`
18. `202605190002_storytiming_master_tables.sql`

## Current Blocking Risk

The migration folder contains overlapping table creation across the `20260513` and `20260518` chains. Before any remote deployment, local validation must prove the full chain applies cleanly or the schema must be reconciled.

The highest known risk is the `projects` table shape:

- `202605130001_core_reeditpro_tables.sql` creates `projects`.
- `202605180001_reeditpro_core_workspace_projects.sql` uses `create table if not exists public.projects` and then expects `current_edit_session_id`.
- If the earlier table remains unchanged, the later FK constraint can fail.

## Commands That Remain Disallowed

Do not run:

```text
supabase db reset --linked
supabase migration repair --linked
supabase db pull
supabase secrets set
supabase projects api-keys
```

Do not run destructive SQL.

Do not print secrets.
