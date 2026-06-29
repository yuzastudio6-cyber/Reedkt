# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Execution Plan

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_execution_plan_recorded_execution_approval_required`.

This packet records the controlled persisted Qwen worker dispatch runtime execution plan. It translates the accepted runtime approval decision into an exact future execution envelope that must be separately approved before any real private invoke attempt. It does not approve execution now, create persisted rows, run SQL, mutate Supabase cloud, deploy migrations, resolve service URLs, fetch identity tokens, create auth headers, invoke Cloud Run, import or load Qwen, initialize vLLM, run inference, dispatch workers, upload storage objects, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Reviewed Evidence

- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-approval-decision.md`
- `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-approval-decision.ts`
- `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-approval-decision-smoke.ts`
- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-approval-plan.md`
- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-smoke-result-review.md`
- `src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts`
- `approved-plan-snapshot-policy.md`
- `editing-agent-execution-architecture.md`
- `async-edit-work-graph.md`
- `editing-asset-manifest.md`
- `model-routing-policy.md`

## Plan Outcome

- runtime approval decision accepted for execution planning: true
- controlled runtime execution plan recorded: true
- controlled runtime execution approval required: true
- real worker dispatch approved now: false
- Cloud Run invocation approved now: false
- Qwen inference approved now: false
- generated asset creation approved now: false
- beta readiness advanced: false
- production readiness advanced: false

## Future Execution Envelope

| Step | Future behavior | Current execution allowed |
| --- | --- | --- |
| approved snapshot intake | Load immutable approved plan snapshot, compiled intent, structured findings, edit intents, timing, asset manifest refs, provider policy, worker execution graph, and Qwen use-case scope. | false |
| credit reservation check | Verify accepted credit estimate and reservation for the exact approved snapshot version before any worker lease or private invoke can proceed. | false |
| private source-of-truth refs | Require private storage object records, private path refs, manifests, checksums, and approved snapshot refs; reject signed or public URLs as source of truth. | false |
| idempotency guard | Bind idempotency to workspace, project, approved snapshot, job type, private source refs, runtime target, and request hash before lease claim. | false |
| backend-only lease claim | Claim exactly one eligible Qwen job lease through backend service-role runtime code with timeout, retry, conflict, stale-claim, and cleanup rules. | false |
| Qwen envelope build | Build a bounded visual-understanding or visual-QA request from persisted source refs only, excluding raw chat, raw prompt payloads, and raw model output persistence. | false |
| private invoke transport | Resolve service target, audience, identity, auth header, timeout, retry, and response classification only in a later approved backend execution gate. | false |
| result, QA, audit, cost, credit | Store sanitized result metadata, QA evidence, audit/cost events, credit release/refund or spend eligibility, and cleanup evidence only after accepted result handling. | false |

## Future Preflight Requirements

Before any future controlled runtime execution approval can allow a private invoke, that approval must re-check:

- approved snapshot id, checksum, immutable plan version, structured findings, edit intents, timing, and source-order references;
- credit estimate and reservation state tied to the exact approved snapshot version;
- private source refs, private storage object records, private path expectations, manifests, checksums, and access scope;
- worker runtime config for Qwen, selected GPU, min instances, max instances, timeout, retry budget, and scale-to-zero posture;
- service-role backend lease claim path, idempotency policy, duplicate-source rejection, stale-claim cleanup, and event sanitization;
- private Cloud Run target, service account, audience, identity-token path, auth header creation path, timeout policy, and no-frontend invocation proof;
- QA schema, confidence thresholds, source-frame refs, raw-output exclusion, audit/cost metadata, and credit release/refund/spend boundaries;
- rollback plan for failed invoke, partial result, invalid schema, timeout, stale lease, duplicate source mismatch, and cleanup failure.

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

- `controlledPersistedWorkerDispatchRuntimeExecutionPlanRequired=false`
- `controlledPersistedWorkerDispatchRuntimeExecutionPlanRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeExecutionApprovalRequired=true`
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

`QWEN2_5_VL_STACK_TOOL_58BV-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-EXECUTION-APPROVAL: approve controlled persisted Qwen worker dispatch runtime execution plan, no Cloud Run invocation/no inference/no assets/no beta`
