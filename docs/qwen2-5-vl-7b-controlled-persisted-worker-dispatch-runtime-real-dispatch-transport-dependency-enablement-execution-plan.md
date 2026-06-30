# Qwen2.5-VL Controlled Real-Dispatch Transport Dependency Enablement Execution Plan

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_dependency_enablement_execution_plan_recorded_execution_approval_required`.

This packet records the controlled execution plan for future Qwen2.5-VL real-dispatch transport dependency enablement. It follows the preflight that verified the implementation surfaces, but it does not enable those dependencies now. The plan exists so a later approval prompt can decide whether the exact enablement sequence is acceptable.

This is not runtime execution. It does not enable dependencies now, create a real job, claim a real lease, create idempotency rows, create job events, create backend runtime messages, create worker claims, create storage object records, create signed URL events, create QA rows, create audit rows, mutate credits, resolve service URLs, resolve audiences, fetch identity tokens, create auth headers, invoke Cloud Run, import Qwen, load Qwen, initialize vLLM, process prompts, run a forward pass, run inference, call providers, dispatch workers, touch Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, process media, render/export, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Execution-plan status

- transport dependency enablement preflight accepted for execution planning: true
- transport dependency enablement execution plan recorded: true
- transport dependency enablement execution approval required: true
- dependencies enabled now: false
- real backend lease claim approved now: false
- injected private invoke dependencies approved now: false
- service URL resolution approved now: false
- audience resolution approved now: false
- identity token fetch approved now: false
- private request send approved now: false
- Cloud Run invocation approved now: false
- Qwen inference approved now: false
- generated assets approved now: false
- beta approved now: false
- production approved now: false

## Runtime posture

- selected platform: `google_cloud_run_gpu`
- selected GPU: `nvidia_l4`
- region: `us-central1`
- service name: `reeditpro-qwen2-5-vl-l4-worker`
- cost posture: `scale_to_zero_required`
- minimum instances: 0
- initial max instances: 1
- CPU fallback allowed: false

The selected GPU posture remains the cost-controlled path: Cloud Run GPU with NVIDIA L4, minimum instances zero, initial maximum one, and no CPU fallback. This plan does not keep a GPU instance hot and does not invoke the GPU service.

## Planned enablement sequence

| Step | Owner | Enablement allowed now | Required inputs |
| --- | --- | --- | --- |
| approved snapshot and private source precheck | AI_VIDEO_BROLL_GENERATION | false | approved plan snapshot id, immutable approved plan version, structured findings, edit intents, private source refs, manifest refs, checksum refs, worker graph refs |
| no-spend credit and cost precheck | BILLING_STRIPE_CREDITS | false | credit estimate ref, credit reservation ref, exact approved snapshot version match, no-spend precondition, cost placeholder evidence, release/refund fallback handoff |
| backend lease and claim enablement | WORKER_RUNTIME_JOBS | false | single eligible Qwen worker job, backend-only lease claim path, lease timeout, retry count, conflict handling, stale-claim cleanup, sanitized event path |
| idempotency runtime message enablement | WORKER_RUNTIME_JOBS | false | workspace id, project id, approved snapshot id, job type, runtime target, request hash, duplicate-source mismatch rejection, backend runtime message contract |
| Qwen adapter and envelope enablement | AI_VIDEO_BROLL_GENERATION | false | bounded visual-understanding use case, bounded visual-QA use case, private source frame refs, raw chat rejection, raw prompt payload rejection, raw model output exclusion, `qwen_fixture_visual_metadata_v1` schema target |
| private invoke transport dependency enablement | PROVIDER_GATEWAY_MODELS | false | `resolveServiceUrl`, `resolveAudience`, `fetchIdentityToken`, `sendRequest`, private Cloud Run target, timeout policy, retry policy, no frontend invocation proof |
| Cloud Run L4 dependency enablement | PROVIDER_GATEWAY_MODELS | false | NVIDIA L4 Cloud Run service, scale-to-zero cost posture, minimum instances 0, initial maximum instances 1, bounded request timeout, single approved fixture dispatch scope, CPU fallback disabled |
| response classification and result handoff | AI_VIDEO_BROLL_GENERATION | false | HTTP response classifier, `qwen_fixture_visual_metadata_v1` parser compatibility, schema-valid metadata expectation, raw model output exclusion, generated asset blocking, storage write blocking, signed URL blocking, public artifact blocking |
| QA audit cost credit cleanup handoff | OBSERVABILITY_AUDIT_COST | false | QA evidence handoff, audit evidence handoff, cost evidence handoff, cleanup evidence, rollback handling, credit release/refund handoff, spend eligibility blocked until accepted result review |
| beta production public artifact lock | AI_VIDEO_BROLL_GENERATION | false | beta remains blocked, production remains blocked, generated assets remain blocked, public artifacts remain blocked, signed URLs remain blocked, render/export remains blocked |

## Execution approval preconditions

- approved snapshot, immutable version, structured findings, edit intents, private source refs, manifest refs, checksum refs, and worker graph refs
- no-spend credit reservation, cost placeholder evidence, release/refund fallback, and exact approved snapshot version match
- single eligible Qwen job, backend-only lease path, timeout, retry, conflict handling, stale-claim cleanup, and sanitized event path
- idempotency key, duplicate-source mismatch rejection, runtime target, request hash, and backend runtime message contract
- bounded Qwen visual metadata envelope with raw chat, raw prompt payload, generated B-roll, render/export, and raw model output persistence rejected
- private invoke dependency injection plan for `resolveServiceUrl`, `resolveAudience`, `fetchIdentityToken`, and `sendRequest` with all calls disabled until approval
- NVIDIA L4 Cloud Run GPU posture with scale-to-zero, minimum instances zero, initial maximum one, and CPU fallback disabled
- response classification, sanitized result metadata, QA/audit/cost/credit handoff, cleanup, rollback, and beta/production lock evidence

## Local contract previews

- fail-closed dispatch adapter status: `blocked_fail_closed_cloud_run_invocation_disabled`
- dispatch adapter accepts validated queue for future dispatch: true
- private invoke envelope status: `blocked_private_invocation_disabled`
- private invoke envelope accepted for future transport: true
- private invoke transport preview status: `blocked_transport_disabled`
- private invoke transport envelope accepted for future transport: true
- response classification status: `blocked_contract_valid_inference_disabled`
- response classification runtime can advance now: false

These previews are local contract checks only. The private invoke transport preview never calls injected dependencies.

## Source-of-truth rules

- Workers execute approved snapshots, not raw chat.
- Raw chat worker execution allowed: false.
- Raw worker prompt allowed: false.
- Signed URLs and public URLs are not source of truth.
- Private storage manifest, checksum, and approved snapshot refs are required.
- Qwen may generate B-roll video: false.
- Qwen may render/export: false.
- Frontend may claim jobs: false.
- Frontend may resolve private invoke credentials: false.
- Frontend may call Cloud Run: false.
- Frontend may create generated assets: false.

## Runtime flags

- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPreflightRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPreflightRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPreflightPassed=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionPlanRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionPlanRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionApprovalRequired=true`
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

## Remaining blocker

The next narrow blocker is controlled transport dependency enablement execution approval. That approval must accept the exact enablement sequence before any later prompt may consider enabling real backend lease claims, injected private invoke dependency calls, Cloud Run invocation, or Qwen inference.

Next prompt:

`QWEN2_5_VL_STACK_TOOL_58CL-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-DEPENDENCY-ENABLEMENT-EXECUTION-APPROVAL: approve controlled Qwen real-dispatch transport dependency enablement execution plan, no Cloud Run invocation/no inference/no generated assets/no beta`
