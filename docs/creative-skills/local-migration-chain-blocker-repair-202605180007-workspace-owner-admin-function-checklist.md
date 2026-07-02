# RP-BETA-INTEGRATION-13 Workspace Owner/Admin Function Repair Checklist

## Failure

- RP-BETA-INTEGRATION-12 blocker confirmed.
- Failed migration inspected: `202605180007_reeditpro_rls_policies.sql`.
- `is_workspace_owner_or_admin` replacement located.
- Existing `is_workspace_owner_or_admin(target_workspace_id uuid)` definitions located.
- Function parameter-name root cause documented.
- Workspace owner/admin RLS intent checked.
- Same-class helper scan completed.

## Patch

- Only the failed migration was patched.
- `is_workspace_owner_or_admin` now preserves `target_workspace_id`.
- Function body uses `target_workspace_id`.
- The RP-BETA-INTEGRATION-12 `is_workspace_member(target_workspace_id uuid)` repair remains intact.
- Positional policy call sites were left unchanged.
- No function drop/recreate path was used.
- No RLS policy was broadened.
- No permissive policy was added.
- No new migration was created.
- No Creative Skill migration was changed.
- No canonical manifest change was made.
- No TypeScript contract change was made.
- No mock fixture or package file changed.
- No runtime, provider, worker, UI, or app behavior was added.

## Local Verification

- Remote-safety preflight passed.
- Ports `55430` through `55439` were checked and free before start.
- `supabase start` ran locally for `reeditpro-local`.
- `supabase db reset --local --no-seed` ran locally.
- The original `is_workspace_owner_or_admin` parameter-name blocker did not recur.
- A new `storage.buckets` ownership blocker was documented.
- Minimal Creative Skill smoke did not run because the catalog migrations were not reached.
- `supabase stop --project-id reeditpro-local` ran after the local attempt.

## Boundaries

- Protected files remained unchanged except the approved target migration.
- Local Supabase side artifacts were left in place and not staged.
- No remote Supabase was used.
- No `supabase link` was run.
- No `supabase db push` was run.
- No production deploy occurred.
- No Qwen clone files were touched.
- No files were staged, committed, merged, or pushed.

## Fail The Prompt If

- Remote Supabase is used.
- `supabase link` is run.
- `supabase db push` is run.
- The migration patch is broader than the `is_workspace_owner_or_admin` signature compatibility issue.
- Another migration is patched without a focused approval.
- Creative Skill migrations are changed.
- The canonical manifest is changed.
- TypeScript contracts, mocks, or package files are changed.
- RLS is weakened.
- A permissive policy is added.
- The error is hidden instead of fixed.
- Local output leaks keys, passwords, tokens, or connection strings.
- The existing local `reeditpro` stack is stopped.
- Files are staged, committed, merged, or pushed.
