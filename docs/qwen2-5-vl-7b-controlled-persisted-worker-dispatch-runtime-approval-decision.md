# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Approval Decision

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_approval_decision_accepted_execution_plan_required`.

This packet records the controlled persisted Qwen worker dispatch runtime approval decision. The approval-plan evidence is accepted for a future controlled runtime execution plan only. It does not approve execution now, create persisted rows, run SQL, mutate Supabase cloud, deploy migrations, resolve service URLs, fetch identity tokens, create auth headers, invoke Cloud Run, import or load Qwen, initialize vLLM, run inference, dispatch workers, upload storage objects, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Reviewed Evidence

- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-approval-plan.md`
- `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-approval-plan.ts`
- `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-approval-plan-smoke.ts`
- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-smoke-result-review.md`
- `src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts`
- `approved-plan-snapshot-policy.md`
- `editing-agent-execution-architecture.md`
- `async-edit-work-graph.md`
- `editing-asset-manifest.md`
- `model-routing-policy.md`

## Decision Outcome

- runtime approval plan accepted for future execution planning: true
- controlled runtime execution plan required: true
- real worker dispatch approved now: false
- Cloud Run invocation approved now: false
- Qwen inference approved now: false
- generated asset creation approved now: false
- beta readiness advanced: false
- production readiness advanced: false

## Accepted Runtime Approval Evidence

| Evidence area | Owner boundary | Decision | Execution allowed now |
| --- | --- | --- | --- |
| approved plan snapshot source of truth | `SUPABASE_RLS_STORAGE_DATABASE` | accepted for future controlled execution planning | false |
| credit reservation source of truth | `BILLING_STRIPE_CREDITS` | accepted for future controlled execution planning | false |
| private source-of-truth refs | `SUPABASE_RLS_STORAGE_DATABASE` | accepted for future controlled execution planning | false |
| service-role lease and claim mutation | `WORKER_RUNTIME_JOBS` | accepted for future controlled execution planning | false |
| idempotency and duplicate guard | `WORKER_RUNTIME_JOBS` | accepted for future controlled execution planning | false |
| private invoke transport dependencies | `PROVIDER_GATEWAY_MODELS` | accepted for future controlled execution planning | false |
| QA, audit, cost, and credit evidence | `OBSERVABILITY_AUDIT_COST` | accepted for future controlled execution planning | false |
| rollback and fail-closed behavior | `AI_VIDEO_BROLL_GENERATION` | accepted for future controlled execution planning | false |

## Required Controlled Runtime Execution Plan

The next plan must define a bounded no-beta execution envelope before any live private invoke attempt:

- exact approved snapshot and immutable plan version intake;
- exact credit estimate, reservation, and no-spend precondition;
- private storage object record, manifest, checksum, and source media references;
- backend-only service-role lease claim path with idempotency and duplicate-source guards;
- private Cloud Run invocation dependency resolution that happens only inside backend runtime code;
- Qwen request and response schema, raw-output exclusion, QA acceptance criteria, audit events, and cost evidence;
- failure, timeout, retry, cleanup, credit release/refund, and rollback behavior;
- proof that no frontend path can call Cloud Run, resolve credentials, create generated assets, create public artifacts, create signed URLs, or dispatch workers.

## Runtime Posture

- selected GPU: `nvidia_l4`
- cost posture: `scale_to_zero_required`
- minimum instances: 0
- initial max instances: 1
- CPU fallback allowed: false

NVIDIA L4 remains the cost-friendly Cloud Run GPU target for bounded Qwen visual-analysis requests that run only when invoked and scale down when idle.

## Worker Source-Of-Truth Rules

- Workers execute approved snapshots, not raw chat.
- Structured findings and edit intents must feed approved snapshots before worker execution.
- Signed URLs and public URLs are not source of truth.
- Private storage object records, manifests, checksums, and approved snapshot refs are source-of-truth inputs.
- Frontend/browser code must not claim jobs, resolve private invoke credentials, call Cloud Run, or create generated assets.

## Runtime Gates

- `controlledPersistedWorkerDispatchRuntimeApprovalDecisionRequired=false`
- `controlledPersistedWorkerDispatchRuntimeApprovalDecisionRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeApprovalDecisionAcceptedForExecutionPlanning=true`
- `controlledPersistedWorkerDispatchRuntimeExecutionPlanRequired=true`
- `readyForRealWorkerDispatch=false`
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

`QWEN2_5_VL_STACK_TOOL_58BU-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-EXECUTION-PLAN: plan controlled persisted Qwen worker dispatch runtime execution, no Cloud Run invocation/no inference/no assets/no beta`
