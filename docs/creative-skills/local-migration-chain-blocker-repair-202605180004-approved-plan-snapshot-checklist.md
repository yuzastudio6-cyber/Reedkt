# RP-BETA-INTEGRATION-06 Repair Checklist

## Inspection

- [x] Confirm RP-BETA-INTEGRATION-05 completed.
- [x] Confirm current blocker was in `202605180004_reeditpro_credits_approval_snapshots.sql`.
- [x] Confirm failing block was `credit_reservations_approved_plan_snapshot_id_fkey`.
- [x] Confirm older migrations already create `credit_reservations` without `approved_plan_snapshot_id`.
- [x] Confirm older migrations already create `credit_ledger_entries` without `approved_plan_snapshot_id`.
- [x] Confirm `approval_records.approved_snapshot_id` is already present in the same migration.

## Repair

- [x] Patch only `202605180004_reeditpro_credits_approval_snapshots.sql`.
- [x] Add nullable `credit_reservations.approved_plan_snapshot_id`.
- [x] Add nullable `credit_ledger_entries.approved_plan_snapshot_id`.
- [x] Keep existing FK names and targets.
- [x] Do not add `not null`.
- [x] Do not backfill.
- [x] Do not reserve, spend, release, refund, or grant credits.

## Local Safety

- [x] Confirm `supabase/config.toml` uses `project_id = "reeditpro-local"`.
- [x] Confirm DB port `55432`.
- [x] Check remote-risk Supabase environment variable names.
- [x] Check ports `55430` through `55439`.
- [x] Run local-only Supabase commands only after preflight passes.
- [x] Stop only `reeditpro-local` after this pass starts it.

## Result

- [x] Local reset passed the approved-plan-snapshot FK blocker.
- [x] Local reset stopped at a new blocker in `202605180004_reeditpro_credits_approval_snapshots.sql`.
- [x] Creative Skill catalog migrations were not reached.
- [x] Creative Skill catalog smoke did not run.

## Fail Cases

Fail this prompt if it:

- Creates a new migration.
- Modifies Creative Skill migrations.
- Modifies the canonical manifest.
- Modifies TypeScript contracts, mocks, packages, runtime, UI, providers, or workers.
- Backfills approved snapshot references without deterministic snapshot rows.
- Makes approved snapshot references non-null.
- Reserves, spends, releases, refunds, or grants credits.
- Uses remote Supabase.
- Runs `supabase link`.
- Runs `supabase db push`.
- Stages, commits, merges, pushes, or deploys.

## Next Prompt

`RP-BETA-INTEGRATION-07 - Local Migration Chain Repair for 202605180004 Credit Estimate Plan Version Compatibility`
