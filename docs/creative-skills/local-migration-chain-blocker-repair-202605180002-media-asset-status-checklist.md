# RP-BETA-INTEGRATION-04 Media Asset Status Repair Checklist

## Failure

- [x] RP-BETA-INTEGRATION-03 blocker confirmed.
- [x] Failed migration inspected: `202605180002_reeditpro_media_source_sequence.sql`.
- [x] `status` index located.
- [x] Root cause documented.
- [x] Intended media schema checked.

## Patch

- [x] Only the failed migration was changed.
- [x] Media asset status/index defect was fixed.
- [x] Existing `processing_status` behavior was preserved.
- [x] No new migration was created.
- [x] No Creative Skill migration was changed.
- [x] No conflict swallowing or exception hiding was added.

## Local Verification

- [x] Remote safety preflight was run.
- [x] Ports `55430` through `55439` were checked.
- [x] Local Supabase was started for `reeditpro-local`.
- [x] `supabase db reset --local --no-seed` was run.
- [x] The repaired blocker did not recur.
- [x] A new unrelated blocker was documented.
- [x] Minimal Creative Skill smoke was skipped because the catalog migrations were not reached.
- [x] Local stack was stopped with `supabase stop --project-id reeditpro-local`.

## Boundaries

- [x] Protected files remained unchanged except the repaired migration.
- [x] Canonical manifest unchanged.
- [x] TypeScript unchanged.
- [x] Mock fixtures unchanged.
- [x] Package files unchanged.
- [x] No remote Supabase.
- [x] No `supabase db push`.
- [x] No `supabase link`.
- [x] No runtime, UI, provider, worker, or app changes.
- [x] No staging, commit, or merge.

## Fail The Prompt If

- Remote Supabase is used.
- `supabase link` is run.
- `supabase db push` is run.
- The migration patch is broad or unrelated.
- Another migration is patched without approval.
- Creative Skill migrations are changed.
- The canonical manifest is changed.
- TypeScript, mocks, or package files are changed.
- The error is hidden instead of fixed.
- Local output leaks secrets, passwords, tokens, keys, or full database URLs.
- The existing local `reeditpro` stack is stopped.
- Files are staged, committed, or merged.
