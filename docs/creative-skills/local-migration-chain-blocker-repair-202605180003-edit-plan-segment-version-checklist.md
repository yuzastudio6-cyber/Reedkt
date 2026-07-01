# RP-BETA-INTEGRATION-05 Repair Checklist

## Inspection

- [x] Confirm RP-BETA-INTEGRATION-04 completed.
- [x] Confirm current blocker was in `202605180003_reeditpro_intent_plan_versions.sql`.
- [x] Confirm failing statement used `edit_plan_segments(edit_plan_version_id, segment_order)`.
- [x] Confirm older migration already created `edit_plan_segments` with `edit_plan_id`.
- [x] Confirm newer migration, draft SQL, schema plan, and RLS expect `edit_plan_version_id`.

## Repair

- [x] Patch only `202605180003_reeditpro_intent_plan_versions.sql`.
- [x] Add nullable `edit_plan_version_id uuid` before the index.
- [x] Add idempotent FK to `edit_plan_versions(id)` with `on delete set null`.
- [x] Keep `idx_edit_plan_segments_plan_order` unchanged.
- [x] Do not backfill.
- [x] Do not set `not null`.
- [x] Do not retarget the index to `edit_plan_id`.

## Local Safety

- [x] Confirm `supabase/config.toml` uses `project_id = "reeditpro-local"`.
- [x] Confirm DB port `55432`.
- [x] Check remote-risk Supabase environment variable names.
- [x] Check ports `55430` through `55439`.
- [x] Run local-only Supabase commands only after preflight passes.
- [x] Stop only `reeditpro-local` after this pass starts it.

## Result

- [x] Local reset passed the `202605180003` blocker.
- [x] Local reset stopped at a new blocker in `202605180004_reeditpro_credits_approval_snapshots.sql`.
- [x] Creative Skill catalog migrations were not reached.
- [x] Creative Skill catalog smoke did not run.

## Fail Cases

Fail this prompt if it:

- Creates a new migration.
- Modifies Creative Skill migrations.
- Modifies the canonical manifest.
- Modifies TypeScript contracts, mocks, packages, runtime, UI, providers, or workers.
- Backfills `edit_plan_version_id` without deterministic version rows.
- Makes `edit_plan_version_id` non-null.
- Uses remote Supabase.
- Runs `supabase link`.
- Runs `supabase db push`.
- Stages, commits, merges, pushes, or deploys.

## Next Prompt

`RP-BETA-INTEGRATION-06 - Local Migration Chain Repair for 202605180004 Approved Plan Snapshot Compatibility`
