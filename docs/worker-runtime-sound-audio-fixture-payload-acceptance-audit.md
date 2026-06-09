# WORKER-RUNTIME-SOUND-0 Audio Fixture Payload Acceptance Audit

## Status

- Workstream owner: WORKER_RUNTIME_JOBS.
- Requesting workstream: SOUND_MUSIC_AUDIO.
- Related source workstream: SUPABASE_RLS_STORAGE_DATABASE.
- Current SOUND stage: dry_run_passed.
- Target future stage: generated_local_fixture_passed.
- This document is audit-only.
- This document does not dispatch workers.
- This document does not create jobs.
- This document does not create job events.
- This document does not create worker runtime configs.
- This document does not execute claim/lease flow.
- This document does not execute Cloud Run, Docker, FFmpeg, providers, model inference, media processing, or GCP commands.
- This document does not mutate Supabase.
- This document does not execute SQL.
- This document does not create rows, storage buckets, storage objects, signed URLs, public artifacts, generated assets, credits, or approvals.
- This document does not unlock generated_local_fixture_passed.
- SUPABASE-SOUND-4 remains globally blocked until cross-owner approvals are complete.

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
- worker payloads must reference source-of-truth records, not signed URLs.

## Raw prompt rule

```text
user/chat request
→ structured agent findings
→ edit intents
→ approved plan snapshot
→ worker execution
```

- raw prompt execution is blocked;
- worker payloads must never be raw chat prompts;
- worker payloads must reference approved snapshots, structured findings, edit intents, timing manifests, private artifact manifests, idempotency metadata, and private source-of-truth records.

## Worker Runtime decision summary

- workerRuntimeDecision: conditional_worker_runtime_acceptance_for_future_payload_shape_validation.
- workerRuntimeAllowsFuturePayloadShapeValidation: true.
- workerRuntimeAllowsDispatch: false.
- globalGoForSUPABASE_SOUND_4: false.
- Reason global go is blocked: Provider Gateway, Observability, Billing, Track A, Track B, and SOUND scope acceptance remain incomplete for the local fixture path.

WORKER_RUNTIME_JOBS conditionally accepts future payload-shape validation only. This acceptance does not approve job creation, job events, worker runtime config creation, claim/lease execution, worker dispatch, Cloud Run, Docker, FFmpeg, provider calls, storage writes, generated assets, public artifacts, signed URLs, credit rows, approval records, Track A export, Track B processing, or generated_local_fixture_passed.

## Accepted by Worker Runtime

- future payload-shape validation only;
- no worker dispatch;
- no job creation;
- no job event creation;
- no runtime config creation;
- no claim/lease execution;
- approvedPlanSnapshotId required;
- idempotencyKey required;
- timingAwareCueManifestId required;
- privateAudioArtifactManifestId required;
- fixtureSpecId required;
- rawPromptExecutionAllowed=false;
- signedUrlInputAllowed=false;
- serviceRoleKeyAllowed=false;
- providerSecretAllowed=false;
- publicArtifactUrlAllowed=false;
- generatedAssetCreationAllowed=false;
- providerCallAllowed=false;
- Supabase mutation not performed by Worker Runtime in this phase.

## Rejected / still blocked by Worker Runtime

- production worker dispatch;
- local worker dispatch;
- Cloud Run execution;
- Docker execution;
- FFmpeg/media execution;
- provider calls;
- job row creation;
- job_event row creation;
- worker_runtime_configs creation;
- claim/lease execution;
- raw prompt worker execution;
- signed URL worker inputs;
- service-role keys in payloads;
- provider secrets in payloads;
- public artifact URLs in payloads;
- generated_local_fixture_passed claim.

## Future payload shape expectation

```json
{
  "workstream": "SOUND_MUSIC_AUDIO",
  "mode": "audio_fixture_payload_shape_validation_only",
  "dryRunRequestId": "mock-reference-only-dry-run-request-id",
  "jobIntentId": "mock-reference-only-job-intent-id",
  "approvedPlanSnapshotId": "required",
  "timingAwareCueManifestId": "required",
  "privateAudioArtifactManifestId": "required",
  "fixtureSpecId": "required",
  "idempotencyKey": "required",
  "providerPolicyRef": "required",
  "runtimeTarget": "mock_or_local_validation_only",
  "expectedArtifactKinds": [],
  "qaEvidenceRefs": [],
  "mayDispatchWorker": false,
  "mayCreateJob": false,
  "mayCreateJobEvent": false,
  "mayCallProvider": false,
  "mayMutateSupabase": false,
  "mayCreateGeneratedAsset": false,
  "signedUrlInputAllowed": false,
  "rawPromptExecutionAllowed": false,
  "serviceRoleKeyAllowed": false,
  "providerSecretAllowed": false,
  "publicArtifactUrlAllowed": false
}
```

This payload is an expectation only. This prompt does not create it for execution. Any future payload validator must be local, no-dispatch, no-mutation, and no-runtime-execution.

## Required before WORKER-RUNTIME-SOUND-1

- approved payload-shape spec;
- no-dispatch smoke;
- no raw prompt test;
- no signed URL input test;
- no secret/service-role/provider-key test;
- idempotency key test;
- approved snapshot reference test;
- timing/private manifest reference test;
- no job/job_event creation test;
- no runtime config mutation test;
- cross-owner acceptance status.

