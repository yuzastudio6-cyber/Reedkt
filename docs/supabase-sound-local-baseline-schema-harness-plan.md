# SUPABASE-SOUND-4-BASELINE-PLAN Local Baseline Schema Harness Plan

## Status

- Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.
- Requesting workstream: SOUND_MUSIC_AUDIO.
- Current unlock stage: dry_run_passed.
- Target future unlock stage: generated_local_fixture_passed.
- This document is plan/spec only.
- SQL executed by this prompt: no.
- `psql`, `createdb`, and `dropdb` executed by this prompt: no.
- Supabase CLI executed by this prompt: no.
- Docker or local service startup executed by this prompt: no.
- Migrations deployed by this prompt: no.
- Database rows, storage objects, signed URLs, generated assets, jobs, credits, approvals, providers, workers, media processing, render, mux, export, and billing operations created by this prompt: no.
- generated_local_fixture_passed claimed: no.

## Previous Blocker

SUPABASE-SOUND-4-RETRY-BASELINE proved that a plain local PostgreSQL target is not enough for approved ReEditPro baseline validation. The local safety proof and throwaway cleanup succeeded, but baseline migration loading stopped before any migration file ran because required Supabase platform relations were missing:

- `auth.users`
- `storage.buckets`
- `storage.objects`

The blocked report recorded:

- baseline migration files discovered: 21.
- baseline migration files attempted: 0.
- baseline migration files succeeded: 0.
- `approved_plan_snapshots` existence after baseline: not attempted.
- draft migration result: blocked.
- draft test result: blocked.
- cleanup verified: yes.
- Supabase cloud touched: no.

## Source-Of-Truth Path

```text
Supabase row
+ private GCS path
+ manifest
+ checksum
+ approved plan snapshot
```

Signed URLs are not source of truth. Public URLs and public artifacts remain blocked.

## Raw-Prompt-Safe Execution Path

```text
user/chat request
→ structured agent findings
→ edit intents
→ approved plan snapshot
→ worker execution
```

Raw prompt execution remains blocked. A baseline harness must not turn chat text into worker execution, provider transport, media processing, or storage mutation.

## Dependency Classification

| Dependency | Classification | Required for | Current plain Postgres status | Harness requirement |
| --- | --- | --- | --- | --- |
| `auth.users` | Supabase platform-provided | Auth foreign keys and workspace ownership baseline | missing | Must be provided by an approved local Supabase-compatible platform harness before ReEditPro app migrations load. |
| `storage.buckets` | Supabase platform-provided | Storage policy and bucket metadata baseline | missing | Must be provided by an approved local Supabase-compatible platform harness before storage policy migrations load. |
| `storage.objects` | Supabase platform-provided | Storage object policy baseline | missing | Must be provided by an approved local Supabase-compatible platform harness before storage policy migrations load. |
| `public.approved_plan_snapshots` | ReEditPro app baseline | Approved snapshot source for fixture records | not attempted | Must be created by approved app baseline migrations before the 999 SOUND fixture draft runs. |
| `public.storage_object_records` | ReEditPro app baseline | Private storage object record source-of-truth references | not attempted | Must be created by approved app baseline migrations before the 999 SOUND fixture draft runs. |
| `public.signed_url_events` | ReEditPro app baseline | Signed URL audit policy evidence only | not attempted | Must remain audit-only and never become fixture source of truth. |
| `public.generation_requests` | ReEditPro app baseline | Generation request safety and blocked execution metadata | not attempted | Must exist before fixture draft references. |
| `public.generated_assets` | ReEditPro app baseline | Generated asset blocking and no-public-artifact evidence | not attempted | Must exist before fixture draft references. |
| `public.jobs` | ReEditPro app baseline | Worker/job no-dispatch metadata | not attempted | Must exist before fixture draft references. |
| `public.job_events` | ReEditPro app baseline | Worker/job event no-dispatch metadata | not attempted | Must exist before fixture draft references. |
| `public.sound_effect_plans` | ReEditPro SOUND planning baseline | SFX planning metadata | not attempted | Must exist before fixture draft references. |
| `public.ambient_sound_plans` | ReEditPro SOUND planning baseline | Ambient/everyday soundscape planning metadata | not attempted | Must exist before fixture draft references. |
| `public.music_plans` | ReEditPro SOUND planning baseline | Music/song/soundtrack planning metadata | not attempted | Must exist before fixture draft references. |
| `public.audio_environment_analysis` | ReEditPro SOUND planning baseline | Audio environment and QA metadata references | not attempted | Must exist before fixture draft references. |
| `public.qa_reports` | ReEditPro app baseline | QA evidence references | not attempted | Must exist before fixture draft references. |
| `public.credit_estimates` | ReEditPro app baseline | No-spend placeholder and credit evidence references | not attempted | Must exist before fixture draft references. |
| `public.credit_approvals` | ReEditPro app baseline | Approval/spend blocking evidence | not attempted | Must exist before fixture draft references. |
| `public.credit_reservations` | ReEditPro app baseline | Reservation/spend blocking evidence | not attempted | Must exist before fixture draft references. |
| `public.worker_runtime_configs` | ReEditPro app baseline | Worker runtime config no-execution gate references | not attempted | Must exist before fixture draft references. |
| `public.feature_gates` | Optional live metadata surface | Future gate evidence only | unknown for local baseline | Must not be seeded by this draft; use only if an approved baseline provides it. |
| `public.tool_capabilities` | Optional live metadata surface | Future tool readiness evidence only | unknown for local baseline | Must not be seeded by this draft; use only if an approved baseline provides it. |
| `database/migration-drafts/999_supabase_sound_local_fixture_records_draft.sql` | SOUND fixture draft | Fixture-specific guards and metadata references | present as draft | Must run only after platform and app baseline prerequisites are provided. |
| `database/test-sql/999_supabase_sound_local_fixture_records_tests.sql` | SOUND fixture draft tests | Future local/staging-only assertions | present as draft tests | Must run only after the approved baseline and draft migration pass. |

