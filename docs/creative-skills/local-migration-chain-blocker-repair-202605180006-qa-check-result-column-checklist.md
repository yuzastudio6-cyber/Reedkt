# RP-BETA-INTEGRATION-10 QA Check Result Column Repair Checklist

## Failure

- RP-BETA-INTEGRATION-09 blocker confirmed.
- Failed migration inspected: `202605180006_reeditpro_qa_exports_audit.sql`.
- `qa_check_results` table located.
- `check text` syntax root cause documented.
- `src/types/edit-planning-db.ts` checked for `QACheckResultRecord.check`.
- Nearby normalized QA item lane checked for `check_type`.

## Patch

- Only the failed migration was patched.
- `check text` was changed to `"check" text`.
- Existing `check` field semantics were preserved.
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
- The original `qa_check_results.check` syntax blocker did not recur.
- A new `qa_reports.approved_plan_snapshot_id` compatibility blocker was documented.
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
- The migration patch is broader than the QA check result column compatibility issue.
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
