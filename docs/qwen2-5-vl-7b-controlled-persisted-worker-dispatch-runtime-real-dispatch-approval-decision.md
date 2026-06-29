# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Approval Decision

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approval_decision_accepted_execution_plan_required`.

This packet records the real-dispatch approval decision for the controlled persisted Qwen worker runtime. It accepts the 58BZ real-dispatch approval plan for planning the first controlled real-dispatch execution plan only.

This is approval-decision metadata only. It does not approve real dispatch now, claim jobs, create leases, create idempotency rows, create job events, create backend runtime messages, mutate Supabase, run SQL, resolve service URLs, fetch identity tokens, create auth headers, invoke Cloud Run, import or load Qwen, initialize vLLM, run inference, dispatch workers, upload storage objects, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Reviewed Evidence

- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-plan.md`
- `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-plan.ts`
- `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-plan-smoke.ts`
- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-execution-attempt-result-review.md`
- `src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts`
- `approved-plan-snapshot-policy.md`
- `editing-agent-execution-architecture.md`
- `async-edit-work-graph.md`
- `editing-asset-manifest.md`
- `model-routing-policy.md`

## Decision Outcome

- real-dispatch approval plan accepted: true
- real-dispatch approval decision recorded: true
- accepted for execution planning only: true
- controlled real-dispatch execution plan required: true
- real worker dispatch approved now: false
- worker lease claim approved now: false
- Cloud Run invocation approved now: false
- Qwen inference approved now: false
- generated asset creation approved now: false
- beta readiness advanced: false
- production readiness advanced: false

## Accepted Real-Dispatch Approval Evidence

| Evidence area | Decision | Execution allowed now |
| --- | --- | --- |
| approved snapshot fixture scope | accepted for execution planning | false |
| credit reservation no-spend precondition | accepted for execution planning | false |
| service-role job lease claim scope | accepted for execution planning | false |
| idempotency duplicate source guard | accepted for execution planning | false |
| private invoke transport execution conditions | accepted for execution planning | false |
| Qwen request and response schema | accepted for execution planning | false |
| result persistence without generated assets | accepted for execution planning | false |
| QA, audit, cost, and observability | accepted for execution planning | false |
| rollback, cleanup, and credit release | accepted for execution planning | false |
| beta, production, and public artifact lock | accepted for execution planning | false |

## Required Controlled Real-Dispatch Execution Plan

The next execution plan must define a bounded first real persisted Qwen worker dispatch attempt without running it:

- approved snapshot fixture scope, immutable plan version, structured findings, edit intents, timing refs, private source refs, and worker execution graph;
- credit estimate and no-spend reservation precondition tied to the exact approved snapshot;
- service-role-only single job lease claim, timeout, retry, stale-lease cleanup, conflict handling, and idempotency duplicate-source guard;
- backend-only private invoke service URL, audience, identity-token, and auth-header resolution rules for a private Cloud Run target;
- Qwen request envelope and `qwen_fixture_visual_metadata_v1` response parser requirements;
- result persistence rules that allow only approved metadata rows and keep generated assets, storage writes, public artifacts, and signed URLs blocked;
- QA, audit, cost, rollback, cleanup, and credit release handoff evidence;
- explicit beta, production, arbitrary media, public artifact, and generated asset locks.

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
- Real-dispatch execution planning remains scoped to bounded Qwen visual-analysis metadata and does not authorize generated media, render/export, or beta.

## Runtime Gates

- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalPlanAccepted=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecisionRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecisionRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecisionAcceptedForExecutionPlanning=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPlanRequired=true`
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

`QWEN2_5_VL_STACK_TOOL_58CB-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-EXECUTION-PLAN: plan first real persisted Qwen worker dispatch attempt, no generated assets/no beta`
