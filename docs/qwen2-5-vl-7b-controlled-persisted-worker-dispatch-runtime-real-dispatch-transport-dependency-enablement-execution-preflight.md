# Qwen2.5-VL Controlled Real-Dispatch Transport Dependency Enablement Execution Preflight

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_dependency_enablement_execution_preflight_verified_attempt_required`.

This packet verifies the controlled transport dependency enablement execution approval for a future controlled attempt only. It accepts the 58CL approval as sufficient to plan an attempt, but it does not enable dependencies now.

This is not runtime execution. It does not enable dependencies now, create a real job, claim a real lease, create idempotency rows, create job events, create backend runtime messages, create worker claims, create storage object records, create signed URL events, create QA rows, create audit rows, mutate credits, resolve service URLs, resolve audiences, fetch identity tokens, create auth headers, send private requests, invoke Cloud Run, import Qwen, load Qwen, initialize vLLM, process prompts, run a forward pass, run inference, call providers, dispatch workers, touch Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, process media, render/export, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Reviewed Evidence

- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-approval.md`
- `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-approval.ts`
- `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-approval-smoke.ts`
- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-execution-plan.md`
- `src/backend/workers/qwen2-5-vl-controlled-real-dispatch-transport-dependency-enablement.ts`
- `approved-plan-snapshot-policy.md`
- `editing-agent-execution-architecture.md`
- `async-edit-work-graph.md`
- `editing-asset-manifest.md`
- `model-routing-policy.md`

## Preflight Outcome

- transport dependency enablement execution approval accepted for preflight: true
- controlled transport dependency enablement execution preflight recorded: true
- controlled transport dependency enablement execution preflight passed: true
- controlled transport dependency enablement execution attempt required: true
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

## Verified Preflight Areas

| Area | Owner | Prerequisite verified | Execution allowed now |
| --- | --- | --- | --- |
| approved snapshot and private source precheck | AI_VIDEO_BROLL_GENERATION | true | false |
| no-spend credit and cost precheck | BILLING_STRIPE_CREDITS | true | false |
| backend lease and claim enablement | WORKER_RUNTIME_JOBS | true | false |
| idempotency runtime message enablement | WORKER_RUNTIME_JOBS | true | false |
| Qwen adapter and envelope enablement | AI_VIDEO_BROLL_GENERATION | true | false |
| private invoke transport dependency enablement | PROVIDER_GATEWAY_MODELS | true | false |
| Cloud Run L4 dependency enablement | PROVIDER_GATEWAY_MODELS | true | false |
| response classification and result handoff | AI_VIDEO_BROLL_GENERATION | true | false |
| QA audit cost credit cleanup handoff | OBSERVABILITY_AUDIT_COST | true | false |
| beta production public artifact lock | AI_VIDEO_BROLL_GENERATION | true | false |

## Controlled Attempt Requirements

The next controlled attempt must remain approved-fixture-only and must still stop before any actual dependency call unless the attempt explicitly records a fail-closed preview:

- approved snapshot, immutable version, structured findings, edit intents, private source refs, manifest refs, checksum refs, and worker graph refs;
- no-spend credit reservation, cost placeholder evidence, release/refund fallback, and exact approved snapshot version match;
- single eligible Qwen job, backend-only lease path, timeout, retry, conflict handling, stale-claim cleanup, and sanitized event path;
- idempotency key, duplicate-source mismatch rejection, runtime target, request hash, and backend runtime message contract;
- bounded Qwen visual metadata envelope with raw chat, raw prompt payload, generated B-roll, render/export, and raw model output persistence rejected;
- disabled private invoke dependency injection surfaces for `resolveServiceUrl`, `resolveAudience`, `fetchIdentityToken`, and `sendRequest`;
- NVIDIA L4 Cloud Run GPU posture with scale-to-zero, minimum instances zero, initial maximum one, and CPU fallback disabled;
- fail-closed response classification and sanitized metadata result handoff without generated assets, storage writes, signed URLs, public artifacts, or raw model output persistence;
- QA, audit, cost, cleanup, rollback, credit release/refund, and spend-eligibility handoff evidence;
- beta, production, public artifact, signed URL, render/export, and generated asset locks.

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

- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionApprovalAcceptedForPreflight=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionPreflightRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionPreflightRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionPreflightPassed=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionAttemptRequired=true`
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

`QWEN2_5_VL_STACK_TOOL_58CN-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-DEPENDENCY-ENABLEMENT-EXECUTION-ATTEMPT: run controlled Qwen real-dispatch transport dependency enablement execution attempt, approved fixture only/no generated assets/no beta`
