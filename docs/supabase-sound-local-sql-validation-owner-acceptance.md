# SUPABASE-SOUND-3A Local SQL Validation Owner Acceptance Packet

## Status

- Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.
- Requesting workstream: SOUND_MUSIC_AUDIO.
- Current SOUND stage: dry_run_passed.
- Target future stage: generated_local_fixture_passed.
- This packet is owner-acceptance-only.
- This packet does not execute SQL.
- This packet does not run migrations.
- This packet does not deploy migrations.
- This packet does not create rows.
- This packet does not create storage buckets or objects.
- This packet does not create signed URLs.
- This packet does not unlock generated_local_fixture_passed.

SUPABASE-SOUND-3A records the owner acceptance boundaries required before a later prompt may run local SQL validation for the SUPABASE-SOUND-2 draft migration and draft RLS/storage tests. It does not perform validation, execute SQL, run migrations, mutate Supabase, create rows, create storage, create signed URLs, call providers, dispatch workers, or unlock any environment.

## Source-of-truth rule

```text
Supabase row
+ private GCS path
+ manifest
+ checksum
+ approved plan snapshot
```

Signed URLs are not source of truth. Public URLs are blocked. Public artifacts are blocked. Source media must remain immutable. Private path, checksum, manifest, and approved plan snapshot must align before fixture execution.

## Raw prompt rule

```text
user/chat request
→ structured agent findings
→ edit intents
→ approved plan snapshot
→ worker execution
```

Raw prompt execution is blocked. Supabase records must not store raw prompt execution payloads for workers. Future worker-oriented records must reference approved snapshots, structured findings, edit intents, manifests, idempotency metadata, and private source-of-truth records.

## Inputs requiring owner acceptance

- `docs/supabase-sound-local-fixture-validation-plan.md`
- `docs/supabase-sound-local-fixture-mutation-plan.md`
- `database/migration-drafts/999_supabase_sound_local_fixture_records_draft.sql`
- `database/test-sql/999_supabase_sound_local_fixture_records_tests.sql`
- `docs/sound-music-audio-owner-acceptance-checklist.md`
- `docs/sound-music-audio-generated-local-fixture-handoff-packet.md`
- `docs/sound-music-audio-generated-local-fixture-plan.md`

## Acceptance decision requested

A future prompt may run local SQL validation only if all required owners accept:

- local/non-production environment;
- no production data;
- no live customer data;
- no staging, beta, external beta, paid production, or production claim;
- no public artifacts;
- no signed URLs;
- no provider calls;
- no worker dispatch;
- no credit spend or reservation;
- no Track A export;
- no Track B processing;
- rollback/cleanup plan.

## Owner acceptance matrix

### SUPABASE_RLS_STORAGE_DATABASE

Must accept:
- local throwaway/non-production database target;
- no production DB;
- no live customer data;
- draft migration validation scope;
- draft test validation scope;
- RLS/storage policy assertions;
- workspace isolation assertions;
- service-role boundary assertions;
- no signed URL source-of-truth;
- no public artifact;
- rollback/cleanup expectations.

Acceptance status: not_accepted_for_execution.

Required evidence:
- target environment proof;
- no-production confirmation;
- no-live-data confirmation;
- rollback/cleanup plan;
- command approval.

Forbidden bypass:
- no SQL validation without owner approval;
- no production target;
- no live data.

### SOUND_MUSIC_AUDIO

Must accept:
- fixture spec requirements;
- timing/private manifest expectations;
- approved snapshot requirement;
- checksum/private path expectation;
- no provider/worker execution.

Acceptance status: not_accepted_for_execution.

Required evidence:
- fixture requirements confirmation;
- timing-aware cue manifest expectation review;
- private audio artifact manifest expectation review;
- approved snapshot/checksum/private path confirmation.

Forbidden bypass:
- no artifact creation from SOUND;
- no generated_local_fixture_passed claim.

### WORKER_RUNTIME_JOBS

Must accept:
- local SQL validation does not dispatch workers;
- worker payload shape remains future-only;
- no claim/lease execution;
- no raw prompt worker payloads;
- no signed URL inputs;
- idempotency expectations only.

Acceptance status: not_accepted_for_execution.

Required evidence:
- no-dispatch acknowledgement;
- future payload boundary acceptance;
- idempotency expectation review;
- no claim/lease execution confirmation.

