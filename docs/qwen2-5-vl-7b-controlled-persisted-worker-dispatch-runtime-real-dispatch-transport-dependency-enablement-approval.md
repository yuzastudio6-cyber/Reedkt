# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Transport Dependency Enablement Approval

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_dependency_enablement_approval_accepted_implementation_required`.

This packet records approval of the controlled persisted worker-dispatch real-dispatch transport dependency enablement plan for a future implementation step only. It accepts the 58CG dependency plan as the right path for backend lease, idempotency, Qwen dispatch adapter, private invoke envelope, private invoke transport, response classification, QA/audit/cost/credit, cleanup, and beta/production lock dependencies before a later controlled implementation may be proposed.

This is approval-to-implement planning only. It does not enable dependencies now, create a real job, claim a real lease, create idempotency rows, create job events, create backend runtime messages, create worker claims, resolve service URLs, fetch identity tokens, create auth headers, invoke Cloud Run, import or load Qwen, initialize vLLM, run inference, dispatch workers, mutate Supabase, execute SQL, upload storage objects, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Reviewed Evidence

- transport dependency enablement plan: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-plan.md`
- transport dependency enablement plan spec: `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-plan.ts`
- transport dependency enablement plan smoke: `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-dependency-enablement-plan-smoke.ts`
- real-dispatch execution attempt result review: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result-review.md`
- controlled persisted worker dispatch runtime: `src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts`
- fail-closed Qwen dispatch adapter: `src/backend/workers/qwen2-5-vl-cloud-run-gpu-dispatch-adapter.ts`
- private invoke transport adapter: `src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter.ts`
- private invoke envelope: `src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-envelope.ts`
- private invoke response classifier: `src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-response.ts`
- approved plan snapshot policy: `approved-plan-snapshot-policy.md`
- editing execution architecture: `editing-agent-execution-architecture.md`

## Decision Outcome

- transport dependency enablement plan accepted for implementation: true
- transport dependency enablement approval recorded: true
- transport dependency enablement implementation required: true
- dependencies enabled now: false
- real worker dispatch approved now: false
- worker lease claim approved now: false
- Cloud Run invocation approved now: false
- Qwen inference approved now: false
- generated asset creation approved now: false
- beta readiness advanced: false
- production readiness advanced: false

## Accepted Dependency Plan Evidence

| Dependency area | Decision | Enablement allowed now |
| --- | --- | --- |
| service-role lease and claim dependency | accepted for future implementation | false |
| idempotency and runtime message dependency | accepted for future implementation | false |
| Qwen dispatch adapter dependency | accepted for future implementation | false |
| private invoke envelope dependency | accepted for future implementation | false |
| private invoke transport dependency | accepted for future implementation | false |
| response classification dependency | accepted for future implementation | false |
| QA, audit, cost, and credit dependency | accepted for future implementation | false |
| cleanup and rollback dependency | accepted for future implementation | false |
| beta and production lock dependency | accepted for future implementation | false |

## Required Controlled Implementation Scope

The next implementation step must stay bounded and fail-closed:

- preserve the approved snapshot, private source refs, manifest, checksum, idempotency, job, lease, and worker graph source-of-truth path;
- implement backend lease and claim dependency surfaces without enabling arbitrary job claiming;
- keep Qwen dispatch adapter inputs approved-snapshot scoped and reject raw chat, raw worker prompts, public URLs, signed URLs, and generated asset instructions;
- keep private invoke envelope creation bounded to `qwen_fixture_visual_metadata_v1` visual metadata scope;
- require backend-only injection of service URL, audience, identity token, auth header, and request-sending dependencies;
- classify responses into fail-closed, accepted fixture metadata, invalid schema, timeout, auth failure, retryable transport failure, and unrecoverable transport failure;
- preserve sanitized QA, audit, cost, and credit handoff metadata while blocking spend;
- preserve cleanup, lease release, retry, duplicate-source, and rollback semantics;
- keep beta, production, public artifacts, signed URLs, generated assets, render/export, and `generated_local_fixture_passed` locked.

## Runtime Posture

- selected runtime: `google_cloud_run_gpu`
- selected GPU: `nvidia_l4`
- target region: `us-central1`
- target service: `reeditpro-qwen2-5-vl-l4-worker`
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
- Frontend/browser code must not claim jobs, resolve private invoke credentials, call Cloud Run, or create generated assets.
- Qwen remains visual understanding and visual QA metadata only.
- Qwen must not generate B-roll video, render, export, replace deterministic OCR, replace deterministic frame sampling, create public artifacts, create signed URLs, or become a browser-facing runtime.

## Runtime Gates

- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPlanAccepted=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementApprovalRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementApprovalRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementApprovalAcceptedForImplementation=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementImplementationRequired=true`
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

`QWEN2_5_VL_STACK_TOOL_58CI-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-DEPENDENCY-ENABLEMENT-IMPLEMENTATION: implement controlled Qwen real-dispatch lease adapter and private invoke transport dependency enablement, no generated assets/no beta`
