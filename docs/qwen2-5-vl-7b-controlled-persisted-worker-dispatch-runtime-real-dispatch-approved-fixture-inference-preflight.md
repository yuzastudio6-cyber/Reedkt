# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Approved-Fixture Inference Preflight

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_inference_preflight_verified_attempt_approval_required`.

This packet verifies the controlled Qwen approved-fixture inference preflight as a no-call, static-envelope check. It accepts the recorded 58CY approval as sufficient to move to a future inference attempt approval, but it does not run the attempt or touch runtime model/service execution now.

This is preflight verification only. It does not import the model, load the model, initialize vLLM, process a prompt, run a forward pass, invoke Cloud Run, dispatch a worker, create a real job, claim a lease, mutate Supabase, execute SQL, create generated assets, create storage objects, create signed URLs, create public artifacts, process media, render/export, spend credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Reviewed Evidence

- approved-fixture inference approval: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-approval.md`
- approved-fixture inference approval spec: `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-approval.ts`
- approved-fixture inference approval smoke: `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-approval-smoke.ts`
- approved-fixture inference plan: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-plan.md`
- approved plan snapshot policy: `approved-plan-snapshot-policy.md`
- worker execution architecture: `editing-agent-execution-architecture.md`
- model routing policy: `model-routing-policy.md`
- intent-led planning policy: `intent-led-edit-planning.md`

## Preflight Outcome

- approved-fixture inference approval accepted for future preflight: true
- controlled approved-fixture inference preflight recorded: true
- controlled approved-fixture inference preflight passed: true
- controlled approved-fixture inference attempt approval required: true
- static envelope verified only: true
- model import approved now: false
- model load approved now: false
- vLLM initialization approved now: false
- prompt processing approved now: false
- forward pass approved now: false
- Cloud Run invocation approved now: false
- worker dispatch approved now: false
- Supabase mutation approved now: false
- generated asset creation approved now: false
- credit spend approved now: false
- beta readiness advanced: false
- production readiness advanced: false

## Verified Preflight Areas

| Check | Owner | Static envelope verified | Runtime value resolved now | Model/service touched now | Request sent now | Execution allowed now |
| --- | --- | --- | --- | --- | --- | --- |
| approved snapshot and fixture scope | AI_VIDEO_BROLL_GENERATION | true | false | false | false | false |
| persisted worker dispatch refs | WORKER_RUNTIME_JOBS | true | false | false | false | false |
| private source-of-truth refs | SUPABASE_RLS_STORAGE_DATABASE | true | false | false | false | false |
| Qwen request envelope | AI_VIDEO_BROLL_GENERATION | true | false | false | false | false |
| private invoke transport dependencies | PROVIDER_GATEWAY_MODELS | true | false | false | false | false |
| Qwen runtime inference boundary | WORKER_RUNTIME_JOBS | true | false | false | false | false |
| response schema and result handling | AI_VIDEO_BROLL_GENERATION | true | false | false | false | false |
| QA, audit, cost, and credit no-spend | OBSERVABILITY_AUDIT_COST | true | false | false | false | false |
| cleanup, retry, and beta lock | WORKER_RUNTIME_JOBS | true | false | false | false | false |

## Future Attempt Approval Requirements

The next approval prompt must decide whether a later prompt may attempt one bounded approved-fixture inference. It must still require:

- approved snapshot, immutable plan version, structured findings, edit intents, private source refs, manifest refs, checksum refs, job refs, lease refs, idempotency refs, and runtime target refs;
- one deterministic approved fixture request only, with arbitrary user media, raw chat execution, raw worker prompt payloads, public URLs, and signed URLs rejected;
- backend-only private invoke transport dependency envelope, with no service URL, audience, identity token, auth header, or credential value persisted in repo evidence;
- Qwen model import, model load, vLLM initialization, prompt processing, forward pass, and inference remaining separately approval-gated;
- response schema expectation for visual metadata only, with raw model output excluded from repo evidence and generated B-roll video explicitly blocked;
- QA, audit, cost, credit, cleanup, rollback, beta, production, public artifact, signed URL, generated asset, and render/export locks;
- NVIDIA L4 Cloud Run GPU posture with scale-to-zero, minimum instances zero, initial maximum one, and CPU fallback disabled.

## Runtime Posture

- selected platform: `google_cloud_run_gpu`
- selected GPU: `nvidia_l4`
- region: `us-central1`
- service name: `reeditpro-qwen2-5-vl-l4-worker`
- cost posture: `scale_to_zero_required`
- minimum instances: 0
- initial max instances: 1
- CPU fallback allowed: false

NVIDIA L4 remains the cost-friendly Cloud Run GPU target for bounded Qwen visual-analysis requests that run only when invoked and scale down when idle. This preflight does not keep GPU instances running and does not invoke the runtime.

## Source-Of-Truth Rules

- Workers execute approved snapshots, not raw chat.
- Structured findings and edit intents feed approved snapshots before worker execution.
- Private storage object records, manifests, checksums, approved snapshot refs, job refs, lease refs, and idempotency refs are source-of-truth inputs.
- Signed URLs and public URLs are not source of truth.
- Frontend code may not resolve private invoke credentials.
- Frontend code may not call Cloud Run.
- Qwen remains visual understanding and visual QA metadata only.
- Qwen must not generate B-roll video, render, export, replace deterministic OCR, replace deterministic frame sampling, create public artifacts, create signed URLs, or become a browser-facing runtime.

## Runtime Gates

- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePlanRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceApprovalRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceApprovalRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAcceptedForPreflight=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePreflightRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePreflightRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePreflightPassed=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAttemptApprovalRequired=true`
- `approvedSnapshotAndFixtureScopePreflightVerified=true`
- `persistedWorkerDispatchRefsPreflightVerified=true`
- `privateSourceOfTruthRefsPreflightVerified=true`
- `qwenRequestEnvelopePreflightVerified=true`
- `privateInvokeTransportDependenciesPreflightVerified=true`
- `qwenRuntimeInferenceBoundaryPreflightVerified=true`
- `responseSchemaAndResultHandlingPreflightVerified=true`
- `qaAuditCostAndCreditNoSpendPreflightVerified=true`
- `cleanupRetryAndBetaLockPreflightVerified=true`
- `selectedGpuL4Accepted=true`
- `scaleToZeroCostPostureAccepted=true`
- `minInstancesZeroAccepted=true`
- `initialMaxInstancesOneAccepted=true`
- `cpuFallbackDisabledAccepted=true`
- `readyForRealWorkerDispatch=false`
- `approvedFixtureInferencePreflightExecuted=false`
- `approvedFixtureInferenceAttemptExecuted=false`
- `approvedFixtureInferenceAcceptedForPersistedDispatch=false`
- `approvedFixtureInferenceApprovedNow=false`
- `serviceUrlResolvedNow=false`
- `audienceResolvedNow=false`
- `identityTokenFetched=false`
- `authHeaderCreated=false`
- `privateRequestSendAllowedNow=false`
- `cloudRunInvocationAttempted=false`
- `serviceRuntimeRequestSent=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `vllmEngineInitialized=false`
- `promptProcessed=false`
- `forwardPassRun=false`
- `inferenceRun=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `generatedAssetsCreated=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `betaReady=false`
- `productionReady=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## What This Fixes

The previous approval accepted the planned one-request approved-fixture inference envelope for a future preflight. This packet performs that static preflight verification and confirms the envelope is complete enough to ask for explicit attempt approval next.

It deliberately stops before import, load, vLLM initialization, prompt processing, forward pass, Cloud Run invocation, worker dispatch, Supabase mutation, generated asset creation, credit spend, beta, production, or any `generated_local_fixture_passed` claim.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58DA-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVED-FIXTURE-INFERENCE-ATTEMPT-APPROVAL: approve one controlled Qwen approved-fixture inference attempt through persisted worker dispatch, no generated assets/no beta`
