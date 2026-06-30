# Qwen2.5-VL Controlled Real-Dispatch Transport Dependency Enablement Preflight

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_dependency_enablement_preflight_verified_execution_plan_required`.

This packet verifies the controlled transport dependency enablement implementation from the previous gate. It confirms the dependency inventory, local fail-closed contract previews, source-of-truth rules, and cost-controlled GPU posture are present before a later prompt may plan a controlled dependency-enable execution path.

This is not runtime execution. It does not enable dependencies now, create a real job, claim a real lease, create idempotency rows, create job events, create backend runtime messages, create worker claims, create storage object records, create signed URL events, create QA rows, create audit rows, mutate credits, resolve service URLs, resolve audiences, fetch identity tokens, create auth headers, invoke Cloud Run, import Qwen, load Qwen, initialize vLLM, process prompts, run a forward pass, run inference, call providers, dispatch workers, touch Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, process media, render/export, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Preflight status

- transport dependency enablement implementation accepted for preflight: true
- transport dependency enablement preflight recorded: true
- transport dependency enablement preflight passed: true
- controlled transport dependency enablement execution plan required: true
- dependencies enabled now: false
- real worker dispatch ready now: false

## Runtime posture

- selected platform: `google_cloud_run_gpu`
- selected GPU: `nvidia_l4`
- region: `us-central1`
- service name: `reeditpro-qwen2-5-vl-l4-worker`
- cost posture: `scale_to_zero_required`
- minimum instances: 0
- initial max instances: 1
- CPU fallback allowed: false

The GPU path remains cost-controlled: Cloud Run GPU with NVIDIA L4, minimum instances zero, initial maximum one, and no CPU fallback. This preflight does not keep a GPU instance hot and does not invoke the GPU service.

## Verified dependency surfaces

| Surface | Owner | Implementation verified | Preflight verified | Enabled now | Execution allowed now |
| --- | --- | --- | --- | --- | --- |
| service-role lease and claim dependency | WORKER_RUNTIME_JOBS | true | true | false | false |
| idempotency and runtime message dependency | WORKER_RUNTIME_JOBS | true | true | false | false |
| Qwen dispatch adapter dependency | AI_VIDEO_BROLL_GENERATION | true | true | false | false |
| private invoke envelope dependency | AI_VIDEO_BROLL_GENERATION | true | true | false | false |
| private invoke transport dependency | PROVIDER_GATEWAY_MODELS | true | true | false | false |
| response classification dependency | AI_VIDEO_BROLL_GENERATION | true | true | false | false |
| QA, audit, cost, and credit dependency | OBSERVABILITY_AUDIT_COST | true | true | false | false |
| cleanup and rollback dependency | WORKER_RUNTIME_JOBS | true | true | false | false |
| beta and production lock dependency | AI_VIDEO_BROLL_GENERATION | true | true | false | false |

## Verified preflight checks

- implementation record present: verified
- dependency surface inventory: verified
- local fail-closed contract previews: verified
- injected transport dependency shape: verified
- approved snapshot source of truth: verified
- cost-controlled runtime posture: verified
- frontend boundary: verified
- QA, audit, cost, credit, cleanup: verified
- beta, production, and public artifact lock: verified

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

## Transport dependency shape

The future backend transport dependency shape remains:

- `resolveServiceUrl`
- `resolveAudience`
- `fetchIdentityToken`
- `sendRequest`

Current permissions:

- injected dependency calls allowed now: false
- service URL resolution allowed now: false
- audience resolution allowed now: false
- identity token fetch allowed now: false
- request send allowed now: false

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

- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementApprovalAccepted=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementImplementationRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementImplementationRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPreflightRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPreflightRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPreflightPassed=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementExecutionPlanRequired=true`
- `serviceRoleLeaseClaimDependencyImplemented=true`
- `idempotencyRuntimeMessageDependencyImplemented=true`
- `qwenDispatchAdapterDependencyImplemented=true`
- `privateInvokeEnvelopeDependencyImplemented=true`
- `privateInvokeTransportDependencyImplemented=true`
- `responseClassificationDependencyImplemented=true`
- `qaAuditCostCreditDependencyImplemented=true`
- `cleanupRollbackDependencyImplemented=true`
- `betaProductionPublicArtifactLockImplemented=true`
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

## Remaining blocker

The next narrow blocker is a controlled transport dependency enablement execution plan. That plan must define how a later prompt would enable real backend lease and injected private invoke dependency calls without skipping approved snapshots, source-of-truth refs, cost controls, cleanup, QA, audit, and fail-closed rollback checks.

Next prompt:

`QWEN2_5_VL_STACK_TOOL_58CK-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-DEPENDENCY-ENABLEMENT-EXECUTION-PLAN: plan controlled Qwen real-dispatch transport dependency enablement execution, no Cloud Run invocation/no inference/no generated assets/no beta`