## Harness Options

### Option A: Approved Local Supabase Platform Stack

- Status now: not approved for this prompt.
- Future use: allowed only after explicit owner approval for a local Supabase-compatible stack or equivalent local platform harness.
- What it provides: `auth.users`, `storage.buckets`, `storage.objects`, and platform behavior close enough for RLS/storage validation.
- What remains forbidden now: starting services, running Supabase CLI, running Docker, applying migrations, executing SQL, or touching cloud/staging/production.
- Acceptance note: this is the recommended path if owners approve local stack execution in a future prompt.

### Option B: Approved Repo-Local Baseline Harness

- Status now: not found.
- Future use: allowed only if the repository later contains an approved no-cloud baseline harness that provides platform prerequisites and app baseline migrations without secrets or live data.
- What it provides: deterministic local baseline setup instructions or fixtures accepted by SUPABASE_RLS_STORAGE_DATABASE.
- Acceptance note: this is acceptable only if the harness exists in repo and has owner approval before any SQL retry.

### Option C: Minimal Platform Prerequisite Stub Harness

- Status now: not recommended.
- Future use: only after explicit owner approval that documents reduced fidelity.
- What it provides: narrow local stubs for missing platform relations.
- Limitation: stubs cannot claim Supabase platform RLS/storage correctness and must not become active migrations or production policy.
- Acceptance note: this is a last-resort validation harness for draft syntax and baseline guards only.

### Option D: Plain Local PostgreSQL Only

- Status now: blocked.
- Evidence: SUPABASE-SOUND-4-RETRY-BASELINE showed `auth.users`, `storage.buckets`, and `storage.objects` are missing.
- Acceptance note: plain local PostgreSQL must not be used for another baseline retry by itself.

## Recommended Harness Path

Use an approved local Supabase-platform baseline harness. Option A is preferred after explicit owner approval for local Supabase-compatible stack execution. Option B may replace it only if an approved repo-local harness appears later. Plain PostgreSQL alone remains blocked. Manual platform stubs are not the default and require a separate acceptance record.

## Future Safety Preflight

A future retry must prove all of the following before SQL:

- The target is local and throwaway.
- No cloud, staging, production, or live customer data target is used.
- No secrets or full environment values are printed.
- The local target contains `auth.users`, `storage.buckets`, and `storage.objects`.
- ReEditPro app baseline migrations can be reconciled from `supabase/migration-order.md` plus real `supabase/migrations/*.sql` files while excluding macOS metadata files.
- `public.approved_plan_snapshots` exists after app baseline load.
- The 999 SOUND draft SQL and draft tests are unchanged from their approved draft inputs.
- Cleanup and rollback commands are defined before validation starts.
- `generated_local_fixture_passed` remains unclaimed until a later review explicitly accepts the evidence.

Future command examples may be documented in a later prompt, but no command examples in this packet are executed now.

## Forbidden Harness Paths

- Plain PostgreSQL retry without Supabase platform prerequisites.
- Manual platform stubs without explicit owner approval.
- Supabase cloud, staging, production, or live-data targets.
- Active `supabase/migrations/*` changes from this plan.
- Seeding `feature_gates`, `tool_capabilities`, or `worker_runtime_configs`.
- Creating storage buckets or objects.
- Creating signed URLs or treating signed URLs as source of truth.
- Creating generated assets, jobs, job events, credit rows, approval rows, or QA/audit/cost rows.
- Provider calls, worker dispatch, media processing, FFmpeg/ffprobe, render, mux, export, Stripe/payment operations, GCP, Docker, service startup, or model inference from this prompt.

## Evidence Required Before Retry

- Supabase owner approval for the selected baseline harness.
- A local-only target proof plan that excludes cloud, staging, production, and live data.
- Evidence that `auth.users`, `storage.buckets`, and `storage.objects` are provided by the harness.
- Evidence that ReEditPro app baseline migrations can load in timestamp order.
- Evidence that `public.approved_plan_snapshots`, `public.storage_object_records`, `public.signed_url_events`, generation/job/SOUND planning/QA/credit tables, and `public.worker_runtime_configs` exist before the 999 draft.
- Cleanup and rollback proof requirements.
- Confirmation that provider, worker, media, render/export, storage, billing, and public artifact execution remain blocked.

## Supabase Update Classification

- Supabase update required: no.
- Supabase update status: plan-only / harness-approval-only.
- Supabase environment touched: none.
- SQL executed: no.
- Migration deployed: no.
- Storage touched: no.
- Rows created: no.
- Signed URLs created: no.
- Next Supabase action: approve a local Supabase-compatible baseline harness before retry.

## Exit Criteria Before Another SQL Retry

- The selected harness path is explicitly approved.
- The selected harness supplies Supabase platform prerequisites.
- The ReEditPro app baseline order is reconciled.
- The 999 draft remains draft-only and unchanged unless a separate fix prompt changes it.
- All owner no-execution gates remain intact.
- No generated_local_fixture_passed claim is made.

## Recommendation

SUPABASE-SOUND-4-BASELINE-APPROVAL: approve local Supabase baseline harness execution, no SQL