Forbidden bypass:
- no worker dispatch;
- no production worker payload execution.

### PROVIDER_GATEWAY_MODELS

Must accept:
- local SQL validation does not call providers;
- no provider secrets;
- no provider rows enabling execution;
- Lyria remains music/song/soundtrack only;
- SFX/ambient provider execution remains blocked.

Acceptance status: not_accepted_for_execution.

Required evidence:
- no-provider-call acknowledgement;
- provider secret exclusion confirmation;
- Lyria music/song/soundtrack-only boundary confirmation;
- SFX/ambient execution block confirmation.

Forbidden bypass:
- no provider call;
- no provider credential material.

### OBSERVABILITY_AUDIT_COST

Must accept:
- validation evidence capture format;
- advisor output capture expectations;
- audit/cost placeholder expectations;
- no beta/production evidence claim.

Acceptance status: not_accepted_for_execution.

Required evidence:
- validation output capture format;
- security/performance advisor capture expectations;
- audit/cost placeholder review;
- no-readiness-claim acknowledgement.

Forbidden bypass:
- no silent acceptance;
- no production readiness claim.

### BILLING_STRIPE_CREDITS

Must accept:
- no credit spend;
- no credit reservation;
- no billing rows beyond future mock/local fixture tests;
- no payment operation.

Acceptance status: not_accepted_for_execution.

Required evidence:
- no-spend acknowledgement;
- no-reservation acknowledgement;
- mock/local-only credit row boundary, if ever needed;
- no payment operation confirmation.

Forbidden bypass:
- no spend/reservation claim.

### TRACK_A_RENDER_EXPORT

Must accept:
- no final mux/export claim;
- future timing/private manifest consumption only;
- no render/export execution.

Acceptance status: not_accepted_for_execution.

Required evidence:
- no-final-export acknowledgement;
- future handoff boundary review;
- timing/private manifest consumption expectations.

Forbidden bypass:
- no final export readiness claim.

### TRACK_B_MEDIA_PROCESSING

Must accept:
- no media/audio processing execution;
- no FFmpeg/model execution;
- future processing boundary only.

Acceptance status: not_accepted_for_execution.

Required evidence:
- no-processing acknowledgement;
- no FFmpeg/model execution confirmation;
- future processing boundary review.

Forbidden bypass:
- no Track B processing execution.

## Local validation command approval checklist

- local or approved non-production target confirmed;
- production target explicitly forbidden;
- live customer data explicitly forbidden;
- draft migration path confirmed;
- draft test SQL path confirmed;
- rollback/cleanup reviewed;
- source-of-truth rule reviewed;
- raw prompt rule reviewed;
- signed URL source-of-truth blocked;
- public artifacts blocked;
- provider calls blocked;
- worker dispatch blocked;
- credit spend/reservation blocked;
- Track A export blocked;
- Track B processing blocked;
- advisor output capture plan accepted;
- DB type regeneration remains blocked until migration is actually applied in approved environment.

## Forbidden validation targets

- production Supabase;
- staging Supabase unless a later prompt explicitly approves staging;
- any database with live customer data;
- any environment with public storage;
- any environment with provider secrets;
- any environment that can dispatch workers;
- any environment that can create signed URLs;
- any environment that can spend credits;
- any environment that can publish artifacts.

## Future command examples

The following are examples only and are not executed by this packet:

- local Supabase reset in throwaway project, if approved;
- psql against local throwaway database, if approved;
- pgTAP/plain SQL tests against local fixture database, if approved;
- future npm smoke wrapping validation, if approved.

Command execution requires owner acceptance. This packet does not run commands.

## Evidence required before SUPABASE-SOUND-4

- owner acceptance recorded;
- local environment target recorded;
- no-production confirmation;
- no-live-data confirmation;
- rollback/cleanup confirmation;
- draft migration/test review complete;
- no provider/worker/GCP/credit/public-artifact path confirmed;
- command list approved;
- expected output capture plan accepted.

## Recommendation

`SUPABASE-SOUND-3B: collect owner acceptance evidence, no execution`

Owner acceptance is not ready because every owner remains not_accepted_for_execution. A later SUPABASE-SOUND-4 local validation prompt can be considered only after the required owner evidence is collected.
