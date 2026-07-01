# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Approved-Fixture Private Inference Retry Plan

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_inference_retry_plan_recorded_gate_required`.

This packet records the 58DR bounded approved-fixture private inference retry plan after the auth-refresh result. It is a planning packet only. It does not run the retry gate, execute the private caller job, fetch a service identity token, create an auth header, invoke Cloud Run, send a private request, import Qwen, load Qwen, initialize vLLM, process prompts, run a forward pass, run inference, create generated assets, create signed URLs, publish artifacts, mutate Supabase, execute SQL, write storage, spend credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

The upstream 58DQ auth-refresh result proves that this shell can refresh gcloud auth non-interactively and can read the expected Cloud Run service and private caller job through read-only describe probes. It does not prove private inference readiness. This retry plan defines the next gate and source-of-truth envelope before any future approved-fixture private inference retry attempt can be considered.

## Upstream Evidence

- private inference auth-refresh result: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-auth-refresh-result.md`
- private inference auth-refresh result spec: `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-auth-refresh-result.ts`
- private inference auth-refresh result smoke: `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-auth-refresh-result-smoke.ts`
- private inference attempt result: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-attempt-result.md`
- approved-fixture private inference plan: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-plan.md`
- approved-fixture private inference approval: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-approval.md`
- approved-fixture private inference preflight: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-preflight.md`
- approved-fixture private inference attempt approval: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-attempt-approval.md`
- approved plan snapshot policy: `approved-plan-snapshot-policy.md`
- worker execution architecture: `editing-agent-execution-architecture.md`
- model routing policy: `model-routing-policy.md`
- intent-led edit planning: `intent-led-edit-planning.md`

## Auth Refresh Evidence

- access token refresh passed: true
- Cloud Run service describe passed: true
- Cloud Run caller job describe passed: true
- auth blocker: `cleared`
- token value printed: false
- token value stored: false
- raw gcloud output stored: false

## Retry Plan Scope

- auth refresh verified: true
- approved-fixture private inference retry plan recorded: true
- approved-fixture private inference retry gate required: true
- ready for approved-fixture private inference retry gate: true
- retry gate now: false
- service identity token fetch now: false
- auth header creation now: false
- caller job execution now: false
- Cloud Run invocation now: false
- private request send now: false
- model import now: false
- model load now: false
- vLLM initialization now: false
- prompt processing now: false
- forward pass now: false
- inference now: false
- result persistence now: false
- generated asset creation now: false
- signed URL creation now: false
- public artifact creation now: false
- credit spend now: false

## Selected Runtime

- platform: `google_cloud_run_gpu`
- selected GPU: `nvidia_l4`
- region: `us-central1`
- service: `reeditpro-qwen2-5-vl-l4-worker`
- caller job: `reeditpro-qwen2-5-vl-private-caller`
- cost posture: `scale_to_zero_required`
- minimum instances: 0
- initial max instances: 1
- CPU fallback allowed: false

NVIDIA L4 remains the selected run-on-use GPU target for Qwen2.5-VL 7B. The service must keep minimum instances at 0 so the GPU is not left running when unused. This packet does not resize, deploy, warm, invoke, or mutate the service.

## Retry Gate Areas

### Auth-Refreshed Gate Recheck

- repeat read-only gcloud auth refresh, Cloud Run service describe, and private caller job describe immediately before any future retry gate
- confirm the private inference auth-refresh result remains current and token values remain suppressed
- stop before identity-token fetch, auth-header creation, caller job execution, private request, model load, and inference
- current execution allowed: false

### Approved Snapshot And Fixture Lock

- one approved fixture id, approved plan snapshot id, immutable plan version, source-order refs, structured findings, edit intents, timing refs, and checksum refs are required
- fixture scope remains Qwen visual understanding and visual QA metadata only
- raw chat, arbitrary user media, browser-facing invocation, and unbounded private inference are rejected
- current execution allowed: false

### Persisted Worker Dispatch Refs

- one persisted Qwen job ref, one lease ref, one worker claim ref, one backend runtime message ref, one job event ref, and one idempotency key are required
- retry budget, timeout, duplicate-source rejection, request hash match, stale lease cleanup, and conflict handling are explicit
- this retry plan creates no job row, lease claim, idempotency row, event row, runtime message, or worker claim
- current execution allowed: false

### Private Source-Of-Truth Refs

- private frame refs, storage object record refs, artifact manifest refs, checksum refs, approved snapshot refs, and source-media immutability refs are required
- signed URLs and public URLs remain non-source-of-truth and must not be included in the retry request
- Supabase mutation, SQL, storage writes, generated assets, public artifacts, and signed URLs remain blocked
- current execution allowed: false

### Private Inference Request Envelope

- future request envelope remains limited to `qwen_fixture_visual_metadata_v1`
- request includes approved snapshot refs, private frame refs, manifest refs, checksum refs, visual QA task refs, and persisted dispatch refs only
- request excludes raw model prompts, raw provider prompts, raw worker prompts, public URLs, signed URLs, and generated-asset creation instructions
- current execution allowed: false

### Transport, Credential, And Cloud Run Boundary

- service target, audience, identity token, and auth header remain runtime-scoped and never stored in repo docs, UI payloads, logs, or persisted data
- the future retry gate must prove the caller job and service are still visible before any request is allowed
- this plan does not fetch an identity token, create an auth header, execute a caller job, invoke Cloud Run, or send a private request
- current execution allowed: false

### Model Runtime One-Fixture Boundary

- future retry remains bounded to one approved fixture and one private inference attempt maximum
- model import, model load, vLLM initialization, prompt processing, forward pass, and inference stay blocked until a separate gate approves them
- CPU fallback stays disabled and Qwen remains metadata-only visual understanding and QA, not generated B-roll video
- current execution allowed: false

### Sanitized Response Result Review

- future result review accepts only `qwen_fixture_visual_metadata_v1` metadata with raw-output exclusion evidence
- expected evidence includes schema version, object rows, text-like regions, spatial relations, blocked-action evidence, normalized metadata hash, timing, latency, cleanup, and no-spend internal cost refs
- raw model output must not be stored in docs, logs, UI payloads, Supabase rows, storage objects, generated assets, or public artifacts
- current execution allowed: false

## Future Retry Boundaries

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
- retry gate required before attempt: true
- read-only auth preflight required before attempt: true
- result review required after attempt: true

## Source-Of-Truth Rules

Workers execute approved snapshots, not raw chat.

```text
structured findings
-> edit intents
-> approved plan snapshot
-> persisted worker dispatch refs
-> private storage/manifests/checksums
-> bounded private inference handoff
-> sanitized metadata result review
```

The plan preserves these rules:

- structured findings and edit intents must feed approved snapshots before worker execution
- persisted worker dispatch refs are required before any private inference retry
- private storage object records, manifests, checksums, and approved snapshot refs are source-of-truth inputs
- signed URLs and public URLs are not source of truth
- frontend code must not claim jobs, resolve private invoke credentials, call Cloud Run, or create generated assets
- Qwen remains visual understanding and visual QA metadata only
- Qwen must not generate B-roll video, render, export, replace deterministic OCR, or publish artifacts

## Runtime Flags

- `authRefreshResultAccepted=true`
- `accessTokenRefreshPassed=true`
- `serviceDescribePassed=true`
- `jobDescribePassed=true`
- `approvedFixturePrivateInferenceRetryPlanRecorded=true`
- `approvedFixturePrivateInferenceRetryGateRequired=true`
- `readyForApprovedFixturePrivateInferenceRetryGate=true`
- `authRefreshedGateRecheckPlanned=true`
- `approvedSnapshotAndFixtureLockPlanned=true`
- `persistedWorkerDispatchRefsPlanned=true`
- `privateSourceOfTruthRefsPlanned=true`
- `privateInferenceRequestEnvelopePlanned=true`
- `transportCredentialAndCloudRunBoundaryPlanned=true`
- `modelRuntimeOneFixtureBoundaryPlanned=true`
- `sanitizedResponseResultReviewPlanned=true`
- `selectedGpuL4Accepted=true`
- `scaleToZeroCostPostureAccepted=true`
- `minInstancesZeroAccepted=true`
- `initialMaxInstancesOneAccepted=true`
- `cpuFallbackDisabledAccepted=true`
- `retryGateRunNow=false`
- `approvedFixturePrivateInferenceRetryGateRecorded=false`
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
- `cloudRunJobExecuted=false`
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

- Qwen auth/service/job visibility is no longer the active Qwen blocker.
- The next Qwen step is now a runtime gate that must repeat read-only preflight and verify the bounded approved-fixture private inference retry conditions.
- The retry path remains fail-closed before Cloud Run invocation, caller job execution, identity-token fetch, private request, model load, inference, generated assets, signed URLs, beta, and production.

## What This Does Not Prove

- It does not prove the Cloud Run service has been invoked.
- It does not prove the private caller job has executed.
- It does not prove Qwen model import, load, vLLM initialization, forward pass, or inference.
- It does not create, persist, or publish generated assets.
- It does not authorize runtime execution, beta, production, `dry_run_passed`, or `generated_local_fixture_passed`.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58DS-PRIVATE-INFERENCE-RETRY-GATE: verify bounded approved-fixture private inference retry gate after auth refresh, no inference/no mutation`
