# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Smoke Plan

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_smoke_plan_recorded_smoke_execution_required`.

This packet plans the future controlled persisted Qwen worker dispatch smoke. It records how a later prompt should prove the persisted dispatch handoff shape across approved snapshots, credit reservations, private source-of-truth references, idempotency, jobs, job events, worker runtime configs, worker leases, worker claims, backend runtime messages, signed URL audit boundaries, QA/audit/cost evidence, and cleanup.

This is plan-only. It does not create jobs, claim leases, create idempotency rows, create job events, create backend runtime messages, create worker claims, create storage object records, create signed URL events, create QA reports, create audit events, mutate credits, run SQL, deploy migrations, mutate Supabase cloud, resolve service URLs, fetch identity tokens, create auth headers, invoke Cloud Run, import or load Qwen, initialize vLLM, run inference, dispatch workers, create generated assets, create public artifacts, create signed URLs, process media, render/export, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Inputs

- Runtime persistence to worker dispatch readiness review: `docs/qwen2-5-vl-7b-runtime-persistence-to-worker-dispatch-readiness-review.md`
- Remote satisfaction review: `docs/qwen2-5-vl-7b-backend-runtime-persistence-active-migration-remote-satisfaction-review.md`
- Active migration: `supabase/migrations/20260628000100_qwen2_5_vl_backend_runtime_persistence.sql`
- Qwen SQL tests: `database/test-sql/022_qwen2_5_vl_backend_runtime_persistence_tests.sql`
- Fail-closed coordinator: `src/backend/workers/qwen2-5-vl-backend-runtime-dispatch-coordinator.ts`
- Controlled backend dispatch dry-run review: `src/backend/mock/mock-qwen2-5-vl-controlled-backend-dispatch-dry-run-result.ts`

## Future Smoke Shape

The future controlled smoke must be local/non-production and must use deterministic mock/reference-only records or a separately approved local harness. It must prove shape and gate behavior only:

| Area | Planned assertion | Required future evidence | Still blocked |
| --- | --- | --- | --- |
| Approved snapshot | Require immutable approved snapshot id, checksum, plan version, and source intent refs. | Controlled fixture approved snapshot reference. | real approved snapshot mutation |
| Credit reservation | Require credit reservation reference before dispatch shape is accepted. | Controlled fixture credit reservation reference. | credit reserve/spend/release/refund |
| Private source of truth | Require private storage path reference, manifest reference, checksum, and approved snapshot. | Private storage object record shape only. | storage object upload or row mutation |
| Idempotency | Require workspace/job/snapshot/request hash scope and deterministic conflict handling. | Idempotency shape and conflict expectation. | idempotency row mutation |
| Job row | Require Qwen worker/job type, approved snapshot ref, and fail-closed status transitions. | Job row expectation only. | real job creation |
| Job event | Require sanitized event summaries without raw prompt, token, URL, or secret values. | Event shape expectation only. | real job event creation |
| Worker runtime config | Require backend-only L4 scale-to-zero config reference and no frontend exposure. | Config ref expectation only. | runtime config mutation |
| Worker lease | Require one-active-lease semantics, stale recovery boundary, and cleanup expectation. | Lease shape expectation only. | real lease claim/heartbeat/release |
| Worker claim | Require one-active-worker-claim semantics. | Worker claim shape expectation only. | real worker claim creation |
| Backend runtime message | Require sanitized runtime message summary and blocked transport preview. | Message shape expectation only. | backend runtime message creation |
| Signed URL audit | Require signed URL audit-only semantics and source-of-truth rejection. | Audit event shape expectation only. | signed URL creation |
| QA/audit/cost | Require metadata refs for QA, audit, cost, and owner handoff readiness. | Metadata expectation only. | persisted QA/audit/cost rows |
| Failure cleanup | Require deterministic cleanup/fallback expectations and no orphaned worker state. | Cleanup expectation only. | real cleanup mutation |

## Required Preconditions For Execution Prompt

- Workers execute approved snapshots, not raw chat.
- Raw prompt payload fields are rejected.
- Service URLs, identity tokens, bearer headers, provider secrets, service-role key values, database URLs, and raw model output text are never persisted.
- Signed URLs and public URLs are never source of truth.
- Cloud Run invocation, model import, model load, vLLM initialization, and inference remain disabled for this plan.
- No generated asset row can be created before private source-of-truth, QA, audit, and credit boundaries are accepted in a future execution prompt.
- The smoke may prove dispatch shape only; it must not claim beta, production, `dry_run_passed`, or `generated_local_fixture_passed`.

## Runtime Gates

- `controlledPersistedWorkerDispatchSmokePlanRecorded=true`
- `controlledPersistedWorkerDispatchSmokeExecutionRequired=true`
- `controlledPersistedWorkerDispatchSmokeExecuted=false`
- `readyForRealWorkerDispatch=false`
- `privateInvokeReady=false`
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
- `supabaseCloudTouched=false`
- `stagingTouched=false`
- `productionTouched=false`
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

## What This Proves

- The controlled persisted worker dispatch smoke is now planned.
- The accepted persistence-to-worker-dispatch readiness evidence has a concrete future smoke shape.
- The next gate is execution of that controlled smoke, still without Cloud Run invocation, inference, generated assets, beta, or production.

## What This Does Not Prove

- It does not execute the smoke.
- It does not create or mutate persisted runtime records.
- It does not dispatch a worker.
- It does not invoke Cloud Run or Qwen.
- It does not create generated assets, public artifacts, signed URLs, QA rows, audit rows, credit rows, beta readiness, or production readiness.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58BL-CONTROLLED-PERSISTED-WORKER-DISPATCH-SMOKE-EXECUTION: run controlled persisted Qwen worker dispatch smoke, no Cloud Run invocation/no inference/no assets/no beta`