## Cross-owner status after Worker Runtime decision

### WORKER_RUNTIME_JOBS

- owner: WORKER_RUNTIME_JOBS.
- status: accepted_conditionally.
- evidence:
  - existing Worker Runtime gates require worker payload shape and idempotency;
  - existing Worker Runtime gates reject raw chat execution;
  - existing production worker gates require approved snapshot and idempotency;
  - existing production worker artifact policy rejects signed URLs/raw URLs and forbidden secret-like keys;
  - this audit records future payload-shape validation only.
- missingEvidence:
  - future no-dispatch payload validator smoke;
  - future exact payload schema review.

### SUPABASE_RLS_STORAGE_DATABASE

- owner: SUPABASE_RLS_STORAGE_DATABASE.
- status: accepted_conditionally.
- evidence:
  - SUPABASE-SOUND-3D conditionally accepts future local/throwaway/non-production SQL validation only.
- missingEvidence:
  - future local target name;
  - future command approval;
  - future rollback/cleanup confirmation.

### SOUND_MUSIC_AUDIO

- owner: SOUND_MUSIC_AUDIO.
- status: missing.
- evidence:
  - SOUND dry-run contract, generated/local fixture spec, fixture handoff packet, and owner checklist exist.
- missingEvidence:
  - explicit SOUND acceptance that local payload-shape validation remains metadata-only;
  - explicit no generated_local_fixture_passed claim acknowledgement for future payload validation.

### PROVIDER_GATEWAY_MODELS

- owner: PROVIDER_GATEWAY_MODELS.
- status: missing.
- evidence:
  - planning docs state provider calls and provider credentials are blocked.
- missingEvidence:
  - explicit no-provider-call acceptance;
  - provider/license fixture boundary acceptance;
  - Lyria music/song/soundtrack-only confirmation.

### OBSERVABILITY_AUDIT_COST

- owner: OBSERVABILITY_AUDIT_COST.
- status: missing.
- evidence:
  - planning docs include local text output and evidence-capture expectations.
- missingEvidence:
  - explicit evidence capture acceptance;
  - audit/cost placeholder acceptance.

### BILLING_STRIPE_CREDITS

- owner: BILLING_STRIPE_CREDITS.
- status: missing.
- evidence:
  - planning docs state no credit spend, reservation, refund, release, or payment operation.
- missingEvidence:
  - explicit no-spend local validation acceptance;
  - credit placeholder boundary acceptance.

### TRACK_A_RENDER_EXPORT

- owner: TRACK_A_RENDER_EXPORT.
- status: missing.
- evidence:
  - planning docs state Track A final export remains blocked.
- missingEvidence:
  - explicit no-export acceptance;
  - timing/private manifest handoff boundary acceptance.

### TRACK_B_MEDIA_PROCESSING

- owner: TRACK_B_MEDIA_PROCESSING.
- status: missing.
- evidence:
  - planning docs state Track B media/audio processing remains blocked.
- missingEvidence:
  - explicit no-processing acceptance;
  - FFmpeg/model execution rejection acknowledgement.

## Go / no-go for SUPABASE-SOUND-4

- globalGoForSUPABASE_SOUND_4: false.
- Worker Runtime conditional acceptance is present for future payload-shape validation only.
- Supabase owner conditional acceptance exists for future local SQL validation only.
- Provider Gateway acceptance remains missing.
- Observability acceptance remains missing.
- Billing acceptance remains missing.
- Track A acceptance remains missing.
- Track B acceptance remains missing.
- SOUND scope acceptance remains required.
- Local SQL validation must not run yet.
- Worker dispatch must not run.
- generated_local_fixture_passed cannot be claimed.

## Runtime/provider/gate behavior

- provider calls: false.
- worker dispatch: false.
- job creation: false.
- job event creation: false.
- runtime config creation: false.
- claim/lease execution: false.
- Supabase mutation: false.
- SQL execution: false.
- migration deploy: false.
- storage bucket creation: false.
- storage object creation: false.
- signed URL creation: false.
- generated asset creation: false.
- credit rows: false.
- feature gate changes: false.
- tool capability seeding: false.
- worker runtime config seeding: false.

## Supabase update classification

- Supabase update required: no.
- Supabase update status: Worker Runtime audit only; no SQL; no mutation.
- Supabase environment touched: no.
- SQL executed: no.
- Migration deployed: no.
- Evidence docs: Supabase owner decision, SUPABASE-SOUND plan/draft/validation packets, SOUND generated/local fixture packets, and this Worker Runtime acceptance audit.
- Blockers: no approved snapshot rows, no worker runtime config rows, no storage bucket/object records, no generated assets, no jobs, no credit rows, no complete runtime owner acceptance for execution.
- Next Supabase action: none in this prompt.

## Recommendation

`PROVIDER-GATEWAY-SOUND-0: provider/license fixture boundary audit`

This is the only recommended next prompt because Worker Runtime conditional payload-shape acceptance is now recorded, while Provider Gateway still must accept the no-provider-call, no-credential, Lyria-boundary, and provider/license fixture boundaries before SUPABASE-SOUND-4 can be reconsidered.
