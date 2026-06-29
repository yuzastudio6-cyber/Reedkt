# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Real-Dispatch Execution Approval

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_execution_approval_accepted_preflight_required`.

This packet records approval of the first controlled real-dispatch execution plan for a future preflight only. It accepts the 58CB execution envelope as the right path toward a first real persisted Qwen worker dispatch attempt, but it does not approve execution now, create jobs, claim leases, create idempotency rows, create job events, create backend runtime messages, mutate Supabase, run SQL, resolve service URLs, fetch identity tokens, create auth headers, invoke Cloud Run, import or load Qwen, initialize vLLM, run inference, dispatch workers, upload storage objects, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Reviewed Evidence

- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-plan.md`
- `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-plan.ts`
- `server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-plan-smoke.ts`
- `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-decision.md`
- `src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts`
- `approved-plan-snapshot-policy.md`
- `editing-agent-execution-architecture.md`
- `async-edit-work-graph.md`
- `editing-asset-manifest.md`
- `model-routing-policy.md`

## Decision Outcome

- real-dispatch execution plan accepted for controlled preflight: true
- controlled real-dispatch execution approval recorded: true
- controlled real-dispatch execution preflight required: true
- real worker dispatch approved now: false
- worker lease claim approved now: false
- Cloud Run invocation approved now: false
- Qwen inference approved now: false
- generated asset creation approved now: false
- beta readiness advanced: false
- production readiness advanced: false

## Accepted Real-Dispatch Execution Plan Evidence

| Evidence area | Decision | Execution allowed now |
| --- | --- | --- |
| approved snapshot fixture intake | accepted for future preflight | false |
| credit reservation no-spend check | accepted for future preflight | false |
| private source-of-truth refs | accepted for future preflight | false |
| idempotency duplicate-source guard | accepted for future preflight | false |
| backend-only service-role lease claim | accepted for future preflight | false |
| Qwen request envelope build | accepted for future preflight | false |
| private invoke credential resolution | accepted for future preflight | false |
| Cloud Run L4 invocation attempt | accepted for future preflight | false |
| result validation and persistence | accepted for future preflight | false |
| QA audit cost cleanup credit handoff | accepted for future preflight | false |

## Required Real-Dispatch Execution Preflight

The next preflight must verify readiness without invoking Cloud Run or running inference:

- approved snapshot id, checksum, immutable plan version, structured findings, edit intents, timing, source-order refs, private source refs, worker graph, and Qwen visual metadata scope are present;
- credit estimate and no-spend reservation are present and match the exact approved snapshot version;
- private source refs, private storage object records, private path expectations, manifests, checksums, and access scope are present;
- idempotency key, workspace, project, approved snapshot, job type, runtime target, private source refs, request hash, and duplicate-source mismatch rejection are ready;
- service-role backend lease claim path, single eligible Qwen job lease, timeout, retry, conflict handling, stale-claim cleanup, and sanitized event paths are ready;
- bounded Qwen visual-understanding or visual-QA envelope from persisted private refs is ready with raw chat and raw prompt payloads rejected;
- private Cloud Run target, service account, audience, identity-token path, auth-header creation path, timeout policy, retry policy, response classification, and no-frontend invocation proof are ready;
- `qwen_fixture_visual_metadata_v1` parser compatibility, sanitized result metadata, raw-output exclusion, QA evidence, audit/cost metadata, rollback handling, cleanup evidence, and credit release/refund/spend-eligibility handoff are ready.

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

- `controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPlanAccepted=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionApprovalRequired=false`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionApprovalRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionApprovalAcceptedForPreflight=true`
- `controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPreflightRequired=true`
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

`QWEN2_5_VL_STACK_TOOL_58CD-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-EXECUTION-PREFLIGHT: verify first real persisted Qwen worker dispatch execution preflight, no Cloud Run invocation/no inference/no generated assets/no beta`
