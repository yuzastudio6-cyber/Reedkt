# Qwen2.5-VL 58DG Approved Fixture Private Invoke Execution Plan

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_private_invoke_execution_plan_recorded_execution_approval_required`.

This packet records the bounded execution plan for one future approved-fixture private invoke through the persisted job and lease bridge. The plan exists so a later approval gate can decide whether to authorize one controlled attempt. It does not approve execution now, create a job, claim a lease, create an idempotency row, create job events, create backend runtime messages, create worker claims, mutate Supabase, execute SQL, resolve service URLs, resolve audiences, fetch identity tokens, create auth headers, invoke Cloud Run, import Qwen, load Qwen, initialize vLLM, process prompts, run a forward pass, run inference, persist model output, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Reviewed Evidence

- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-readiness-review.md`
- `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-readiness-review.ts`
- `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-private-invoke-readiness-review-smoke.ts`
- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-result-review.md`
- `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-result-review.ts`
- `src/backend/workers/qwen2-5-vl-controlled-persisted-job-lease-bridge.ts`
- `src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts`
- `approved-plan-snapshot-policy.md`
- `editing-agent-execution-architecture.md`
- `async-edit-work-graph.md`
- `editing-asset-manifest.md`
- `model-routing-policy.md`

## Plan Outcome

- approved-fixture private invoke readiness review accepted: true
- approved-fixture private invoke execution plan recorded: true
- approved-fixture private invoke execution approval required: true
- ready for execution approval planning: true
- private invoke approved now: false
- worker dispatch approved now: false
- worker lease claim approved now: false
- Cloud Run invocation approved now: false
- Qwen inference approved now: false
- generated asset creation approved now: false
- beta readiness advanced: false
- production readiness advanced: false

## One Bounded Future Invoke Envelope

| Step | Future behavior | Current execution allowed |
| --- | --- | --- |
| approved fixture selection | Select exactly one deterministic approved fixture scoped to Qwen visual understanding and visual QA metadata. | false |
| approved snapshot binding | Bind approved plan snapshot id, immutable plan version, checksum, structured findings, edit intents, timing refs, source refs, and worker graph. | false |
| persisted job reference | Use one persisted Qwen worker job reference, one job type, one workspace/project scope, and one request hash. | false |
| idempotency guard | Require one persisted idempotency key with duplicate-source rejection before any lease claim can be approved. | false |
| transactional lease claim | Plan one backend service-role lease claim with timeout, stale-lease cleanup, and conflict handling. | false |
| sanitized runtime event | Plan sanitized job event and backend runtime message refs with no raw prompt, credential, token, URL, or raw response value. | false |
| worker claim handoff | Plan one worker claim handoff that carries approved snapshot refs, private source refs, manifest refs, checksum refs, and runtime target metadata only. | false |
| private invoke transport | Keep service target, audience, identity token, and auth header resolution backend/runtime-only and non-persisted. | false |
| Cloud Run L4 request | Plan one private Cloud Run GPU request against NVIDIA L4 with scale-to-zero, min instances 0, initial max instances 1, bounded timeout, and CPU fallback disabled. | false |
| Qwen runtime boundary | Future approval may permit one bounded import/load/vLLM/prompt/forward-pass/inference path; this plan does not run it. | false |
| response schema handling | Require `qwen_fixture_visual_metadata_v1` metadata-only parsing, schema validation, raw output exclusion, and result-review gate before acceptance. | false |
| QA/audit/cost/credit | Plan sanitized QA, audit, latency, cleanup, rollback, internal cost, and no-spend credit evidence. | false |

## Attempt Scope

- max approved fixture private invoke attempts: 1
- arbitrary user media allowed: false
- raw chat worker execution allowed: false
- raw worker prompt allowed: false
- raw provider prompt allowed: false
- raw model output persisted: false
- frontend invocation allowed: false
- service URL persisted: false
- audience persisted: false
- identity token persisted: false
- auth header persisted: false
- signed URLs as source of truth allowed: false
- public URLs as source of truth allowed: false
- generated assets allowed: false
- final render/export allowed: false
- credit spend allowed: false

## Preflight Requirements For Later Approval

The later execution approval must re-check these items before any preflight or attempt can run:

- exact approved fixture id, approved snapshot id, immutable version, checksum, structured findings, edit intents, timing refs, source-order refs, and worker graph;
- persisted job id, lease scope, idempotency key, request hash, runtime target, and duplicate-source guard;
- private source refs, private storage object records, manifest refs, checksum refs, approved snapshot refs, and access scope;
- runtime target, selected GPU, min/max instances, timeout, retry budget, scale-to-zero posture, and CPU fallback disabled;
- backend-only service-role lease claim path, stale-lease cleanup, sanitized job event path, backend runtime message path, and worker claim path;
- private invoke target resolution path, audience path, identity-token path, auth-header creation path, timeout policy, retry policy, and response classifier;
- `qwen_fixture_visual_metadata_v1` request envelope and response parser compatibility;
- fail-closed rollback for invalid schema, disabled inference response, timeout, service failure, stale lease, duplicate source, partial result, cleanup failure, and credit release/refund handoff.

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

The plan preserves these rules:

- structured findings and edit intents must feed approved snapshots before worker execution
- private storage object records, manifests, checksums, and approved snapshot refs are source-of-truth inputs
- signed URLs and public URLs are not source of truth
- frontend code must not claim jobs, resolve private invoke credentials, call Cloud Run, or create generated assets
- Qwen remains visual understanding and visual QA metadata only
- Qwen must not generate B-roll video, render, export, replace deterministic OCR, or publish artifacts

## Runtime Posture

- selected GPU: `nvidia_l4`
- cost posture: `scale_to_zero_required`
- minimum instances: 0
- initial max instances: 1
- CPU fallback allowed: false

NVIDIA L4 remains the cost-controlled target because it supports bounded Qwen visual-analysis requests while preserving a scale-to-zero posture. This plan does not resize, deploy, warm, invoke, or otherwise mutate the service.

## Runtime Flags

- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeReadinessReviewAccepted=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionPlanRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionPlanRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionApprovalRequired=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixturePrivateInvokeExecutionApprovalRecorded=false`
- `approvedFixtureSelectionPlanned=true`
- `approvedSnapshotBindingPlanned=true`
- `persistedJobReferencePlanned=true`
- `idempotencyGuardPlanned=true`
- `transactionalLeaseClaimPlanned=true`
- `sanitizedRuntimeEventPlanned=true`
- `workerClaimHandoffPlanned=true`
- `privateInvokeTransportPlanned=true`
- `cloudRunL4RequestPlanned=true`
- `qwenRuntimeBoundaryPlanned=true`
- `responseSchemaHandlingPlanned=true`
- `qaAuditCostCreditNoSpendPlanned=true`
- `cleanupRollbackRetryPlanned=true`
- `selectedGpuL4Accepted=true`
- `scaleToZeroCostPostureAccepted=true`
- `minInstancesZeroAccepted=true`
- `initialMaxInstancesOneAccepted=true`
- `cpuFallbackDisabledAccepted=true`
- `readyForApprovedFixturePrivateInvokeExecutionApproval=true`
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

## Remaining Blockers

- approved-fixture private invoke execution approval required: true
- execution approval recorded: false
- ready for real worker dispatch: false
- private invoke ready: false
- approved fixture private invoke approved now: false
- Qwen inference accepted now: false
- generated asset creation accepted: false
- Supabase persistence accepted: false
- credit spend accepted: false
- beta ready: false
- production ready: false

This execution plan advances the Qwen tool toward controlled external agent execution by defining the exact future attempt envelope. It still requires an explicit approval packet, a repeated preflight, a separately recorded attempt result, and a result review before any runtime claim can advance.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58DH-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVED-FIXTURE-PRIVATE-INVOKE-EXECUTION-APPROVAL: approve one bounded approved-fixture private invoke execution plan through the persisted job and lease bridge, no Cloud Run invocation/no inference/no generated assets/no beta`
