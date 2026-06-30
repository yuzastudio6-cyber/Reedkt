# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Transport Readiness Plan

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_readiness_plan_recorded_approval_required`.

This packet plans the controlled Qwen real-dispatch transport readiness gate after the approved-fixture-only transport dependency enablement execution attempt result review. It accepts that result review as fail-closed evidence, then defines the exact approved snapshot, private source-of-truth, service URL/audience, identity-token, private request, response classification, persistence, QA/audit/cost/credit, retry, cleanup, rollback, and beta/production lock evidence required before any later prompt may approve transport readiness.

This is transport readiness planning only. It does not enable live transport dependencies, create a real job, claim a real lease, create idempotency rows, create job events, create backend runtime messages, resolve service URLs, resolve audiences, fetch identity tokens, create auth headers, send private requests, invoke Cloud Run, import or load Qwen, initialize vLLM, run inference, persist output, dispatch workers, mutate Supabase, execute SQL, upload storage objects, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Reviewed Evidence

- transport dependency enablement execution attempt result review: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-attempt-result-review.md`
- transport dependency enablement execution attempt result review spec: `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-attempt-result-review.ts`
- transport dependency enablement execution attempt result review smoke: `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-attempt-result-review-smoke.ts`
- transport dependency enablement execution attempt result: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-attempt-result.md`
- private invoke transport adapter: `src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter.ts`
- private invoke envelope: `src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-envelope.ts`
- private invoke response classifier: `src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-response.ts`
- approved queue fixture: `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract.ts`

## Plan Outcome

- transport dependency enablement execution attempt result review accepted: true
- transport readiness plan recorded: true
- transport readiness approval required: true
- transport dependencies enabled now: false
- real worker dispatch ready now: false
- Cloud Run invocation ready now: false
- Qwen inference ready now: false
- generated asset creation ready now: false
- beta readiness advanced: false
- production readiness advanced: false

## Transport Readiness Plan

| Readiness area | Required evidence before readiness approval | Current execution allowed |
| --- | --- | --- |
| approved snapshot transport scope | Future transport may use only approved snapshot ids, approved queue fixtures, private source refs, and idempotency refs. Raw chat and raw worker prompts stay rejected. | false |
| service URL and audience resolution | Backend-only resolver maps the approved target to private Cloud Run service metadata and derives audience without exposing values to frontend payloads. | false |
| identity token and auth header | Backend-only identity-token dependency can mint an audience-bound token, and auth headers stay request-local and never persisted. | false |
| private request send | Future request send uses the approved private invoke envelope, bounded timeout, idempotency scope, and retry-aware worker runtime path. | false |
| response classification and persistence | Response classification separates auth, timeout, unavailable service, invalid runtime response, disabled inference, and future metadata-only output; persistence still needs approval. | false |
| QA, audit, cost, and credit readiness | Sanitized QA, audit, cost, and credit evidence ties to job, lease, idempotency, approved snapshot, and private source refs. | false |
| billing credit no-spend boundary | Future transport approval may reference a no-spend precondition, but no credit spend, refund, release, reservation mutation, or Stripe action is allowed here. | false |
| retry, timeout, cleanup, and rollback | Timeouts, auth failures, retryable transport failures, and unexpected responses have deterministic lease cleanup and idempotency behavior. | false |
| beta and production public-artifact lock | Transport readiness does not unlock arbitrary user media, generated assets, public artifacts, signed URLs, beta, production, or `generated_local_fixture_passed`. | false |

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

- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionAttemptResultReviewAccepted=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportReadinessPlanRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportReadinessPlanRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportReadinessApprovalRequired=true`
- `approvedSnapshotTransportScopePlanned=true`
- `serviceUrlAudienceResolutionPlanned=true`
- `identityTokenAuthHeaderPlanned=true`
- `privateRequestSendPlanned=true`
- `responseClassificationPersistencePlanned=true`
- `qaAuditCostCreditReadinessPlanned=true`
- `billingCreditNoSpendBoundaryPlanned=true`
- `retryTimeoutCleanupRollbackPlanned=true`
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

`QWEN2_5_VL_STACK_TOOL_58CQ-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-READINESS-APPROVAL: approve controlled Qwen real-dispatch transport readiness, no Cloud Run invocation/no inference/no generated assets/no beta`
