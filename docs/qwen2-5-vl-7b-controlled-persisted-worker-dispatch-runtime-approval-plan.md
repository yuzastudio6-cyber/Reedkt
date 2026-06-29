# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Approval Plan

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_approval_plan_recorded_approval_decision_required`.

This packet plans the controlled persisted Qwen worker dispatch runtime approval gate. It translates the accepted fail-closed runtime smoke result into exact approval evidence that must exist before any future real worker dispatch attempt.

This is approval planning only. It does not approve execution now, create real persisted rows, run SQL, mutate Supabase cloud, deploy migrations, resolve service URLs, fetch identity tokens, create auth headers, invoke Cloud Run, import or load Qwen, initialize vLLM, run inference, dispatch workers, upload storage objects, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Reviewed Evidence

- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-smoke-result-review.md`
- `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-result-review.ts`
- `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-result-review-smoke.ts`
- `src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts`
- `approved-plan-snapshot-policy.md`
- `editing-agent-execution-architecture.md`
- `async-edit-work-graph.md`
- `editing-asset-manifest.md`
- `model-routing-policy.md`

## Approval Plan Outcome

- runtime smoke result review accepted: true
- runtime approval plan recorded: true
- runtime approval decision required: true
- real worker dispatch approved now: false
- Cloud Run invocation approved now: false
- Qwen inference approved now: false
- generated asset creation approved now: false
- beta readiness advanced: false
- production readiness advanced: false

## Required Runtime Approval Evidence

| Evidence area | Owner boundary | Required evidence | Execution allowed by this plan |
| --- | --- | --- | --- |
| approved plan snapshot source of truth | `SUPABASE_RLS_STORAGE_DATABASE` | approved plan snapshot id, immutable approved plan version, compiled intent, structured findings, edit intents, timing, asset manifest refs, provider policy, and worker execution graph | false |
| credit reservation source of truth | `BILLING_STRIPE_CREDITS` | credit estimate and reservation tied to the exact approved snapshot version, with spend/release/refund still fail-closed until result evidence exists | false |
| private source-of-truth refs | `SUPABASE_RLS_STORAGE_DATABASE` | private storage object records, manifests, checksums, approved snapshot refs, and explicit rejection of signed/public URL source-of-truth | false |
| service-role lease and claim mutation | `WORKER_RUNTIME_JOBS` | backend-only service-role claim path, lease timeout, retry count, conflict handling, and cleanup | false |
| idempotency and duplicate guard | `WORKER_RUNTIME_JOBS` | idempotency key bound to workspace, project, approved snapshot, job type, and private source refs; duplicate source mismatch blocks before Cloud Run invocation | false |
| private invoke transport dependencies | `PROVIDER_GATEWAY_MODELS` | backend-only service URL, audience, identity token, and auth header resolution after approval; private Cloud Run service; no frontend invocation | false |
| QA, audit, cost, and credit evidence | `OBSERVABILITY_AUDIT_COST` | Qwen output schema, confidence, source frame refs, raw-output exclusion, sanitized audit/cost events, and spend block until accepted result and QA evidence | false |
| rollback and fail-closed behavior | `AI_VIDEO_BROLL_GENERATION` | all missing prerequisite paths block before Cloud Run invocation; failed private invoke creates no generated asset row or public artifact; rollback preserves source-of-truth and credit rules | false |

## Runtime Posture

- selected GPU: `nvidia_l4`
- cost posture: `scale_to_zero_required`
- minimum instances: 0
- initial max instances: 1
- CPU fallback allowed: false

NVIDIA L4 remains the cost-friendly Cloud Run GPU target for bounded Qwen visual-analysis requests that should run only when invoked and scale down when idle.

## Worker Source-Of-Truth Rules

- Workers execute approved snapshots, not raw chat.
- Structured findings and edit intents must feed approved snapshots before worker execution.
- Signed URLs and public URLs are not source of truth.
- Private storage object records, manifests, checksums, and approved snapshot refs are source-of-truth inputs.
- Frontend/browser code must not claim jobs, resolve private invoke credentials, call Cloud Run, or create generated assets.

## Runtime Gates

- `controlledPersistedWorkerDispatchRuntimeSmokeResultReviewAccepted=true`
- `controlledPersistedWorkerDispatchRuntimeApprovalPlanRequired=false`
- `controlledPersistedWorkerDispatchRuntimeApprovalPlanRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeApprovalDecisionRequired=true`
- `approvedSnapshotApprovalPlanned=true`
- `creditReservationApprovalPlanned=true`
- `privateSourceOfTruthRefsApprovalPlanned=true`
- `serviceRoleLeaseClaimApprovalPlanned=true`
- `idempotencyApprovalPlanned=true`
- `privateInvokeTransportApprovalPlanned=true`
- `qaAuditCostCreditApprovalPlanned=true`
- `rollbackFailClosedApprovalPlanned=true`
- `selectedGpuL4Accepted=true`
- `scaleToZeroCostPostureAccepted=true`
- `readyForRealWorkerDispatch=false`
- `runtimeApprovalDecisionRecorded=false`
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

`QWEN2_5_VL_STACK_TOOL_58BT-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-APPROVAL-DECISION: decide controlled persisted Qwen worker dispatch runtime approval, no Cloud Run invocation/no inference/no assets/no beta`
