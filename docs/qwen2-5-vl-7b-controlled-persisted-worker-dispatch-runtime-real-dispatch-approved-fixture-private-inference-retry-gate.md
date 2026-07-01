# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Approved-Fixture Private Inference Retry Gate

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_inference_retry_gate_verified_attempt_approval_required`.

This packet records the 58DS bounded approved-fixture private inference retry gate after the 58DR retry plan. It is a gate-evidence packet only. It does not execute the private caller job, fetch a service identity token, create an auth header, invoke Cloud Run, send a private request, import Qwen, load Qwen, initialize vLLM, process prompts, run a forward pass, run inference, persist results, create generated assets, create signed URLs, publish artifacts, mutate Supabase, execute SQL, write storage, spend credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

The upstream 58DR retry plan recorded the bounded retry envelope after read-only auth refresh verified service and caller-job visibility. This gate records that the no-execution retry conditions are verified enough to require a separate future retry attempt approval. It does not authorize an attempt.

## Upstream Evidence

- private inference retry plan: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan.md`
- private inference retry plan spec: `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan.ts`
- private inference retry plan smoke: `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-retry-plan-smoke.ts`
- private inference auth-refresh result: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-inference-auth-refresh-result.md`
- approved plan snapshot policy: `approved-plan-snapshot-policy.md`
- worker execution architecture: `editing-agent-execution-architecture.md`
- model routing policy: `model-routing-policy.md`
- intent-led edit planning: `intent-led-edit-planning.md`

## Live Read-Only Gate Evidence

- retry plan recorded: true
- auth refresh result accepted: true
- access token refresh passed: true
- Cloud Run service describe passed: true
- Cloud Run caller job describe passed: true
- read-only preflight repeated for gate: true
- downstream probe skipped: false
- blocker: `cleared`
- token value printed: false
- token value stored: false
- raw gcloud output stored: false

The read-only gate evidence is limited to the same safe visibility class as the external-agent blocker preflight: auth refresh, service describe, and caller job describe. No identity token was fetched, no auth header was created, no caller job was executed, no Cloud Run service was invoked, no request was sent, and no model runtime was touched.

## Retry Gate Decision

- decision recorded: true
- accepts retry plan for future attempt approval: true
- approved-fixture private inference retry gate required: false
- approved-fixture private inference retry gate recorded: true
- approved-fixture private inference retry gate passed: true
- approved-fixture private inference retry attempt approval required: true
- static and read-only gate verified only: true
- caller job execution approved now: false
- service target resolution approved now: false
- audience resolution approved now: false
- identity token fetch approved now: false
- auth header creation approved now: false
- private request send approved now: false
- Cloud Run invocation approved now: false
- model import approved now: false
- model load approved now: false
- vLLM initialization approved now: false
- prompt processing approved now: false
- forward pass approved now: false
- Qwen inference approved now: false
- result persistence approved now: false
- generated asset creation approved now: false
- Supabase mutation approved now: false
- credit spend approved now: false
- beta approved now: false
- production approved now: false

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

NVIDIA L4 remains the selected run-on-use GPU target for Qwen2.5-VL 7B. Minimum instances remain 0 so the GPU is not left running when unused. This gate does not resize, deploy, warm, invoke, or mutate the service.

## Verified Retry Gate Areas

### Auth-Refreshed Gate Recheck

- read-only gcloud auth refresh, Cloud Run service describe, and private caller job describe remain verified
- private inference auth-refresh evidence remains current and token values remain suppressed
- gate stops before identity-token fetch, auth-header creation, caller job execution, private request, model load, and inference
- current execution allowed: false

### Approved Snapshot And Fixture Lock

- one approved fixture id, approved plan snapshot id, immutable plan version, source-order refs, structured findings, edit intents, timing refs, and checksum refs remain required
- fixture scope remains Qwen visual understanding and visual QA metadata only
- raw chat, arbitrary user media, browser-facing invocation, and unbounded private inference are rejected
- current execution allowed: false

### Persisted Worker Dispatch Refs

- one persisted Qwen job ref, lease ref, worker claim ref, backend runtime message ref, job event ref, and idempotency key remain required
- retry budget, timeout, duplicate-source rejection, request hash match, stale lease cleanup, and conflict handling remain explicit
- this retry gate creates no job row, lease claim, idempotency row, event row, runtime message, or worker claim
- current execution allowed: false

### Private Source-Of-Truth Refs

- private frame refs, storage object record refs, artifact manifest refs, checksum refs, approved snapshot refs, and source-media immutability refs remain required
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
- caller job and service visibility are verified as read-only metadata only
- this gate does not fetch an identity token, create an auth header, execute a caller job, invoke Cloud Run, or send a private request
- current execution allowed: false

### Model Runtime One-Fixture Boundary

- future retry remains bounded to one approved fixture and one private inference attempt maximum
- model import, model load, vLLM initialization, prompt processing, forward pass, and inference stay blocked until a separate approval permits the attempt
- CPU fallback stays disabled and Qwen remains metadata-only visual understanding and QA, not generated B-roll video
- current execution allowed: false

### Sanitized Response Result Review

- future result review accepts only `qwen_fixture_visual_metadata_v1` metadata with raw-output exclusion evidence
- expected evidence includes schema version, object rows, text-like regions, spatial relations, blocked-action evidence, normalized metadata hash, timing, latency, cleanup, and no-spend internal cost refs
- raw model output must not be stored in docs, logs, UI payloads, Supabase rows, storage objects, generated assets, or public artifacts
- current execution allowed: false

## Future Attempt Approval Requirements

- repeat read-only blocker preflight immediately before any future attempt approval or execution step
- exact approved fixture id, approved plan snapshot id, immutable plan version, structured findings, edit intents, timing refs, private frame refs, manifest refs, checksum refs, and source-order refs
- one persisted Qwen job ref, lease ref, worker claim ref, backend runtime message ref, job event ref, idempotency key, request hash, retry budget, timeout policy, stale lease cleanup, duplicate-source rejection, and conflict handling
- private source-of-truth refs only; signed URLs, public URLs, browser-facing invocations, raw chat, raw worker prompts, raw provider prompts, and arbitrary user media remain rejected
- runtime-scoped service target, audience, identity token, and auth header handling with no value persistence in docs, logs, UI payloads, Supabase, storage, or repo data
- NVIDIA L4 Cloud Run target with scale-to-zero, minimum instances zero, initial maximum one, bounded timeout, and CPU fallback disabled
- Qwen visual-understanding and visual-QA metadata scope only; no generated B-roll video, render/export, deterministic OCR replacement, or public artifact publication
- `qwen_fixture_visual_metadata_v1` response schema expectation, raw-output exclusion, invalid-schema handling, disabled-inference handling, normalized metadata hash, and separate result review gate
- QA, audit, latency, cleanup, no-spend internal cost placeholder, credit no-spend, beta lock, production lock, signed URL lock, generated asset lock, public artifact lock, and render/export lock

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

The gate preserves these rules:

- structured findings and edit intents must feed approved snapshots before worker execution
- persisted worker dispatch refs are required before any private inference retry
- private storage object records, manifests, checksums, and approved snapshot refs are source-of-truth inputs
- signed URLs and public URLs are not source of truth
- frontend code must not claim jobs, resolve private invoke credentials, call Cloud Run, or create generated assets
- Qwen remains visual understanding and visual QA metadata only
- Qwen must not generate B-roll video, render, export, replace deterministic OCR, or publish artifacts

## Runtime Flags

- `retryPlanAccepted=true`
- `authRefreshResultAccepted=true`
- `accessTokenRefreshPassed=true`
- `serviceDescribePassed=true`
- `jobDescribePassed=true`
- `readOnlyPreflightRepeatedForGate=true`
- `approvedFixturePrivateInferenceRetryPlanRecorded=true`
- `approvedFixturePrivateInferenceRetryGateRequired=false`
- `approvedFixturePrivateInferenceRetryGateRecorded=true`
- `approvedFixturePrivateInferenceRetryGatePassed=true`
- `approvedFixturePrivateInferenceRetryAttemptApprovalRequired=true`
- `readyForApprovedFixturePrivateInferenceRetryAttemptApproval=true`
- `authRefreshedGateRecheckVerified=true`
- `approvedSnapshotAndFixtureLockVerified=true`
- `persistedWorkerDispatchRefsVerified=true`
- `privateSourceOfTruthRefsVerified=true`
- `privateInferenceRequestEnvelopeVerified=true`
- `transportCredentialAndCloudRunBoundaryVerified=true`
- `modelRuntimeOneFixtureBoundaryVerified=true`
- `sanitizedResponseResultReviewVerified=true`
- `selectedGpuL4Accepted=true`
- `scaleToZeroCostPostureAccepted=true`
- `minInstancesZeroAccepted=true`
- `initialMaxInstancesOneAccepted=true`
- `cpuFallbackDisabledAccepted=true`
- `retryGateRunNow=false`
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

- The Qwen bounded approved-fixture private inference retry plan is now gate-verified as no-execution evidence.
- The next Qwen step is a separate approval for one bounded private inference retry attempt.
- Runtime remains fail-closed before Cloud Run invocation, caller job execution, identity-token fetch, private request, model load, inference, generated assets, signed URLs, beta, and production.

## What This Does Not Prove

- It does not prove the Cloud Run service has been invoked.
- It does not prove the private caller job has executed.
- It does not prove Qwen model import, load, vLLM initialization, forward pass, or inference.
- It does not create, persist, or publish generated assets.
- It does not authorize runtime execution, beta, production, `dry_run_passed`, or `generated_local_fixture_passed`.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58DT-PRIVATE-INFERENCE-RETRY-ATTEMPT-APPROVAL: approve one bounded approved-fixture private inference retry after gate verification, no inference/no mutation`
