# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Approved-Fixture Private Inference Plan

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_inference_plan_recorded_approval_required`.

This packet plans one future bounded approved-fixture private Qwen inference attempt through the persisted job and lease bridge. It is a planning packet only. It does not approve inference now, import Qwen, load Qwen, initialize vLLM, process prompts, run a forward pass, invoke Cloud Run, dispatch a worker, create or mutate persisted job rows, claim a real lease, create idempotency rows, create job events, create backend runtime messages, create worker claims, mutate Supabase, execute SQL, write storage objects, create signed URLs, create public artifacts, create generated assets, process media, render/export, spend credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

The upstream 58DL result review accepted the bounded 58DK private invoke attempt as fail-closed private service contract evidence only. That evidence proves the private contract path, persisted dispatch reference envelope, runtime-scoped identity token and auth-header handling, redaction boundaries, and disabled-inference response classification. It does not prove private Qwen inference readiness. This plan defines the exact approval areas and safety envelope required before a later approval gate may authorize a static preflight for one bounded private inference attempt.

## Upstream Evidence

- private invoke attempt result review: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-result-review.md`
- private invoke attempt result review spec: `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-result-review.ts`
- private invoke attempt result review smoke: `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-result-review-smoke.ts`
- private invoke attempt result: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-attempt-result.md`
- persisted job/lease bridge result review: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-result-review.md`
- approved plan snapshot policy: `approved-plan-snapshot-policy.md`
- worker execution architecture: `editing-agent-execution-architecture.md`
- model routing policy: `model-routing-policy.md`
- intent-led edit planning: `intent-led-edit-planning.md`

## Plan Scope

- private invoke attempt result review accepted: true
- private contract reachability accepted for future inference planning: true
- approved-fixture private inference plan recorded: true
- approved-fixture private inference approval required: true
- ready for approved-fixture private inference approval: true
- Qwen inference approved now: false
- model import now: false
- model load now: false
- vLLM initialization now: false
- prompt processing now: false
- forward pass now: false
- Cloud Run invocation now: false
- worker dispatch now: false
- result persistence now: false
- generated asset creation now: false
- storage object creation now: false
- signed URL creation now: false
- public artifact creation now: false
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

NVIDIA L4 remains the selected run-on-use GPU because it is already the Qwen2.5-VL 7B Cloud Run GPU target, supports bounded visual-analysis requests, keeps minimum instances at 0, and preserves the current scale-to-zero cost posture. This plan does not resize, deploy, warm, invoke, or mutate the service.

## Planned Approval Areas

### Approved Snapshot And Fixture Scope

- exact approved fixture id, approved plan snapshot id, immutable plan version, checksum, structured findings, edit intents, source-order refs, timing refs, and worker graph are required
- approved fixture scope is Qwen visual understanding and visual QA metadata only
- arbitrary user media execution, raw chat execution, raw worker prompt execution, and browser-facing runtime execution are rejected
- current execution allowed: false

### Persisted Job, Lease, And Idempotency Refs

- one persisted Qwen worker job ref, one lease ref, one worker claim ref, one backend runtime message ref, one job event ref, and one idempotency key are required
- duplicate-source rejection, request hash matching, stale-lease cleanup, and retry-safe conflict handling are required
- no real job row, lease claim, idempotency row, event row, runtime message, or worker claim is created by this plan
- current execution allowed: false

### Private Source-Of-Truth Refs

- private source refs, storage object records, artifact manifest refs, checksum refs, approved snapshot refs, and source media immutability refs are required
- signed URLs and public URLs remain non-source-of-truth
- storage writes, generated assets, public artifacts, Supabase mutation, and SQL remain blocked by this plan
- current execution allowed: false

### Qwen Private Inference Request Envelope

- future request shape is limited to `qwen_fixture_visual_metadata_v1`
- request uses approved snapshot refs, private frame refs, visual QA task refs, manifest refs, checksum refs, and persisted dispatch refs
- request rejects raw prompts, raw provider prompts, raw worker prompts, arbitrary media, public URLs, signed URLs, and generated-asset creation
- current execution allowed: false

### Private Invoke Transport And Credential Handling

- service target and audience resolution remain backend/runtime-only and non-persisted
- identity token fetch and auth-header creation remain runtime-scoped, redacted, and excluded from docs, logs, UI payloads, and repo data
- private request sending remains blocked until later approval and preflight repeat these checks
- current execution allowed: false

### Model Runtime Boundary

- future approval may permit one bounded import, model load, vLLM initialization, prompt processing, forward pass, and inference path for the approved fixture only
- this plan does not run import, load, vLLM, prompt processing, forward pass, or inference
- CPU fallback remains disabled and the attempt remains bounded to one approved fixture request
- current execution allowed: false

### Metadata-Only Response Contract

- response parser must accept only `qwen_fixture_visual_metadata_v1` metadata
- expected response must include schema version, object rows, text-like regions, spatial relations, blocked-action evidence, normalized metadata hash, and raw-output exclusion evidence
- raw model output must not be stored in docs, logs, UI payloads, Supabase rows, storage objects, generated assets, or public artifacts
- current execution allowed: false

