# RP-BETA-INTEGRATION-08 Repair Checklist

## Failure

- [x] RP-BETA-INTEGRATION-07 blocker confirmed.
- [x] Failed migration inspected.
- [x] `idx_generation_requests_project_snapshot` located.
- [x] Root cause documented.
- [x] Generation request approved-snapshot schema intent checked.

## Patch

- [x] Patch only `202605180005_reeditpro_generation_assets_jobs.sql`.
- [x] Add nullable `generation_requests.approved_plan_snapshot_id`.
- [x] Add idempotent FK `generation_requests_approved_plan_snapshot_id_fkey`.
- [x] Reference `public.approved_plan_snapshots(id)` with `on delete set null`.
- [x] Keep `idx_generation_requests_project_snapshot` unchanged.
- [x] Preserve generation/assets/jobs schema intent.
- [x] Do not create a new migration.
- [x] Do not modify Creative Skill migrations.
- [x] Do not hide the error with exception swallowing.
- [x] Do not add generation, provider, job, credit, or approval execution.

## Local Verification

- [x] Remote-safety preflight passed.
- [x] Ports `55430` through `55439` checked.
- [x] Local Supabase started for `reeditpro-local`.
- [x] `supabase db reset --local --no-seed` ran.
- [x] Prior blocker passed.
- [x] New blocker documented.
- [x] Minimal Creative Skill smoke skipped because catalog migrations were not reached.
- [x] Local stack stopped with `supabase stop --project-id reeditpro-local`.

## Boundaries

- [x] Protected files unchanged except repaired migration.
- [x] Canonical manifest unchanged.
- [x] TypeScript contracts unchanged.
- [x] Mock fixtures unchanged.
- [x] Package files unchanged.
- [x] No remote Supabase used.
- [x] No `supabase link`.
- [x] No `supabase db push`.
- [x] No runtime, UI, provider, worker, or app changes.
- [x] No staging, commit, merge, push, or deploy.

## Fail Cases

Fail this prompt if it:

- Uses remote Supabase.
- Runs `supabase link`.
- Runs `supabase db push`.
- Patches another migration without approval.
- Makes a broad unrelated SQL rewrite.
- Changes Creative Skill migrations.
- Changes the canonical manifest.
- Changes TypeScript contracts, mock fixtures, or package files.
- Adds generation/provider/job execution.
- Adds credit reservation, spend, refund, or grant behavior.
- Adds approval execution behavior.
- Hides the migration error instead of fixing the missing compatibility column.
- Leaks local keys, passwords, tokens, or full connection strings.
- Stops the existing local `reeditpro` stack.
- Stages, commits, merges, pushes, or deploys.

## Next Prompt

`RP-BETA-INTEGRATION-09 - Local Migration Chain Repair for 202605180005 Generated Asset Version Compatibility`
