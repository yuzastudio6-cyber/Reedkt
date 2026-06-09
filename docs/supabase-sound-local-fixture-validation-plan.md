# SUPABASE-SOUND-3 Local Fixture Validation Plan

## Status

- Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.
- Requesting workstream: SOUND_MUSIC_AUDIO.
- Current SOUND stage: dry_run_passed.
- Target future stage: generated_local_fixture_passed.
- This document is a local validation plan only.
- This document does not execute SQL.
- This document does not run migrations.
- This document does not deploy migrations.
- This document does not create rows.
- This document does not create storage buckets or objects.
- This document does not create signed URLs.
- This document does not unlock generated_local_fixture_passed.

SUPABASE-SOUND-3 defines how a later approved prompt could validate the SUPABASE-SOUND-2 draft migration and draft RLS/storage tests in a safe local or explicitly approved non-production environment. It does not perform that validation.

## Source-of-truth rule

```text
Supabase row
+ private GCS path
+ manifest
+ checksum
+ approved plan snapshot
```

Signed URLs are not source of truth. Public URLs are blocked. Public artifacts are blocked. Source media must remain immutable. Private path, checksum, manifest, and approved plan snapshot must align before any future fixture execution can claim generated_local_fixture_passed.

## Raw prompt rule

```text
user/chat request
→ structured agent findings
→ edit intents
→ approved plan snapshot
→ worker execution
```

Raw prompt execution is blocked. Supabase records must not store raw prompt execution payloads for workers. Worker-oriented records must reference approved snapshots, structured findings, edit intents, manifests, idempotency metadata, and private source-of-truth records.

## Draft inputs

- `database/migration-drafts/999_supabase_sound_local_fixture_records_draft.sql`
- `database/test-sql/999_supabase_sound_local_fixture_records_tests.sql`
- `docs/supabase-sound-local-fixture-mutation-plan.md`
- `supabase/migration-order.md`
- `supabase/schema-health-checks.sql`

The draft migration remains under `database/migration-drafts`. The draft test SQL remains under `database/test-sql`. No active migration for this draft exists under `supabase/migrations`.

## What local validation would prove later

- Draft SQL parses in an approved local or explicitly approved non-production database.
- Draft RLS tests can run in an approved local or explicitly approved non-production database.
- Approved snapshot immutability rules are testable.
- Storage object record private/checksum rules are testable.
- Signed URL source-of-truth rejection is testable.
- Raw worker prompt rejection is testable.
- Generated asset private storage linkage is testable.
- Feature gate, tool capability, and worker runtime frontend bypass prevention is testable.
- No production data is touched.
- No public artifacts are created.

## What this plan does not prove

- No SQL has been executed.
- No migration has been applied.
- No live Supabase rows exist.
- No storage objects exist.
- No signed URLs exist.
- No worker dispatch is accepted.
- No provider call is accepted.
- No generated asset exists.
- No credits or approvals exist.
- No staging, beta, external beta, paid production, or production readiness is claimed.

## Future local validation environment requirements

- Environment must be local or explicitly approved non-production.
- Environment must not be production.
- Environment must not use live customer data.
- Validation must use mock workspace and project IDs.
- Validation must use mock approved snapshot payloads.
- Validation must use mock storage records.
- Validation must use mock generated asset metadata.
- Validation must use mock jobs and job_events.
- Validation must not create public buckets.
- Validation must not create signed URLs.
- Validation must not use provider secrets.
- Validation must not use service-role keys outside an approved local harness.
- Validation must have a rollback and cleanup plan.
- Validation must log validation output only.

## Future command plan

The following commands are examples only and are not run by this prompt:

```bash
supabase db reset
```

```bash
psql "$LOCAL_THROWAWAY_DATABASE_URL" -f database/migration-drafts/999_supabase_sound_local_fixture_records_draft.sql
```

```bash
psql "$LOCAL_THROWAWAY_DATABASE_URL" -f database/test-sql/999_supabase_sound_local_fixture_records_tests.sql
```

```bash
npm run smoke:supabase-sound-draft-local-fixture-migration
```

```bash
npm run smoke:supabase-sound-local-fixture-validation
```

These commands require SUPABASE_RLS_STORAGE_DATABASE owner acceptance before use. They also require confirmation that the target database is local or explicitly approved non-production, contains no live customer data, and has a rollback plan.

## Validation checklist before running future local SQL

- Source-of-truth docs reviewed.
- Local database confirmed non-production.
- No live customer data.
- Migration draft reviewed.
- Test SQL reviewed.
- Rollback reviewed.
- No public storage.
- No signed URL source-of-truth.
- No provider calls.
- No worker dispatch.
- No credit or approval rows beyond mock local test rows.
- No staging, beta, external beta, paid production, or production claim.

## Expected validation assertions

- Approved snapshots immutable.
- Approved snapshots require checksum, source IDs, and immutable version.
- storage_object_records require private scope.
- storage_object_records require checksum.
- storage_object_records reject public artifact.
- storage_object_records reject signed URL source-of-truth.
- signed_url_events are audit-only.
- generation_requests require approved snapshot before future execution.
- generated_assets require storage_object_record_id.
- generated_assets require private scope and public_artifact_allowed=false.
- jobs require idempotency and approved snapshot.
- jobs reject raw prompt execution.
- jobs reject signed URL input.
- feature gates and tool capabilities cannot be client-writable.
- worker_runtime_configs remain service-owned.
- Workspace isolation exists.
- Service-role write boundaries exist.

## Advisor validation plan

- Run security advisors only in an approved environment.
- Run performance advisors only in an approved environment.
- Capture RLS no-policy findings.
- Capture mutable search_path findings.
- Capture SECURITY DEFINER findings.
- Capture unindexed FK findings.
- Capture duplicate index findings.
- No advisor commands run now.

## DB type regeneration plan

DB types must not be regenerated in this prompt. DB types may be regenerated only after a future accepted migration is applied in an approved environment. Future generated types must be reviewed for SOUND_MUSIC_AUDIO, TRACK_A_RENDER_EXPORT, WORKER_RUNTIME_JOBS, and SUPABASE_RLS_STORAGE_DATABASE boundaries.

## Rollback / cleanup validation plan

- Validate fixture rows can be identified by fixture_scope.
- Validate fixture storage records can be identified.
- Validate fixture jobs and events can be identified.
- Validate fixture generated assets can be identified.
- Validate mock credit rows, if ever allowed, can be identified.
- Validate cleanup is owner-approved before execution.
- No cleanup is executed now.

## Owner gates before any local SQL validation

- SUPABASE_RLS_STORAGE_DATABASE accepts local validation execution.
- SOUND_MUSIC_AUDIO confirms fixture spec requirements.
- WORKER_RUNTIME_JOBS confirms no worker dispatch.
- PROVIDER_GATEWAY_MODELS confirms no provider calls.
- OBSERVABILITY_AUDIT_COST confirms evidence capture expectations.
- BILLING_STRIPE_CREDITS confirms no spend or reservation.
- TRACK_A_RENDER_EXPORT confirms no export readiness claim.
- TRACK_B_MEDIA_PROCESSING confirms no media processing.

## Next prompt recommendation

`SUPABASE-SOUND-3A: owner acceptance packet for local SQL validation, no execution`

Local SQL validation can be planned, but it must not run until the owning workstreams explicitly accept the local/non-production validation harness, rollback plan, and no-execution boundaries.