### QA, Audit, Cost, And Credit No-Spend

- future attempt must produce sanitized QA, audit, timing, latency, model-runtime, cleanup, and internal cost evidence refs
- cost evidence is a no-spend internal placeholder only
- credit estimates, approvals, reservations, spends, releases, refunds, Stripe operations, and payment objects remain blocked
- current execution allowed: false

### Cleanup, Retry, Rollback, And Review

- timeout, retry budget, stale lease cleanup, duplicate-source rollback, invalid-schema rollback, disabled-inference handling, service-failure handling, cleanup-failure reporting, and result-review requirements are defined before any attempt
- cleanup cannot delete approved snapshot, private source-of-truth refs, manifests, checksums, or audit evidence
- result review is required before any future readiness or persistence claim can advance
- current execution allowed: false

## Future Attempt Boundaries

- max approved fixture private inference attempts: 1
- arbitrary user media allowed: false
- raw chat worker execution allowed: false
- raw worker prompt allowed: false
- raw provider prompt allowed: false
- raw model output persisted: false
- frontend invocation allowed: false
- service target persisted: false
- audience persisted: false
- identity token persisted: false
- auth header persisted: false
- signed URLs as source of truth allowed: false
- public URLs as source of truth allowed: false
- generated assets allowed: false
- final render/export allowed: false
- credit spend allowed: false
- approval required before preflight: true
- preflight required before attempt: true
- result review required after attempt: true

## Source-Of-Truth Rules

Workers execute approved snapshots, not raw chat.

Workers execute approved snapshots, not raw chat:

```text
approved plan snapshot
-> persisted worker job
-> persisted idempotency guard
-> transactional lease claim
-> sanitized job event
-> backend runtime message
-> worker claim
-> private invoke handoff
-> Qwen metadata result review
```

The plan preserves these rules:

- structured findings and edit intents must feed approved snapshots before worker execution
- private storage object records, manifests, checksums, and approved snapshot refs are source-of-truth inputs
- signed URLs and public URLs are not source of truth
- frontend code must not claim jobs, resolve private invoke credentials, call Cloud Run, or create generated assets
- Qwen remains visual understanding and visual QA metadata only
- Qwen must not generate B-roll video, render, export, replace deterministic OCR, or publish artifacts

## Runtime Flags

- `approvedFixturePrivateInvokeAttemptResultReviewAccepted=true`
- `approvedFixturePrivateInferencePlanRequired=false`
- `approvedFixturePrivateInferencePlanRecorded=true`
- `approvedFixturePrivateInferenceApprovalRequired=true`
- `approvedFixturePrivateInferenceApprovalRecorded=false`
- `readyForApprovedFixturePrivateInferenceApproval=true`
- `approvedSnapshotAndFixtureScopePlanned=true`
- `persistedJobLeaseAndIdempotencyRefsPlanned=true`
- `privateSourceOfTruthRefsPlanned=true`
- `qwenPrivateInferenceRequestEnvelopePlanned=true`
- `privateInvokeTransportAndCredentialHandlingPlanned=true`
- `modelRuntimeBoundaryPlanned=true`
- `metadataOnlyResponseContractPlanned=true`
- `qaAuditCostCreditNoSpendPlanned=true`
- `cleanupRetryRollbackReviewPlanned=true`
- `selectedGpuL4Accepted=true`
- `scaleToZeroCostPostureAccepted=true`
- `minInstancesZeroAccepted=true`
- `initialMaxInstancesOneAccepted=true`
- `cpuFallbackDisabledAccepted=true`
- `readyForRealWorkerDispatch=false`
- `privateInvokeReady=false`
- `approvedFixturePrivateInferenceApprovedNow=false`
- `qwenInferenceAcceptedNow=false`
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
- `serviceTargetResolvedNow=false`
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

## What This Advances

The 58DL review accepted that the private contract path is reachable and fail-closed with inference disabled. This 58DM plan advances the chain by defining the exact bounded private inference envelope that a future approval may consider: approved snapshot scope, persisted job/lease/idempotency refs, private source-of-truth refs, request envelope, runtime boundary, response contract, QA/audit/cost/no-spend evidence, cleanup, retry, rollback, and review requirements. It does not run the inference attempt.

## Remaining Blockers

- approved-fixture private inference approval required: true
- approved-fixture private inference approval recorded: false
- ready for real worker dispatch: false
- private invoke ready: false
- Qwen inference accepted now: false
- generated asset creation accepted: false
- Supabase persistence accepted: false
- credit spend accepted: false
- beta ready: false
- production ready: false

## Required Next Step

The next action is approval of this private inference plan. Approval may authorize a later no-execution preflight for one controlled private Qwen inference attempt through the persisted job and lease bridge, but it must not itself run inference, invoke Cloud Run, dispatch a worker, create generated assets, mutate Supabase, create signed URLs, spend credits, unlock beta, unlock production, or claim `generated_local_fixture_passed`.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58DN-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVED-FIXTURE-PRIVATE-INFERENCE-APPROVAL: approve one bounded approved-fixture private Qwen inference plan through the persisted job and lease bridge, no inference/no generated assets/no beta`
