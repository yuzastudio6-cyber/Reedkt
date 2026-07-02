# RP-BETA-INTEGRATION-11 QA Report Approved Snapshot Repair Checklist

## Failure

- RP-BETA-INTEGRATION-10 blocker confirmed.
- Failed migration inspected: `202605180006_reeditpro_qa_exports_audit.sql`.
- `idx_qa_reports_project_snapshot` located.
- Missing `qa_reports.approved_plan_snapshot_id` root cause documented.
- Older `qa_reports` table shape inspected.
- `approved_plan_snapshots(id)` source migration inspected.

## Patch

- Only the failed migration was patched.
- Nullable `qa_reports.approved_plan_snapshot_id` was added.
- Idempotent FK `qa_reports_approved_plan_snapshot_id_fkey` was added.
- FK uses `on delete set null`.
- Existing index target was preserved.
- No backfill was added.
- No `not null` constraint was added.
- No new migration was created.
- No Creative Skill migration was changed.
- No canonical manifest change was made.
- No TypeScript contract change was made.
- No mock fixture or package file changed.
- No QA runtime/export execution was added.
- No credit reservation, spend, refund, or approval behavior was added.
- No provider, worker, UI, or app behavior was added.

## Local Verification

- Remote-safety preflight passed.
- Ports `55430` through `55439` were checked and free before start.
- `supabase start` ran locally for `reeditpro-local`.
- `supabase db reset --local --no-seed` ran locally.
- The original `qa_reports.approved_plan_snapshot_id` blocker did not recur.
- A new `202605180007_reeditpro_rls_policies.sql` function-signature blocker was documented.
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
- The migration patch is broader than the QA report approved-snapshot compatibility issue.
- Another migration is patched without a focused approval.
- Creative Skill migrations are changed.
- The canonical manifest is changed.
- TypeScript contracts, mocks, or package files are changed.
- QA runtime/export execution is added.
- Credit spending, reservation, refund, or approval execution is added.
- The error is hidden instead of fixed.
- Local output leaks keys, passwords, tokens, or connection strings.
- The existing local `reeditpro` stack is stopped.
- Files are staged, committed, merged, or pushed.
