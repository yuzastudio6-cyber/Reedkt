# SUPABASE-SOUND-3C Local SQL Validation Owner Approval Requests

## Status

- Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.
- Requesting workstream: SOUND_MUSIC_AUDIO.
- Current SOUND stage: dry_run_passed.
- Target future stage: generated_local_fixture_passed.
- This document is approval-request-only.
- This document does not execute SQL.
- This document does not run migrations.
- This document does not deploy migrations.
- This document does not create rows.
- This document does not create storage buckets or objects.
- This document does not create signed URLs.
- This document does not unlock generated_local_fixture_passed.
- SUPABASE-SOUND-4 remains blocked until owner approvals are complete.

SUPABASE-SOUND-3C turns the missing owner evidence from SUPABASE-SOUND-3B into owner-specific approval requests. It is not an approval record, does not collect final approvals, and does not authorize local SQL validation.

## Source-of-truth rule

```text
Supabase row
+ private GCS path
+ manifest
+ checksum
+ approved plan snapshot
```

- signed URLs are not source of truth;
- public URLs are blocked;
- public artifacts are blocked;
- source media must remain immutable;
- private path/checksum/manifest/snapshot must align before fixture execution.

## Raw prompt rule

```text
user/chat request
→ structured agent findings
→ edit intents
→ approved plan snapshot
→ worker execution
```

- raw prompt execution is blocked;
- Supabase records must not store raw prompt execution payloads for workers.

## Current go/no-go

- goForSUPABASE_SOUND_4: false.
- Reason: missing owner acceptance evidence.
- Local SQL validation cannot run yet.
- generated_local_fixture_passed cannot be claimed.

## Approval requests by owner

### SUPABASE_RLS_STORAGE_DATABASE

- owner: SUPABASE_RLS_STORAGE_DATABASE.
- currentStatus: missing approval for local SQL validation execution.
- approvalRequest:
  - approve or reject future local SQL validation in a throwaway/non-production database;
  - confirm no production target;
  - confirm no live customer data;
  - approve draft migration validation scope;
  - approve draft RLS/storage test validation scope;
  - approve rollback/cleanup expectations;
  - approve no signed URL source-of-truth;
  - approve no public artifact path.
- evidenceNeeded:
  - target environment proof;
  - no-production confirmation;
  - no-live-data confirmation;
  - rollback/cleanup approval;
  - command approval.
- forbiddenBypasses:
  - no SQL validation without owner approval;
  - no production target;
  - no live data.
- requestedResponseFormat:
  - approval decision: approved or rejected;
  - target environment statement;
  - no-production/no-live-data statement;
  - command approval statement;
  - rollback/cleanup decision;
  - conditions or blockers.
- nextOwnerPrompt: SUPABASE-SOUND-3D: Supabase owner approval decision for local SQL validation, no execution.

### SOUND_MUSIC_AUDIO

- owner: SOUND_MUSIC_AUDIO.
- currentStatus: planning accepted, execution not accepted.
- approvalRequest:
  - confirm fixture spec requirements are complete for local SQL validation;
  - confirm approved snapshot/timing/private manifest requirements;
  - confirm no provider/worker/artifact execution.
- evidenceNeeded:
  - SOUND acceptance of fixture spec scope;
  - no generated_local_fixture_passed claim.
- forbiddenBypasses:
  - no artifact creation from SOUND;
  - no execution claim.
- requestedResponseFormat:
  - scope acceptance decision;
  - fixture requirement gaps, if any;
  - no-execution acknowledgement;
  - conditions or blockers.
- nextOwnerPrompt: SOUND-SUPABASE-ACCEPT-0: approve local SQL validation scope for SOUND fixture records, no execution.

### WORKER_RUNTIME_JOBS

- owner: WORKER_RUNTIME_JOBS.
- currentStatus: missing acceptance.
- approvalRequest:
  - confirm local SQL validation does not dispatch workers;
  - confirm no worker payload execution;
  - confirm raw prompt worker execution remains blocked;
  - confirm idempotency/approved snapshot expectations.
- evidenceNeeded:
  - Worker Runtime acceptance of no-dispatch validation.
- forbiddenBypasses:
  - no worker dispatch;
  - no ProductionWorkerJobPayload execution.
- requestedResponseFormat:
  - no-dispatch acceptance decision;
  - worker payload boundary statement;
  - raw prompt rejection statement;
  - idempotency expectation notes;
  - conditions or blockers.
- nextOwnerPrompt: WORKER-RUNTIME-SOUND-0: audio fixture payload acceptance audit.

### PROVIDER_GATEWAY_MODELS

