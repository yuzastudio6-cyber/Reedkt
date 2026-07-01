# RP-BETA-INTEGRATION-09 Repair Checklist

## Failure

- [x] RP-BETA-INTEGRATION-08 blocker confirmed.
- [x] Failed migration inspected.
- [x] `idx_generated_asset_versions_asset_version` located.
- [x] Root cause documented.
- [x] Generated asset version schema intent checked.

## Patch

- [x] Patch only `202605180005_reeditpro_generation_assets_jobs.sql`.
- [x] Retarget generated asset version index to `version_number`.
- [x] Keep the existing index name.
- [x] Do not add a duplicate `version` column.
- [x] Preserve generated asset version ordering behavior.
- [x] Preserve existing constraints and policies.
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
- Adds a duplicate generated asset version field without source-truth need.
- Hides the migration error instead of fixing the index target.
- Leaks local keys, passwords, tokens, or full connection strings.
- Stops the existing local `reeditpro` stack.
- Stages, commits, merges, pushes, or deploys.

## Next Prompt

`RP-BETA-INTEGRATION-10 - Local Migration Chain Repair for 202605180006 QA Check Result Column Compatibility`
