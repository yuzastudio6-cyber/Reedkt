# RP-BETA-INTEGRATION-02 Owner ID Repair Checklist

## Failure

- [x] RP-BETA-INTEGRATION-01 blocker confirmed.
- [x] Failed migration inspected.
- [x] `owner_id` index located.
- [x] Root cause documented.
- [x] Intended schema checked against migrations, docs, and later RLS references.

## Patch

- [x] Only `202605180001_reeditpro_core_workspace_projects.sql` was patched.
- [x] Owner-column/index defect was fixed.
- [x] Existing behavior was preserved.
- [x] No new migration was created.
- [x] Creative Skill catalog migrations were not changed.
- [x] No exception swallowing or conflict hiding was added.

## Local Verification

- [x] Remote-safety preflight ran.
- [x] Patched ports were checked.
- [x] Local Supabase started.
- [x] `supabase db reset --local --no-seed` ran.
- [x] Chain passed the previous owner-index blocker.
- [x] New blocker was documented.
- [x] Minimal Creative Skill smoke was skipped because the chain did not reach Creative Skill migrations.
- [x] Local stack was stopped with `supabase stop --project-id reeditpro-local`.

## Boundaries

- [x] Protected files were hash-baselined before edits.
- [x] Config stayed unchanged.
- [x] Creative Skill migrations stayed unchanged.
- [x] Canonical manifest stayed unchanged.
- [x] TypeScript contracts stayed unchanged.
- [x] Mock fixtures stayed unchanged.
- [x] Package files stayed unchanged.
- [x] No remote Supabase was used.
- [x] No `supabase link` was run.
- [x] No `supabase db push` was run.
- [x] No stage, commit, merge, push, deploy, runtime, UI, provider, worker, job, credit, approval, render/export, or app behavior occurred.

## Fail The Prompt If

- Remote Supabase is used.
- `supabase link` is run.
- `supabase db push` is run.
- The migration patch is broad or unrelated.
- Another migration is patched without approval.
- Creative Skill migrations are changed.
- The canonical manifest is changed.
- TypeScript, mocks, or package files are changed.
- The error is swallowed instead of fixed.
- Local command output leaks credentials or full connection strings.
- The existing local `reeditpro` stack is stopped.
- Files are staged, committed, merged, or pushed.