- owner: PROVIDER_GATEWAY_MODELS.
- currentStatus: missing acceptance.
- approvalRequest:
  - confirm local SQL validation does not call providers;
  - confirm no provider secrets;
  - confirm no provider rows enable execution;
  - confirm Lyria music/song/soundtrack-only boundary;
  - confirm SFX/ambient provider execution remains blocked.
- evidenceNeeded:
  - Provider Gateway acceptance of no-provider validation.
- forbiddenBypasses:
  - no provider call;
  - no provider secret values.
- requestedResponseFormat:
  - no-provider acceptance decision;
  - credential exclusion statement;
  - provider row execution block statement;
  - Lyria boundary statement;
  - conditions or blockers.
- nextOwnerPrompt: PROVIDER-GATEWAY-SOUND-0: provider/license fixture boundary audit.

### OBSERVABILITY_AUDIT_COST

- owner: OBSERVABILITY_AUDIT_COST.
- currentStatus: missing acceptance.
- approvalRequest:
  - confirm validation evidence capture expectations;
  - confirm advisor output capture expectations;
  - confirm audit/cost placeholder expectations;
  - confirm no beta/production evidence claim.
- evidenceNeeded:
  - Observability acceptance of evidence capture format.
- forbiddenBypasses:
  - no silent acceptance;
  - no readiness claim without audit evidence.
- requestedResponseFormat:
  - evidence capture acceptance decision;
  - advisor output requirements;
  - audit/cost placeholder requirements;
  - readiness claim rejection statement;
  - conditions or blockers.
- nextOwnerPrompt: OBSERVABILITY-SOUND-0: QA/audit/cost fixture evidence audit.

### BILLING_STRIPE_CREDITS

- owner: BILLING_STRIPE_CREDITS.
- currentStatus: missing acceptance.
- approvalRequest:
  - confirm no credit spend;
  - confirm no credit reservation;
  - confirm no billing rows beyond future mock/local fixture tests;
  - confirm no payment operation.
- evidenceNeeded:
  - Billing acceptance of no-spend validation.
- forbiddenBypasses:
  - no spend;
  - no reservation.
- requestedResponseFormat:
  - no-spend acceptance decision;
  - no-reservation statement;
  - billing row boundary statement;
  - payment operation rejection statement;
  - conditions or blockers.
- nextOwnerPrompt: BILLING-SOUND-0: fixture credit placeholder acceptance audit.

### TRACK_A_RENDER_EXPORT

- owner: TRACK_A_RENDER_EXPORT.
- currentStatus: missing acceptance.
- approvalRequest:
  - confirm no final mux/export claim;
  - confirm future timing/private manifest consumption remains handoff-only;
  - confirm no render/export execution.
- evidenceNeeded:
  - Track A acceptance of no-export local SQL validation.
- forbiddenBypasses:
  - no final export readiness claim.
- requestedResponseFormat:
  - no-export acceptance decision;
  - final composition boundary statement;
  - timing/private manifest handoff notes;
  - conditions or blockers.
- nextOwnerPrompt: TRACK-A-SOUND-0: audio fixture final composition handoff audit.

### TRACK_B_MEDIA_PROCESSING

- owner: TRACK_B_MEDIA_PROCESSING.
- currentStatus: missing acceptance.
- approvalRequest:
  - confirm no media/audio processing execution;
  - confirm no FFmpeg/model execution;
  - confirm future processing boundary remains handoff-only.
- evidenceNeeded:
  - Track B acceptance of no-processing local SQL validation.
- forbiddenBypasses:
  - no Track B processing execution.
- requestedResponseFormat:
  - no-processing acceptance decision;
  - FFmpeg/model execution rejection statement;
  - future processing handoff boundary;
  - conditions or blockers.
- nextOwnerPrompt: TRACK-B-SOUND-0: audio fixture media processing handoff audit.

## Aggregate missing evidence

- Supabase local target approval;
- Supabase no-production/no-live-data proof;
- Supabase rollback/cleanup approval;
- Worker Runtime no-dispatch acceptance;
- Provider Gateway no-provider acceptance;
- Observability evidence-capture acceptance;
- Billing no-spend acceptance;
- Track A no-export acceptance;
- Track B no-processing acceptance;
- SOUND scope acceptance for local SQL validation.

## SUPABASE-SOUND-4 status

- SUPABASE-SOUND-4 is blocked.
- Reason: owner approvals are incomplete.
- Do not run local SQL validation yet.

## Recommendation

`SUPABASE-SOUND-3D: Supabase owner approval decision for local SQL validation, no execution`

This is the only recommended next prompt because the Supabase owner must first approve or reject the future local SQL validation target, command scope, no-production/no-live-data proof, and rollback/cleanup expectations.
