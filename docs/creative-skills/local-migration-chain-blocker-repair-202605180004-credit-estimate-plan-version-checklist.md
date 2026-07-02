# RP-BETA-INTEGRATION-07 Repair Checklist

## Inspection

- [x] Confirm RP-BETA-INTEGRATION-06 completed.
- [x] Confirm current blocker was in `202605180004_reeditpro_credits_approval_snapshots.sql`.
- [x] Confirm failing statement was `idx_credit_estimates_project_plan`.
- [x] Confirm older migrations already create `credit_estimates` without `edit_plan_version_id`.
- [x] Confirm `edit_plan_versions(id)` exists before the FK repair.
- [x] Confirm no deterministic backfill exists from legacy `edit_plan_id` rows to plan-version rows.

## Repair

- [x] Patch only `202605180004_reeditpro_credits_approval_snapshots.sql`.
- [x] Add nullable `credit_estimates.edit_plan_version_id`.
- [x] Add idempotent FK `credit_estimates_edit_plan_version_id_fkey`.
- [x] Reference `public.edit_plan_versions(id)` with `on delete set null`.
- [x] Keep `idx_credit_estimates_project_plan` unchanged.
- [x] Do not remove or change legacy `credit_estimates.edit_plan_id`.
- [x] Do not add `not null`.
- [x] Do not backfill.
- [x] Do not reserve, spend, refund, or grant credits.

## Local Safety

- [x] Confirm `supabase/config.toml` uses `project_id = "reeditpro-local"`.
- [x] Confirm DB port `55432`.
- [x] Check remote-risk Supabase environment variable names.
- [x] Check ports `55430` through `55439`.
- [x] Run local-only Supabase commands only after preflight passes.
- [x] Stop only `reeditpro-local` after this pass starts it.

## Result

- [x] Local reset passed the `credit_estimates.edit_plan_version_id` blocker.
- [x] Local reset stopped at a new blocker in `202605180005_reeditpro_generation_assets_jobs.sql`.
- [x] Creative Skill catalog migrations were not reached.
- [x] Creative Skill catalog smoke did not run.

## Fail Cases

Fail this prompt if it:

- Creates a new migration.
- Modifies Creative Skill migrations.
- Modifies the canonical manifest.
- Modifies TypeScript contracts, mocks, packages, runtime, UI, providers, or workers.
- Backfills plan-version references without deterministic version rows.
- Makes `credit_estimates.edit_plan_version_id` non-null.
- Removes or rewrites legacy `credit_estimates.edit_plan_id`.
- Reserves, spends, refunds, or grants credits.
- Uses remote Supabase.
- Runs `supabase link`.
- Runs `supabase db push`.
- Stages, commits, merges, pushes, or deploys.

## Next Prompt

`RP-BETA-INTEGRATION-08 - Local Migration Chain Repair for 202605180005 Generation Request Snapshot Compatibility`
