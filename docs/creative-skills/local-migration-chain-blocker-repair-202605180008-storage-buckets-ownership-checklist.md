# RP-BETA-INTEGRATION-14 Storage Buckets Ownership Repair Checklist

## Failure

- RP-BETA-INTEGRATION-13 blocker confirmed.
- Failed migration inspected: `202605180008_reeditpro_storage_buckets_policies.sql`.
- `storage.buckets` table comment located.
- Same-class storage comments checked.
- Root cause documented.
- Storage policy intent checked.

## Patch

- Only the failed migration was patched.
- Ownership-sensitive storage database comments were converted to SQL comments.
- Storage bucket insert/update behavior was preserved.
- Storage policies were preserved.
- Bucket privacy/public intent was preserved.
- No new migration was created.
- No Creative Skill migration was changed.
- No storage RLS broadening occurred.
- No permissive storage policy was added.
- No canonical manifest change was made.
- No TypeScript contract change was made.
- No mock fixture or package file changed.
- No runtime, provider, worker, UI, storage runtime, or app behavior was added.

## Local Verification

- Remote-safety preflight passed.
- Ports `55430` through `55439` were checked and free before start.
- `supabase start` was attempted locally for `reeditpro-local`.
- Local start failed because Docker was not reachable.
- `supabase db reset --local --no-seed` did not run.
- Minimal Creative Skill smoke did not run because the catalog migrations were not reached.
- No local stack stop was needed because this pass did not start the stack.

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
- The migration patch is broader than the ownership-sensitive storage comment repair.
- Another migration is patched without a focused approval.
- Creative Skill migrations are changed.
- The canonical manifest is changed.
- TypeScript contracts, mocks, or package files are changed.
- Storage RLS is weakened.
- Public storage access is added without existing approval.
- A permissive storage policy is added.
- The error is hidden instead of fixed.
- Local output leaks keys, passwords, tokens, or connection strings.
- The existing local `reeditpro` stack is stopped.
- Files are staged, committed, merged, or pushed.
