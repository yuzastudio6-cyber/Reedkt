# Qwen2.5-VL 58DH Approved Fixture Private Invoke Execution Approval

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_invoke_execution_approval_accepted_preflight_required`.

This packet approves the recorded 58DG bounded approved-fixture private invoke execution plan for a future preflight only. It does not run the preflight, create a job, claim a lease, create an idempotency row, create job events, create backend runtime messages, create worker claims, mutate Supabase, execute SQL, resolve service URLs, resolve audiences, fetch identity tokens, create auth headers, invoke Cloud Run, import Qwen, load Qwen, initialize vLLM, process prompts, run a forward pass, run inference, persist model output, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

The approval accepts only that the 58DG execution plan is specific enough for a later no-side-effect preflight. The later preflight may verify static approved-fixture scope, approved snapshot binding, persisted job refs, idempotency refs, lease-claim path, sanitized event path, worker-claim handoff, private invoke transport prerequisites, NVIDIA L4 scale-to-zero posture, Qwen request/response schema compatibility, and cleanup/rollback/no-spend evidence. It must not send a private request or run Qwen.

## Upstream Evidence

- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-execution-plan.md`
- `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-execution-plan.ts`
- `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-execution-plan-smoke.ts`
- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-readiness-review.md`
- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-result-review.md`
- `approved-plan-snapshot-policy.md`
- `editing-agent-execution-architecture.md`
- `async-edit-work-graph.md`
- `editing-asset-manifest.md`
- `model-routing-policy.md`

## Approval Scope

- decision recorded: true
- accepts approved-fixture private invoke execution plan for future preflight: true
- approved-fixture private invoke execution approval required: false
- approved-fixture private invoke execution approval recorded: true
- approved-fixture private invoke accepted for preflight: true
- approved-fixture private invoke preflight required: true
- future single approved-fixture private invoke preflight approved: true
- future approved fixture selection preflight check approved: true
- future approved snapshot binding preflight check approved: true
- future persisted job/idempotency/lease preflight check approved: true
- future private source-of-truth preflight check approved: true
- future private invoke transport preflight check approved: true
- future Qwen runtime boundary preflight check approved: true
- future response schema preflight check approved: true
- future QA/audit/cost/no-spend preflight check approved: true
- private invoke approved now: false
- worker dispatch approved now: false
- worker lease claim approved now: false
- Cloud Run invocation approved now: false
- model import approved now: false
- model load approved now: false
- vLLM initialization approved now: false
- prompt processing approved now: false
- forward pass approved now: false
- Qwen inference approved now: false
- generated assets approved now: false
- Supabase mutation approved now: false
- credit spend approved now: false
- beta approved now: false
- production approved now: false

## Accepted Plan Evidence

- approved fixture selection accepted for future preflight: true
- approved snapshot binding accepted for future preflight: true
- persisted job reference accepted for future preflight: true
- idempotency guard accepted for future preflight: true
- transactional lease claim path accepted for future preflight: true
- sanitized runtime event path accepted for future preflight: true
- worker claim handoff accepted for future preflight: true
- private invoke transport preflight accepted for future preflight: true
- Cloud Run L4 request boundary accepted for future preflight: true
- Qwen runtime boundary accepted for future preflight: true
- response schema handling accepted for future preflight: true
- QA, audit, cost, and credit no-spend accepted for future preflight: true
- cleanup, rollback, and retry accepted for future preflight: true

## Approved Runtime Posture

- platform: `google_cloud_run_gpu`
- selected GPU: `nvidia_l4`
- region: `us-central1`
- service: `reeditpro-qwen2-5-vl-l4-worker`
- cost posture: `scale_to_zero_required`
- minimum instances: 0
- initial max instances: 1
- CPU fallback allowed: false

The approved future preflight keeps the existing cost-controlled posture: NVIDIA L4, scale-to-zero, zero minimum instances, one initial max instance, and no CPU fallback. This packet does not resize, deploy, warm, or invoke the runtime.

## Future Preflight Boundaries

- max approved fixture private invoke attempts: 1
- arbitrary user media allowed: false
- raw chat worker execution allowed: false
- raw worker prompt allowed: false
- raw provider prompt allowed: false
- raw model output persisted: false
- frontend invocation allowed: false
- signed URLs as source of truth allowed: false
- public URLs as source of truth allowed: false
- generated assets allowed: false
- final render/export allowed: false
- credit spend allowed: false
- approval recorded before preflight: true
- future preflight may verify private invoke envelope only: true
- future preflight may resolve service URL now: false
- future preflight may fetch identity token now: false
- future preflight may create auth header now: false
- future preflight may invoke Cloud Run now: false
- future preflight may import model now: false
- future preflight may load model now: false
- future preflight may initialize vLLM now: false
- future preflight may run forward pass now: false

## Source-Of-Truth Rules

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

The approval preserves these rules:

- structured findings and edit intents must feed approved snapshots before worker execution
- private storage object records, manifests, checksums, and approved snapshot refs are source-of-truth inputs
- signed URLs and public URLs are not source of truth
- frontend code must not claim jobs, resolve private invoke credentials, call Cloud Run, or create generated assets
- Qwen remains visual understanding and visual QA metadata only
- Qwen must not generate B-roll video, render, export, replace deterministic OCR, or publish artifacts

## Runtime Flags

- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionPlanRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionApprovalRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionApprovalRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeAcceptedForPreflight=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokePreflightRequired=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokePreflightRecorded=false`
- `approvedFixtureSelectionAccepted=true`
- `approvedSnapshotBindingAccepted=true`
- `persistedJobReferenceAccepted=true`
- `idempotencyGuardAccepted=true`
- `transactionalLeaseClaimAccepted=true`
- `sanitizedRuntimeEventAccepted=true`
- `workerClaimHandoffAccepted=true`
- `privateInvokeTransportAccepted=true`
- `cloudRunL4RequestAccepted=true`
- `qwenRuntimeBoundaryAccepted=true`
- `responseSchemaHandlingAccepted=true`
- `qaAuditCostCreditNoSpendAccepted=true`
- `cleanupRollbackRetryAccepted=true`
- `selectedGpuL4Accepted=true`
- `scaleToZeroCostPostureAccepted=true`
- `minInstancesZeroAccepted=true`
- `initialMaxInstancesOneAccepted=true`
- `cpuFallbackDisabledAccepted=true`
- `readyForApprovedFixturePrivateInvokePreflight=true`
- `readyForRealWorkerDispatch=false`
- `privateInvokeReady=false`
- `approvedFixturePrivateInvokeApprovedNow=false`
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

The previous packet defined the exact bounded private-invoke execution plan. This approval accepts that envelope for future preflight only, so the next prompt can verify prerequisites without invoking Cloud Run, touching model runtime, or creating assets.

## Required Next Step

The next action is preflight verification. The future preflight may verify static approved snapshot refs, persisted job refs, private source-of-truth refs, idempotency/lease/sanitized-event/worker-claim paths, private invoke target resolution paths, runtime target metadata, response schema expectations, and cleanup rules. It must not resolve or print credentials, invoke Cloud Run, import the model, load the model, initialize vLLM, run inference, create generated assets, mutate Supabase, spend credits, unlock beta, unlock production, or claim `generated_local_fixture_passed`.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58DI-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVED-FIXTURE-PRIVATE-INVOKE-PREFLIGHT: verify one bounded approved-fixture private invoke preflight through the persisted job and lease bridge, no Cloud Run invocation/no inference/no generated assets/no beta`
