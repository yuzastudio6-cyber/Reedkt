# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Execution Plan

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_execution_plan_recorded_execution_approval_required`.

This packet records the first controlled real-dispatch execution plan for the persisted Qwen worker runtime. It translates the accepted real-dispatch approval decision into an exact future execution envelope that must be separately approved before any real persisted worker dispatch attempt can run.

This is execution planning only. It does not approve execution now, create jobs, claim leases, create idempotency rows, create job events, create backend runtime messages, mutate Supabase, run SQL, resolve service URLs, fetch identity tokens, create auth headers, invoke Cloud Run, import or load Qwen, initialize vLLM, run inference, dispatch workers, upload storage objects, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Reviewed Evidence

- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-decision.md`
- `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-decision.ts`
- `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-decision-smoke.ts`
- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-plan.md`
- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-execution-attempt-result-review.md`
- `src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts`
- `approved-plan-snapshot-policy.md`
- `editing-agent-execution-architecture.md`
- `async-edit-work-graph.md`
- `editing-asset-manifest.md`
- `model-routing-policy.md`

## Plan Outcome

- real-dispatch approval decision accepted for execution planning: true
- controlled real-dispatch execution plan recorded: true
- controlled real-dispatch execution approval required: true
- real worker dispatch approved now: false
- worker lease claim approved now: false
- Cloud Run invocation approved now: false
- Qwen inference approved now: false
- generated asset creation approved now: false
- beta readiness advanced: false
- production readiness advanced: false

## First Real-Dispatch Execution Envelope

| Step | Future behavior | Current execution allowed |
| --- | --- | --- |
| approved snapshot fixture intake | Load one immutable approved fixture snapshot with compiled intent, structured findings, edit intents, timing refs, private source refs, worker graph, and Qwen visual metadata scope. | false |
| credit reservation no-spend check | Verify credit estimate and reservation for the exact snapshot while keeping spend blocked until accepted result, QA, audit, and cost evidence exist. | false |
| private source-of-truth refs | Require private storage object records, private path refs, manifests, checksums, approved snapshot refs, and reject signed/public URLs as source of truth. | false |
| idempotency duplicate-source guard | Bind one idempotency key to workspace, project, approved snapshot, job type, runtime target, private source refs, and request hash before lease claim. | false |
| backend-only service-role lease claim | Plan a single eligible Qwen job lease claim through backend service-role runtime code with timeout, retry, stale-lease cleanup, and conflict handling. | false |
| Qwen request envelope build | Build bounded visual-understanding or visual-QA request metadata from persisted source refs only, excluding raw chat and raw prompt payloads. | false |
| private invoke credential resolution | Resolve service target, audience, identity token, auth header, timeout, retry, and response classification only in a later approved backend execution gate. | false |
| Cloud Run L4 invocation attempt | Plan one private Cloud Run GPU request against NVIDIA L4 scale-to-zero runtime with min instances 0 and initial max instances 1. | false |
| result validation and persistence | Require `qwen_fixture_visual_metadata_v1` parser compatibility before any sanitized result metadata can be accepted. Generated assets, storage writes, signed URLs, and public artifacts stay blocked. | false |
| QA audit cost cleanup credit handoff | Plan sanitized QA, audit, cost, cleanup, rollback, and credit release/refund/spend-eligibility evidence after result handling. | false |

## Execution Approval Preconditions

Before any future real-dispatch execution approval can allow a private invoke, that approval must re-check:

- approved snapshot id, checksum, immutable plan version, structured findings, edit intents, timing, source-order refs, private source refs, and worker graph;
- credit estimate and no-spend reservation tied to the exact approved snapshot version;
- private source refs, private storage object records, private path expectations, manifests, checksums, and access scope;
- Qwen worker runtime config, selected GPU, min instances, max instances, timeout, retry budget, and scale-to-zero posture;
- service-role backend lease claim path, idempotency key, duplicate-source rejection, stale-claim cleanup, and sanitized event paths;
- private Cloud Run target, service account, audience, identity-token path, auth-header creation path, timeout policy, and no-frontend invocation proof;
- request envelope and response parser compatibility for `qwen_fixture_visual_metadata_v1`;
- rollback plan for failed invoke, partial result, invalid schema, timeout, stale lease, duplicate source mismatch, cleanup failure, and credit release/refund handoff.

## Runtime Posture

- selected GPU: `nvidia_l4`
- cost posture: `scale_to_zero_required`
- minimum instances: 0
- initial max instances: 1
- CPU fallback allowed: false

NVIDIA L4 remains the cost-friendly Cloud Run GPU target for bounded Qwen visual-analysis requests that run only when invoked and scale down when idle.

## Source-Of-Truth Rules

- Workers execute approved snapshots, not raw chat.
- Structured findings and edit intents must feed approved snapshots before worker execution.
- Signed URLs and public URLs are not source of truth.
- Private storage object records, manifests, checksums, and approved snapshot refs are source-of-truth inputs.
- Frontend/browser code must not claim jobs, resolve private invoke credentials, call Cloud Run, or create generated assets.
- Qwen is visual understanding and visual QA metadata only; it must not generate B-roll video, render, export, replace deterministic OCR, or act as a public artifact source.

## Runtime Gates

- `controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecisionAccepted=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPlanRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPlanRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionApprovalRequired=true`
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

`QWEN2_5_VL_STACK_TOOL_58CC-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-EXECUTION-APPROVAL: approve first real persisted Qwen worker dispatch execution plan, no Cloud Run invocation/no inference/no generated assets/no beta`
