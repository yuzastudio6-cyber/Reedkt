# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Approved-Fixture Inference Plan

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_inference_plan_recorded_approval_required`.

This packet plans one future controlled Qwen approved-fixture inference through the persisted worker dispatch path. It is a planning packet only. It does not approve inference now, import or load Qwen, initialize vLLM, process a prompt, run a forward pass, invoke Cloud Run, dispatch a worker, create a real job, claim a lease, mutate Supabase, execute SQL, create generated assets, create storage objects, create signed URLs, create public artifacts, spend credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

The upstream controlled real-dispatch transport attempt result review is accepted. That evidence proves fail-closed private transport reachability, runtime-scope token/header redaction, non-persistence of service target and audience, and response classification only. It does not prove Qwen inference readiness. This plan defines what must be approved before a later preflight can prepare one bounded approved-fixture inference attempt.

## Upstream Evidence

- transport attempt result review: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-result-review.md`
- transport attempt result review spec: `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-result-review.ts`
- transport attempt result review smoke: `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-result-review-smoke.ts`
- approved plan snapshot policy: `approved-plan-snapshot-policy.md`
- editing agent execution architecture: `editing-agent-execution-architecture.md`
- model routing policy: `model-routing-policy.md`
- intent-led edit planning: `intent-led-edit-planning.md`

## Plan Scope

- transport attempt result review accepted: true
- approved-fixture inference plan recorded: true
- approved-fixture inference approval required: true
- inference approval now: false
- model import now: false
- model load now: false
- vLLM initialization now: false
- Cloud Run invocation now: false
- worker dispatch now: false
- result persistence now: false
- generated asset creation now: false
- storage object creation now: false
- signed URL creation now: false
- credit spend now: false

## Selected Runtime

- platform: `google_cloud_run_gpu`
- selected GPU: `nvidia_l4`
- region: `us-central1`
- service: `reeditpro-qwen2-5-vl-l4-worker`
- cost posture: `scale_to_zero_required`
- minimum instances: 0
- initial max instances: 1
- CPU fallback allowed: false

NVIDIA L4 remains the selected cost-friendly GPU for Qwen2.5-VL 7B because the current stack already uses a Cloud Run GPU service with scale-to-zero, minimum instances zero, initial max instances one, and CPU fallback disabled. This plan does not resize, deploy, or mutate the service.

## Planned Approval Areas

### Approved Snapshot And Fixture Scope

- approved plan snapshot id, immutable plan version, structured findings, edit intents, and timing refs are required
- approved fixture must be bounded to Qwen visual understanding and visual QA metadata only
- raw chat, raw prompt, raw worker prompt, and arbitrary user media execution are rejected
- current execution allowed: false

### Persisted Worker Dispatch Refs

- persisted job id, lease id, idempotency key, worker runtime config ref, and backend runtime message ref are required
- single approved fixture dispatch scope, duplicate-source guard, and stale-lease cleanup are required
- worker dispatch remains blocked until later approval, preflight, and attempt gates
- current execution allowed: false

### Private Source-Of-Truth Refs

- private source refs, storage object records, manifest refs, checksum refs, and approved snapshot refs are required
- signed URLs and public URLs remain non-source-of-truth
- storage writes and Supabase mutation remain blocked by this plan
- current execution allowed: false

### Qwen Request Envelope

- bounded visual metadata request shape for `qwen_fixture_visual_metadata_v1` is required
- private frame refs and visual QA task refs are used instead of raw prompt execution
- Qwen may not generate B-roll video, render, export, or create generated assets
- current execution allowed: false

### Private Invoke Transport Dependencies

- service target and audience resolution stay backend-only and non-persisted
- identity token fetch and auth-header creation stay runtime-scoped and redacted
- private request send remains blocked until later approval and preflight repeat the checks
- current execution allowed: false

### Qwen Runtime Inference Boundary

- a future attempt may enable one approved-fixture inference only after explicit approval
- model import, model load, vLLM initialization, prompt processing, and forward pass remain blocked now
- result must be metadata-only and must not create generated video, generated images, or final media
- current execution allowed: false

### Response Schema And Result Handling

- response classifier must distinguish disabled inference, runtime errors, invalid schema, and accepted metadata-only result
- raw model output is excluded from repo docs, logs, UI payloads, and persisted rows
- accepted metadata still requires separate result review before any persistence or runtime readiness claim
- current execution allowed: false

