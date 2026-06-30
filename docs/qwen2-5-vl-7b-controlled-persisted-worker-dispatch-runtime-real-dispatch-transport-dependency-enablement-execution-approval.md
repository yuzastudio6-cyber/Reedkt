# Qwen2.5-VL Controlled Real-Dispatch Transport Dependency Enablement Execution Approval

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_dependency_enablement_execution_approval_accepted_preflight_required`.

This packet records approval of the controlled transport dependency enablement execution plan for a future preflight only. It accepts the 58CK execution sequence as the right path toward enabling the real-dispatch transport dependencies that would eventually support a private Cloud Run Qwen worker call, but it does not approve execution now.

This is not runtime execution. It does not enable dependencies now, create a real job, claim a real lease, create idempotency rows, create job events, create backend runtime messages, create worker claims, create storage object records, create signed URL events, create QA rows, create audit rows, mutate credits, resolve service URLs, resolve audiences, fetch identity tokens, create auth headers, send private requests, invoke Cloud Run, import Qwen, load Qwen, initialize vLLM, process prompts, run a forward pass, run inference, call providers, dispatch workers, touch Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, process media, render/export, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Reviewed Evidence

- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-plan.md`
- `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-plan.ts`
- `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-plan-smoke.ts`
- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-preflight.md`
- `src/backend/workers/qwen2-5-vl-controlled-real-dispatch-transport-dependency-enablement.ts`
- `approved-plan-snapshot-policy.md`
- `editing-agent-execution-architecture.md`
- `async-edit-work-graph.md`
- `editing-asset-manifest.md`
- `model-routing-policy.md`

## Decision Outcome

- transport dependency enablement execution plan accepted for controlled preflight: true
- controlled transport dependency enablement execution approval recorded: true
- controlled transport dependency enablement execution preflight required: true
- dependency enablement approved now: false
- real backend lease claim approved now: false
- injected private invoke dependencies approved now: false
- service URL resolution approved now: false
- audience resolution approved now: false
- identity token fetch approved now: false
- private request send approved now: false
- Cloud Run invocation approved now: false
- Qwen inference approved now: false
- generated asset creation approved now: false
- beta readiness advanced: false
- production readiness advanced: false

## Accepted Transport Dependency Enablement Plan Evidence

| Evidence area | Owner | Decision | Execution allowed now |
| --- | --- | --- | --- |
| approved snapshot and private source precheck | AI_VIDEO_BROLL_GENERATION | accepted for future preflight | false |
| no-spend credit and cost precheck | BILLING_STRIPE_CREDITS | accepted for future preflight | false |
| backend lease and claim enablement | WORKER_RUNTIME_JOBS | accepted for future preflight | false |
| idempotency runtime message enablement | WORKER_RUNTIME_JOBS | accepted for future preflight | false |
| Qwen adapter and envelope enablement | AI_VIDEO_BROLL_GENERATION | accepted for future preflight | false |
| private invoke transport dependency enablement | PROVIDER_GATEWAY_MODELS | accepted for future preflight | false |
| Cloud Run L4 dependency enablement | PROVIDER_GATEWAY_MODELS | accepted for future preflight | false |
| response classification and result handoff | AI_VIDEO_BROLL_GENERATION | accepted for future preflight | false |
| QA audit cost credit cleanup handoff | OBSERVABILITY_AUDIT_COST | accepted for future preflight | false |
| beta production public artifact lock | AI_VIDEO_BROLL_GENERATION | accepted for future preflight | false |

## Required Transport Dependency Enablement Execution Preflight

The next preflight must verify readiness without enabling dependencies, invoking Cloud Run, or running inference:

- approved snapshot, immutable version, structured findings, edit intents, private source refs, manifest refs, checksum refs, and worker graph refs are present;
- no-spend credit reservation, cost placeholder evidence, release/refund fallback, and exact approved snapshot version match are present;
- single eligible Qwen job, backend-only lease path, timeout, retry, conflict handling, stale-claim cleanup, and sanitized event path are ready;
- idempotency key, duplicate-source mismatch rejection, runtime target, request hash, and backend runtime message contract are ready;
- bounded Qwen visual metadata envelope rejects raw chat, raw prompt payload, generated B-roll, render/export, and raw model output persistence;
- private invoke dependency injection surfaces for `resolveServiceUrl`, `resolveAudience`, `fetchIdentityToken`, and `sendRequest` are present but disabled;
- NVIDIA L4 Cloud Run GPU posture remains scale-to-zero with minimum instances zero, initial maximum one, and CPU fallback disabled;
- response classification, sanitized result metadata, QA/audit/cost/credit handoff, cleanup, rollback, and beta/production lock evidence are present.

## Runtime Posture

- selected platform: `google_cloud_run_gpu`
- selected GPU: `nvidia_l4`
- region: `us-central1`
- service name: `reeditpro-qwen2-5-vl-l4-worker`
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

- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionPlanRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionPlanRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionApprovalRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionApprovalRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionApprovalAcceptedForPreflight=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionPreflightRequired=true`
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

`QWEN2_5_VL_STACK_TOOL_58CM-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-DEPENDENCY-ENABLEMENT-EXECUTION-PREFLIGHT: verify controlled Qwen real-dispatch transport dependency enablement execution preflight, no Cloud Run invocation/no inference/no generated assets/no beta`
