# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Execution Preflight

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_execution_preflight_verified_attempt_required`.

This packet records the controlled persisted Qwen worker dispatch runtime real-dispatch execution preflight. It verifies that the approved real-dispatch execution envelope has the required prerequisite categories for a future first persisted Qwen worker dispatch attempt, but it does not execute the attempt now, create jobs, claim leases, create idempotency rows, create job events, create backend runtime messages, mutate Supabase, run SQL, resolve service URLs, fetch identity tokens, create auth headers, invoke Cloud Run, import or load Qwen, initialize vLLM, run inference, dispatch workers, upload storage objects, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Reviewed Evidence

- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-approval.md`
- `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-approval.ts`
- `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-approval-smoke.ts`
- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-plan.md`
- `src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts`
- `approved-plan-snapshot-policy.md`
- `editing-agent-execution-architecture.md`
- `async-edit-work-graph.md`
- `editing-asset-manifest.md`
- `model-routing-policy.md`

## Preflight Outcome

- real-dispatch execution approval accepted for preflight: true
- controlled real-dispatch execution preflight recorded: true
- controlled real-dispatch execution preflight passed: true
- controlled real-dispatch execution attempt required: true
- real worker dispatch approved now: false
- worker lease claim approved now: false
- Cloud Run invocation approved now: false
- Qwen inference approved now: false
- generated asset creation approved now: false
- beta readiness advanced: false
- production readiness advanced: false

## Verified Real-Dispatch Preflight Areas

| Preflight area | Verification result | Execution allowed now |
| --- | --- | --- |
| approved snapshot fixture intake | prerequisite category verified | false |
| credit reservation no-spend check | prerequisite category verified | false |
| private source-of-truth refs | prerequisite category verified | false |
| idempotency duplicate-source guard | prerequisite category verified | false |
| backend-only service-role lease claim | prerequisite category verified | false |
| Qwen request envelope build | prerequisite category verified | false |
| private invoke credential resolution | prerequisite category verified | false |
| Cloud Run L4 invocation attempt | prerequisite category verified | false |
| result validation and persistence | prerequisite category verified | false |
| QA audit cost cleanup credit handoff | prerequisite category verified | false |

## Required Controlled Real-Dispatch Execution Attempt

The next gate may attempt only the bounded approved-fixture real-dispatch path after it repeats safety checks:

- use an approved snapshot id, checksum, immutable plan version, structured findings, edit intents, timing refs, source-order refs, private source refs, worker graph, and Qwen visual metadata scope;
- verify credit estimate and no-spend reservation match the approved snapshot version before any lease claim, private invoke, result handling, or spend eligibility;
- use private storage object records, private path refs, manifests, checksums, and approved snapshot refs, never signed or public URLs as source of truth;
- bind idempotency to workspace, project, approved snapshot, job type, private source refs, runtime target, and request hash, and reject duplicate-source mismatches;
- claim a backend-only service-role lease for a single eligible Qwen job with timeout, retry, conflict handling, stale-claim cleanup, and sanitized event paths;
- build a bounded Qwen visual-understanding or visual-QA envelope from persisted private refs only, with raw chat and raw prompt payloads rejected;
- resolve private Cloud Run target, service account, audience, identity-token path, auth-header creation path, timeout policy, retry policy, response classification, and no-frontend invocation proof only inside backend runtime code;
- attempt the NVIDIA L4 Cloud Run service only under scale-to-zero posture, minimum instances 0, initial max instances 1, bounded timeout, and single approved fixture dispatch scope;
- accept only `qwen_fixture_visual_metadata_v1` parser-compatible sanitized metadata, while blocking generated asset creation, storage writes, signed URLs, public artifacts, and raw model output persistence;
- record sanitized QA, audit, cost, cleanup, rollback, and credit release/refund/spend-eligibility evidence after result handling.

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

- `controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionApprovalAcceptedForPreflight=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPreflightRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPreflightRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPreflightPassed=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptRequired=true`
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

`QWEN2_5_VL_STACK_TOOL_58CE-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-EXECUTION-ATTEMPT: run first real persisted Qwen worker dispatch execution attempt, approved fixture only/no generated assets/no beta`
