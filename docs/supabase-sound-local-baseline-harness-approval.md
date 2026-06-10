# SUPABASE-SOUND-4-BASELINE-APPROVAL Local Baseline Harness Approval

## Status

- Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.
- Requesting workstream: SOUND_MUSIC_AUDIO.
- Current SOUND stage: dry_run_passed.
- Target future stage: generated_local_fixture_passed.
- This document is approval-only.
- This document does not execute SQL.
- This document does not run Supabase CLI commands.
- This document does not use Docker.
- This document does not create databases.
- This document does not start services.
- This document does not deploy migrations.
- This document does not touch Supabase cloud.
- This document does not unlock generated_local_fixture_passed.

## Previous Validation Blocker

- Plain local PostgreSQL was insufficient.
- Missing Supabase platform prerequisites were `auth.users`, `storage.buckets`, and `storage.objects`.
- Baseline validation was blocked before applying migrations.
- Draft migration and draft tests were not run.
- Cleanup was verified.
- Supabase cloud was not touched.

## Source-Of-Truth Rule

```text
Supabase row
+ private GCS path
+ manifest
+ checksum
+ approved plan snapshot
```

Signed URLs are not source of truth. Public URLs and public artifacts remain blocked.

## Raw Prompt Rule

```text
user/chat request
→ structured agent findings
→ edit intents
→ approved plan snapshot
→ worker execution
```

Raw prompt execution remains blocked. A local baseline harness must never turn chat text into direct worker execution, provider execution, storage mutation, media processing, or billing activity.

## Approval Decision

- approvalDecision: conditional_approval_for_future_local_supabase_baseline_harness_execution.
- futureLocalHarnessExecutionApproved: true.
- futureDockerOrSupabaseCliAllowedOnlyInNextPrompt: true.
- generatedLocalFixturePassedClaimed: false.

SUPABASE_RLS_STORAGE_DATABASE conditionally approves a future prompt to run a local, no-cloud, no-production, no-staging, no-live-data Supabase-compatible baseline harness. This approval exists only so a later prompt can repeat the safety gates and attempt local harness validation. It does not authorize execution now.

If the future harness requires Docker or Supabase CLI, that usage is approved only for the future local harness execution prompt. This prompt does not run Docker, Supabase CLI, SQL, database creation, database cleanup, services, migrations, or validation commands.

The future prompt must not touch Supabase cloud and must not claim generated_local_fixture_passed.

## Approved Future Harness Path

- Preferred path: approved local Supabase-compatible baseline harness that provides `auth.users`, `storage.buckets`, and `storage.objects`.
- Approved repo-local baseline harness found now: no.
- Conditional approval: Option A future local Supabase stack execution is approved only after the next prompt repeats all safety gates.
- Option B remains available only if an approved repo-local harness appears later.
- Plain PostgreSQL alone remains blocked because it does not provide Supabase platform schemas.
- Manual platform stubs are not the default and are not approved here.

## Conditions For Future Harness Execution

- local only.
- no Supabase cloud.
- no production target.
- no staging target.
- no live customer data.
- no secrets printed.
- no remote database URLs.
- no provider calls.
- no worker dispatch.
- no storage writes outside the local harness.
- no signed URLs.
- no public artifacts.
- no generated audio or generated assets.
- no credit spend or reservation.
- no render, mux, or export.
- no generated_local_fixture_passed claim.
- cleanup and rollback required.
- sanitized output capture required.
- draft SQL and draft test files unchanged.
- final owner evidence rollup still valid.
- `auth.users`, `storage.buckets`, and `storage.objects` available before app baseline migration load.
- `public.approved_plan_snapshots` available after app baseline migration load before the SOUND 999 draft.

## Approved Future Command Categories

No command is run now. All command categories below require the future prompt:

- local Supabase-compatible platform harness startup, if required and approved by the future prompt.
- local baseline schema load or reset inside the local harness only.
- local validation against the harness database only.
- fixed SOUND draft migration validation inside the local harness only.
- fixed SOUND draft test validation inside the local harness only.
- cleanup or teardown of local harness resources only.

## Forbidden Paths

- Supabase cloud.
- production.
- staging unless separately approved later.
- live customer data.
- remote database URLs.
- active migration deployment.
- writing `supabase/migrations`.
- provider calls.
- worker dispatch.
- signed URLs.
- public artifacts.
- generated audio or generated assets.
- credit spend or reservation.
- render, mux, or export.
- generated_local_fixture_passed claim.
- manual platform stubs from this approval.
- plain local PostgreSQL as the only harness.

## Evidence Required In Future Harness Execution Prompt

- harness target name.
- local-only proof.
- no-cloud proof.
- no-production proof.
- no-staging proof.
- no-live-data proof.
- `auth.users` available.
- `storage.buckets` available.
- `storage.objects` available.
- `public.approved_plan_snapshots` available after app baseline.
- draft SQL and draft tests unchanged.
- cleanup and rollback plan.
- sanitized output plan.
- final owner evidence rollup still valid.
- no active `supabase/migrations/999_supabase_sound_local_fixture_records_draft.sql` file.

## Runtime Gates

- SQL executed now: false.
- Supabase CLI executed now: false.
- Docker used now: false.
- database created now: false.
- database dropped now: false.
- service started now: false.
- package installed now: false.
- migration deployed now: false.
- Supabase cloud touched now: false.
- provider calls made now: false.
- workers dispatched now: false.
- generated audio created now: false.
- generated assets created now: false.
- storage objects created now: false.
- signed URLs created now: false.
- public artifacts created now: false.
- media processing run now: false.
- FFmpeg or ffprobe run now: false.
- model inference run now: false.
- render, mux, or export run now: false.
- credit spend occurred now: false.

## generated_local_fixture_passed Status

- claimed: no.
- reason: this packet only approves a future local baseline harness execution path. It does not run the harness or validate the draft migration/test SQL.
- next gate required: future local harness validation with approved local Supabase-compatible baseline harness.

## Supabase Update Classification

- Supabase update required: no live update.
- Supabase update status: approval-only / no SQL / no deploy.
- Supabase environment touched: none.
- SQL executed: no.
- Migration deployed: no.
- Storage touched: no.
- Rows created: no.
- Signed URLs created: no.
- Evidence docs: SUPABASE-SOUND-4-BASELINE-PLAN plus this approval packet.
- Blockers: harness not executed yet; no local baseline validation pass; no generated_local_fixture_passed claim.
- Next Supabase action: run only the future approved local harness validation prompt.

## Recommendation

SUPABASE-SOUND-4-RETRY-HARNESS: run draft validation with approved local Supabase baseline harness, no deploy
