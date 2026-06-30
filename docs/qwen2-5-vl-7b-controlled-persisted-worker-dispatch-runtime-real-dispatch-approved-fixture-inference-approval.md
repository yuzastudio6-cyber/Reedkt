# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Approved-Fixture Inference Approval

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_inference_approval_accepted_preflight_required`.

This packet approves the controlled Qwen approved-fixture inference plan for a future preflight only. It does not run the preflight, import the model, load the model, initialize vLLM, process a prompt, run a forward pass, invoke Cloud Run, dispatch a worker, create a real job, claim a lease, mutate Supabase, execute SQL, create generated assets, create storage objects, create signed URLs, create public artifacts, spend credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

The approval accepts the recorded 58CX plan as the next safe scope: one bounded approved-fixture Qwen metadata inference may be preflighted later through persisted worker dispatch. It still does not approve runtime inference now.

## Upstream Evidence

- approved-fixture inference plan: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-plan.md`
- approved-fixture inference plan spec: `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-plan.ts`
- approved-fixture inference plan smoke: `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-plan-smoke.ts`
- approved plan snapshot policy: `approved-plan-snapshot-policy.md`
- editing agent execution architecture: `editing-agent-execution-architecture.md`
- model routing policy: `model-routing-policy.md`
- intent-led edit planning: `intent-led-edit-planning.md`

## Approval Scope

- decision recorded: true
- accepts approved-fixture inference plan for future preflight: true
- approved-fixture inference approval required: false
- approved-fixture inference approval recorded: true
- approved-fixture inference accepted for preflight: true
- approved-fixture inference preflight required: true
- future single approved-fixture inference preflight approved: true
- future model import preflight check approved: true
- future model load preflight check approved: true
- future vLLM preflight check approved: true
- future private invoke preflight check approved: true
- future response schema preflight check approved: true
- inference approved now: false
- model import approved now: false
- model load approved now: false
- vLLM initialization approved now: false
- prompt processing approved now: false
- forward pass approved now: false
- worker dispatch approved now: false
- Cloud Run invocation approved now: false
- generated assets approved now: false
- Supabase mutation approved now: false
- credit spend approved now: false
- beta approved now: false
- production approved now: false

## Accepted Plan Evidence

- approved snapshot and fixture scope accepted for future preflight: true
- persisted worker dispatch refs accepted for future preflight: true
- private source-of-truth refs accepted for future preflight: true
- Qwen request envelope accepted for future preflight: true
- private invoke transport dependencies accepted for future preflight: true
- Qwen runtime inference boundary accepted for future preflight: true
- response schema and result handling accepted for future preflight: true
- QA, audit, cost, and credit no-spend accepted for future preflight: true
- cleanup, retry, and beta lock accepted for future preflight: true

## Approved Runtime Posture

- platform: `google_cloud_run_gpu`
- selected GPU: `nvidia_l4`
- region: `us-central1`
- service: `reeditpro-qwen2-5-vl-l4-worker`
- cost posture: `scale_to_zero_required`
- minimum instances: 0
- initial max instances: 1
- CPU fallback allowed: false

The approved future preflight keeps the existing cost-friendly posture: NVIDIA L4, scale-to-zero, zero minimum instances, one initial max instance, and no CPU fallback for Qwen2.5-VL 7B.

## Future Preflight Boundaries

- max approved fixture requests: 1
- arbitrary user media allowed: false
- raw chat worker execution allowed: false
- raw worker prompt allowed: false
- Qwen may generate B-roll video: false
- Qwen may create generated assets: false
- Qwen may render or export: false
- signed URLs as source of truth allowed: false
- public URLs as source of truth allowed: false
- approval recorded before preflight: true
- future preflight may verify inference envelope only: true
- future preflight may import model now: false
- future preflight may load model now: false
- future preflight may initialize vLLM now: false
- future preflight may invoke Cloud Run now: false
- future preflight may run forward pass now: false

## Source-Of-Truth Rules

- Workers execute approved snapshots, not raw chat.
- Private storage, manifest, checksum, and approved snapshot refs are required for source-of-truth paths.
- Signed URLs and public URLs are not source of truth.
- Frontend code may not resolve private invoke credentials.
- Frontend code may not call Cloud Run.
- Frontend code may not create generated assets.
- Qwen remains visual understanding and visual QA metadata only.

## Runtime Flags

- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePlanRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceApprovalRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceApprovalRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceAcceptedForPreflight=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePreflightRequired=true`
- `approvedSnapshotAndFixtureScopeAccepted=true`
- `persistedWorkerDispatchRefsAccepted=true`
- `privateSourceOfTruthRefsAccepted=true`
- `qwenRequestEnvelopeAccepted=true`
- `privateInvokeTransportDependenciesAccepted=true`
- `qwenRuntimeInferenceBoundaryAccepted=true`
- `responseSchemaAndResultHandlingAccepted=true`
- `qaAuditCostAndCreditNoSpendAccepted=true`
- `cleanupRetryAndBetaLockAccepted=true`
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

## What This Approval Fixes

The previous plan defined the safe one-request approved-fixture inference envelope. This approval accepts that envelope for a future no-side-effect preflight, so the next prompt can verify prerequisites without running Qwen inference or creating assets.

## Required Next Step

The next action is preflight verification. The future preflight may verify static approved snapshot refs, persisted dispatch refs, private source-of-truth refs, Qwen request envelope shape, runtime target metadata, response schema expectations, and cleanup rules. It must not import the model, load the model, initialize vLLM, invoke Cloud Run, run inference, create generated assets, mutate Supabase, spend credits, unlock beta, unlock production, or claim `generated_local_fixture_passed`.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58CZ-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVED-FIXTURE-INFERENCE-PREFLIGHT: verify one controlled Qwen approved-fixture inference preflight through persisted worker dispatch, no generated assets/no beta`
