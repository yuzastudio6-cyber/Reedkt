# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Approval Plan

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approval_plan_recorded_approval_decision_required`.

This packet plans the next real-dispatch approval gate for the controlled persisted Qwen worker runtime. It accepts the previous approved-fixture execution attempt result review as fail-closed evidence, then defines the exact evidence required before any later prompt can decide whether to approve the first real persisted Qwen worker dispatch.

This is approval planning only. It does not approve real dispatch now, claim jobs, create leases, create idempotency rows, create job events, create backend runtime messages, mutate Supabase, run SQL, resolve service URLs, fetch identity tokens, create auth headers, invoke Cloud Run, import or load Qwen, initialize vLLM, run inference, dispatch workers, upload storage objects, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Reviewed Evidence

- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-execution-attempt-result-review.md`
- `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-attempt-result-review.ts`
- `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-attempt-result-review-smoke.ts`
- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-execution-attempt-result.md`
- `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-attempt-result.ts`
- `src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts`
- `approved-plan-snapshot-policy.md`
- `editing-agent-execution-architecture.md`
- `async-edit-work-graph.md`
- `editing-asset-manifest.md`
- `model-routing-policy.md`

## Approval Plan Outcome

- fail-closed execution attempt result review accepted: true
- approved fixture attempt only: true
- real-dispatch approval plan recorded: true
- real-dispatch approval decision required: true
- real worker dispatch approved now: false
- worker lease claim approved now: false
- Cloud Run invocation approved now: false
- Qwen inference approved now: false
- generated asset creation approved now: false
- beta readiness advanced: false
- production readiness advanced: false

## Accepted Preconditions

- default runtime lease boundary accepted: `blocked_real_lease_backend_required`
- adapter-preview boundary accepted: `blocked_qwen_dispatch_adapter_fail_closed`
- transport-preview boundary accepted: `blocked_private_invoke_transport_preview_only`
- transport-preview reached all runtime boundaries: true
- selected GPU accepted: `nvidia_l4`
- scale-to-zero cost posture accepted: true
- signed URLs remain non-source-of-truth: true
- generated asset non-creation accepted: true
- Cloud Run non-invocation accepted: true
- Qwen inference non-execution accepted: true

## Required Real-Dispatch Approval Evidence

| Evidence area | Owner boundary | Required evidence | Execution allowed by this plan |
| --- | --- | --- | --- |
| approved snapshot fixture scope | `SUPABASE_RLS_STORAGE_DATABASE` | approved plan snapshot id, immutable approved fixture plan version, compiled intent, structured findings, edit intents, timing refs, private source refs, and worker execution graph | false |
| credit reservation no-spend precondition | `BILLING_STRIPE_CREDITS` | credit estimate and reservation tied to the exact approved snapshot version, bounded Qwen visual-analysis scope, and spend blocked until accepted result, QA, and cost evidence exist | false |
| service-role job lease claim scope | `WORKER_RUNTIME_JOBS` | backend-only service-role code may claim exactly one eligible Qwen job lease with timeout, retry, stale-lease cleanup, and conflict handling | false |
| idempotency duplicate source guard | `WORKER_RUNTIME_JOBS` | idempotency key binds workspace, project, approved snapshot, job type, attempt scope, and private source refs; duplicate source mismatch blocks before private invoke | false |
| private invoke transport execution conditions | `PROVIDER_GATEWAY_MODELS` | backend-only service URL, audience, identity token, and auth header resolution after approval; private Cloud Run service; no frontend invocation or secret exposure | false |
| Qwen request and response schema | `AI_VIDEO_BROLL_GENERATION` | request envelope includes approved snapshot, source frame refs, schema version, and bounded fixture scope; response must be compatible with `qwen_fixture_visual_metadata_v1` | false |
| result persistence without generated assets | `SUPABASE_RLS_STORAGE_DATABASE` | runtime may create only approved job/runtime/audit/QA metadata rows after successful approval; generated assets, public artifacts, storage writes, and signed URLs remain blocked | false |
| QA, audit, cost, and observability | `OBSERVABILITY_AUDIT_COST` | output schema confidence, source frame refs, blocked action counts, raw-output exclusion, sanitized audit events, and cost evidence tied to approved snapshot/job/lease/idempotency refs | false |
| rollback, cleanup, and credit release | `WORKER_RUNTIME_JOBS` | failed dispatch attempt releases or preserves leases according to retry policy, preserves idempotency/source refs, and hands off credit release/refund rules without spend | false |
| beta, production, and public artifact lock | `AI_VIDEO_BROLL_GENERATION` | real-dispatch approval must not unlock beta, production, arbitrary media, public artifacts, generated assets, or `generated_local_fixture_passed` | false |

## Runtime Posture

- selected GPU: `nvidia_l4`
- cost posture: `scale_to_zero_required`
- minimum instances: 0
- initial max instances: 1
- CPU fallback allowed: false

NVIDIA L4 remains the cost-friendly Cloud Run GPU target for bounded Qwen visual-analysis requests that should run only when invoked and scale down when idle.

## Source-Of-Truth Rules

- Workers execute approved snapshots, not raw chat.
- Structured findings and edit intents must feed approved snapshots before worker execution.
- Signed URLs and public URLs are not source of truth.
- Private storage object records, manifests, checksums, and approved snapshot refs are source-of-truth inputs.
- Frontend/browser code must not claim jobs, resolve private invoke credentials, call Cloud Run, create generated assets, create public artifacts, or create signed URLs.
- Real-dispatch approval, if granted later, remains scoped to bounded Qwen visual-analysis metadata and does not authorize generated media, render/export, or beta.

## Runtime Gates

- `controlledPersistedWorkerDispatchRuntimeExecutionAttemptResultReviewAccepted=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalPlanRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalPlanRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecisionRequired=true`
- `approvedSnapshotFixtureScopePlanned=true`
- `creditReservationNoSpendPreconditionPlanned=true`
- `serviceRoleJobLeaseClaimScopePlanned=true`
- `idempotencyDuplicateSourceGuardPlanned=true`
- `privateInvokeTransportExecutionConditionsPlanned=true`
- `qwenRequestResponseSchemaPlanned=true`
- `resultPersistenceWithoutGeneratedAssetsPlanned=true`
- `qaAuditCostObservabilityPlanned=true`
- `rollbackCleanupCreditReleasePlanned=true`
- `betaProductionPublicArtifactLockPlanned=true`
- `selectedGpuL4Accepted=true`
- `scaleToZeroCostPostureAccepted=true`
- `readyForRealWorkerDispatch=false`
- `realDispatchApprovalDecisionRecorded=false`
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

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58CA-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVAL-DECISION: decide real persisted Qwen worker dispatch runtime approval, no generated assets/no beta`