### QA, Audit, Cost, And Credit No-Spend

- sanitized QA, audit, and cost evidence refs are planned for the future attempt
- cost posture records scale-to-zero and one bounded approved fixture request only
- credit estimate, reservation spend, release, refund, and Stripe operations remain blocked
- current execution allowed: false

### Cleanup, Retry, And Beta Lock

- timeout, retry, idempotency, and cleanup expectations are defined before any inference attempt
- cleanup cannot delete approved snapshot or private source-of-truth refs
- beta, production, public artifacts, signed URLs, and `generated_local_fixture_passed` remain blocked
- current execution allowed: false

## Future Attempt Boundaries

- max approved fixture requests: 1
- arbitrary user media allowed: false
- raw chat worker execution allowed: false
- raw worker prompt allowed: false
- Qwen may generate B-roll video: false
- Qwen may create generated assets: false
- Qwen may render or export: false
- signed URLs as source of truth allowed: false
- public URLs as source of truth allowed: false
- approval required before preflight: true
- preflight required before attempt: true
- result review required after attempt: true

## Source-Of-Truth Rules

- Workers execute approved snapshots, not raw chat.
- Private storage, manifest, checksum, and approved snapshot refs are required for source-of-truth paths.
- Signed URLs and public URLs are not source of truth.
- Frontend code may not resolve private invoke credentials.
- Frontend code may not call Cloud Run.
- Frontend code may not create generated assets.
- Qwen remains visual understanding and visual QA metadata only.

## Runtime Flags

- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptResultReviewAccepted=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePlanRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePlanRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceApprovalRequired=true`
- `approvedSnapshotAndFixtureScopePlanned=true`
- `persistedWorkerDispatchRefsPlanned=true`
- `privateSourceOfTruthRefsPlanned=true`
- `qwenRequestEnvelopePlanned=true`
- `privateInvokeTransportDependenciesPlanned=true`
- `qwenRuntimeInferenceBoundaryPlanned=true`
- `responseSchemaAndResultHandlingPlanned=true`
- `qaAuditCostAndCreditNoSpendPlanned=true`
- `cleanupRetryAndBetaLockPlanned=true`
- `selectedGpuL4Accepted=true`
- `scaleToZeroCostPostureAccepted=true`
- `minInstancesZeroAccepted=true`
- `initialMaxInstancesOneAccepted=true`
- `cpuFallbackDisabledAccepted=true`
- `readyForRealWorkerDispatch=false`
- `approvedFixtureInferenceAcceptedForPersistedDispatch=false`
- `approvedFixtureInferenceApprovedNow=false`
- `realJobCreated=false`
- `realLeaseClaimed=false`
- `idempotencyRowCreated=false`
- `jobEventCreated=false`
- `backendRuntimeMessageCreated=false`
- `workerClaimCreated=false`
- `storageObjectRecordCreated=false`
- `signedUrlEventCreated=false`
- `qaReportCreated=false`
- `auditEventCreated=false`
- `creditMutationCreated=false`
- `cloudRunInvocationAttempted=false`
- `serviceRuntimeRequestSent=false`
- `serviceUrlResolvedNow=false`
- `audienceResolvedNow=false`
- `identityTokenFetched=false`
- `authHeaderCreated=false`
- `privateRequestSendAllowedNow=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `vllmEngineInitialized=false`
- `promptProcessed=false`
- `forwardPassRun=false`
- `inferenceRun=false`
- `providerCallsMade=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `mediaProcessingRun=false`
- `renderExportRun=false`
- `betaReady=false`
- `productionReady=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## What Went Wrong Previously

Earlier Qwen runtime work proved transport reachability only after the service returned the expected inference-disabled fail-closed response. That was useful but not the same as an approved fixture inference. The better next step is to define the exact approved snapshot, persisted dispatch refs, private source-of-truth refs, Qwen metadata envelope, runtime boundary, QA/audit/cost, and cleanup rules before asking for approval to run a single bounded fixture inference.

## Required Next Step

The next action is approval of this plan. Approval may authorize a later no-side-effect preflight for one controlled Qwen approved-fixture inference through persisted worker dispatch, but it must not itself run inference or create generated assets.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58CY-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVED-FIXTURE-INFERENCE-APPROVAL: approve one controlled Qwen approved-fixture inference through persisted worker dispatch, no generated assets/no beta`
