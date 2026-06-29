# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Transport Dependency Enablement Plan

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_dependency_enablement_plan_recorded_approval_required`.

This packet plans the controlled backend dependencies needed before the Qwen persisted worker runtime can move from fail-closed preview boundaries toward a future real-dispatch transport execution approval. It accepts the first real-dispatch execution attempt result review as fail-closed evidence, then defines the exact service-role lease, Qwen dispatch adapter, private invoke transport dependency, response classification, QA/audit/cost/credit, and cleanup evidence required before any later prompt may approve dependency enablement.

This is dependency enablement planning only. It does not enable the dependencies now, create a real job, claim a real lease, create idempotency rows, create job events, create backend runtime messages, resolve service URLs, fetch identity tokens, create auth headers, invoke Cloud Run, import or load Qwen, initialize vLLM, run inference, dispatch workers, mutate Supabase, execute SQL, upload storage objects, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Reviewed Evidence

- real-dispatch execution attempt result review: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result-review.md`
- real-dispatch execution attempt result review spec: `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result-review.ts`
- real-dispatch execution attempt result review smoke: `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result-review-smoke.ts`
- real-dispatch execution attempt result: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result.md`
- runtime implementation: `src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts`
- fail-closed dispatch adapter: `src/backend/workers/qwen2-5-vl-cloud-run-gpu-dispatch-adapter.ts`
- private invoke transport adapter: `src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter.ts`
- private invoke envelope: `src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-envelope.ts`
- private invoke response classifier: `src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-response.ts`
- approved queue fixture: `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract.ts`

## Plan Outcome

- real-dispatch attempt result review accepted: true
- transport dependency enablement plan recorded: true
- transport dependency enablement approval required: true
- dependencies enabled now: false
- real worker dispatch ready now: false
- Cloud Run invocation ready now: false
- Qwen inference ready now: false
- generated asset creation ready now: false
- beta readiness advanced: false
- production readiness advanced: false

## Dependency Enablement Plan

| Dependency area | Required evidence before enablement approval | Current execution allowed |
| --- | --- | --- |
| service-role lease and claim dependency | Backend-only runtime path can claim exactly one eligible Qwen job lease for an approved snapshot; stale lease, retry, conflict, and duplicate-source behavior are deterministic. | false |
| idempotency and runtime message dependency | Idempotency rows, backend runtime messages, worker claim attempts, and job events must stay sanitized, approved-snapshot scoped, and rollback-safe. | false |
| Qwen dispatch adapter dependency | The fail-closed adapter must be converted through an approval gate into a bounded adapter that accepts only validated local queue contracts and approved snapshot refs. | false |
| private invoke envelope dependency | Envelope builder must keep raw chat, raw worker prompts, public URLs, signed URLs, and generated asset instructions out of the runtime payload. | false |
| private invoke transport dependency | Backend must inject service URL, audience, identity token, and request-sending dependencies only after approval; frontend/browser code must never resolve or hold those values. | false |
| response classification dependency | Private invoke response classification must distinguish fail-closed contract responses, valid fixture metadata, invalid schema, timeout, auth failure, and retryable transport failure. | false |
| QA, audit, cost, and credit dependency | Sanitized QA, audit, cost, credit release/refund/spend-eligibility, and observability evidence must be tied to job, lease, idempotency, approved snapshot, and private source refs. | false |
| cleanup and rollback dependency | Failed attempts must release or preserve leases according to retry policy, preserve idempotency/source refs, and avoid duplicate Cloud Run requests. | false |
| beta and production lock dependency | Dependency enablement must not unlock arbitrary user media, generated assets, public artifacts, signed URLs, beta, production, or `generated_local_fixture_passed`. | false |

## Runtime Posture

- selected runtime: `google_cloud_run_gpu`
- selected GPU: `nvidia_l4`
- cost posture: `scale_to_zero_required`
- minimum instances: 0
- initial max instances: 1
- CPU fallback allowed: false

NVIDIA L4 remains the cost-friendly Cloud Run GPU target for bounded Qwen visual-analysis requests that run only when invoked and scale down when idle.

## Source-Of-Truth Rules

- Workers execute approved snapshots, not raw chat.
- Structured findings and edit intents feed approved snapshots before worker execution.
- Signed URLs and public URLs are not source of truth.
- Private storage object records, manifests, checksums, approved snapshot refs, job refs, lease refs, and idempotency refs are source-of-truth inputs.
- Qwen remains visual understanding and visual QA metadata only.
- Qwen must not generate B-roll video, render, export, replace deterministic OCR, replace deterministic frame sampling, create public artifacts, create signed URLs, or become a browser-facing runtime.

## Runtime Flags

- `controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptResultReviewAccepted=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPlanRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPlanRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementApprovalRequired=true`
- `serviceRoleLeaseClaimDependencyPlanned=true`
- `idempotencyRuntimeMessageDependencyPlanned=true`
- `qwenDispatchAdapterDependencyPlanned=true`
- `privateInvokeEnvelopeDependencyPlanned=true`
- `privateInvokeTransportDependencyPlanned=true`
- `responseClassificationDependencyPlanned=true`
- `qaAuditCostCreditDependencyPlanned=true`
- `cleanupRollbackDependencyPlanned=true`
- `betaProductionPublicArtifactLockPlanned=true`
- `selectedGpuL4Accepted=true`
- `scaleToZeroCostPostureAccepted=true`
- `minInstancesZeroAccepted=true`
- `initialMaxInstancesOneAccepted=true`
- `cpuFallbackDisabledAccepted=true`
- `readyForRealWorkerDispatch=false`
- `transportDependenciesEnabledNow=false`
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

`QWEN2_5_VL_STACK_TOOL_58CH-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-DEPENDENCY-ENABLEMENT-APPROVAL: approve controlled Qwen real-dispatch lease adapter and private invoke transport dependency enablement, no generated assets/no beta`
