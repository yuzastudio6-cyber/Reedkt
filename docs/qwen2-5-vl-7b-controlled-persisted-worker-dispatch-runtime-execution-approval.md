# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Execution Approval

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_execution_approval_accepted_preflight_required`.

This packet records approval of the controlled persisted Qwen worker dispatch runtime execution plan for a future preflight only. It accepts the 58BU execution envelope as the right path toward a controlled backend runtime attempt, but it does not approve execution now, create persisted rows, run SQL, mutate Supabase cloud, deploy migrations, resolve service URLs, fetch identity tokens, create auth headers, invoke Cloud Run, import or load Qwen, initialize vLLM, run inference, dispatch workers, upload storage objects, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Reviewed Evidence

- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-execution-plan.md`
- `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-plan.ts`
- `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-plan-smoke.ts`
- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-approval-decision.md`
- `src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts`
- `approved-plan-snapshot-policy.md`
- `editing-agent-execution-architecture.md`
- `async-edit-work-graph.md`
- `editing-asset-manifest.md`
- `model-routing-policy.md`

## Decision Outcome

- execution plan accepted for controlled preflight: true
- controlled runtime execution approval recorded: true
- controlled runtime execution preflight required: true
- real worker dispatch approved now: false
- Cloud Run invocation approved now: false
- Qwen inference approved now: false
- generated asset creation approved now: false
- beta readiness advanced: false
- production readiness advanced: false

## Accepted Execution Plan Evidence

| Evidence area | Decision | Execution allowed now |
| --- | --- | --- |
| approved snapshot intake | accepted for future preflight | false |
| credit reservation check | accepted for future preflight | false |
| private source-of-truth refs | accepted for future preflight | false |
| idempotency guard | accepted for future preflight | false |
| backend-only lease claim | accepted for future preflight | false |
| Qwen envelope build | accepted for future preflight | false |
| private invoke transport | accepted for future preflight | false |
| result, QA, audit, cost, credit | accepted for future preflight | false |

## Required Controlled Runtime Execution Preflight

The next preflight must verify readiness without invoking Cloud Run or running inference:

- approved snapshot, immutable plan version, structured findings, edit intents, timing, and source-order refs are present;
- credit estimate and reservation are present and match the exact approved snapshot version;
- private source refs, private storage object records, manifests, checksums, and access scope are present;
- Qwen worker runtime config resolves to NVIDIA L4, min instances 0, initial max instances 1, timeout, retry budget, and scale-to-zero posture;
- service-role lease claim, idempotency, duplicate-source rejection, stale-claim cleanup, and sanitized event paths are ready;
- private Cloud Run target, service account, audience, identity-token path, auth-header creation path, timeout policy, and no-frontend invocation proof are ready;
- QA schema, confidence thresholds, source-frame refs, raw-output exclusion, audit/cost metadata, and credit boundaries are ready;
- rollback handling for failed invoke, partial result, invalid schema, timeout, stale lease, duplicate source mismatch, and cleanup failure is ready.

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

- `controlledPersistedWorkerDispatchRuntimeExecutionApprovalRequired=false`
- `controlledPersistedWorkerDispatchRuntimeExecutionApprovalRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeExecutionApprovalAcceptedForPreflight=true`
- `controlledPersistedWorkerDispatchRuntimeExecutionPreflightRequired=true`
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

`QWEN2_5_VL_STACK_TOOL_58BW-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-EXECUTION-PREFLIGHT: verify controlled persisted Qwen worker dispatch runtime execution preflight, no Cloud Run invocation/no inference/no assets/no beta`
