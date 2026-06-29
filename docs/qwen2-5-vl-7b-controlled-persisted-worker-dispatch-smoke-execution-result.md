# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Smoke Execution Result

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_smoke_executed_mock_only_result_review_required`.

This packet records the controlled persisted Qwen worker dispatch smoke execution. The smoke executed only in local TypeScript/mock memory. It validated the accepted queue fixture, exercised the fail-closed coordinator through lease, adapter, envelope, and transport-preview boundaries, and created mock-only in-memory shapes for a job, idempotency record, worker lease, worker claim attempt, job event, and backend runtime message.

This does not create real persisted rows. It does not run SQL, mutate Supabase cloud, deploy migrations, resolve service URLs, fetch identity tokens, create auth headers, invoke Cloud Run, import or load Qwen, initialize vLLM, run inference, dispatch workers, upload storage objects, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Smoke Inputs

- Plan packet: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-smoke-plan.md`
- Queue fixture: `QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture`
- Runtime persistence readiness review: `docs/qwen2-5-vl-7b-runtime-persistence-to-worker-dispatch-readiness-review.md`
- Fail-closed coordinator: `src/backend/workers/qwen2-5-vl-backend-runtime-dispatch-coordinator.ts`
- Mock database: `src/backend/mock/mock-database.ts`
- Mock idempotency service: `src/backend/runtime/idempotency-service.ts`
- Mock worker lease service: `src/backend/runtime/worker-lease-service.ts`
- Mock backend runtime transport service: `src/backend/runtime/backend-runtime-transport-service.ts`

## Executed Mock Checks

| Check | Result | Evidence | Runtime effect |
| --- | --- | --- | --- |
| Queue fixture validation | passed | The fixture was accepted for future dispatch and all runtime gates stayed false. | none outside process memory |
| Coordinator default path | blocked as expected | `blocked_real_lease_backend_required` proves real lease mutation remains backend-required. | no real lease |
| Coordinator adapter preview path | blocked as expected | `blocked_qwen_dispatch_adapter_fail_closed` proves Qwen dispatch adapter remains fail-closed. | no worker dispatch |
| Coordinator transport preview path | blocked as expected | `blocked_private_invoke_transport_preview_only` proves transport preview does not call dependencies. | no Cloud Run |
| Mock job shape | passed | One in-memory Qwen media-analysis job shape was created with approved snapshot and credit refs. | mock-only |
| Mock idempotency shape | passed | One in-memory idempotency record was created and conflict check stayed false. | mock-only |
| Mock lease shape | passed | One in-memory worker lease and one claim attempt were created for shape validation. | mock-only |
| Mock event shape | passed | One sanitized in-memory job event was created. | mock-only |
| Mock backend runtime message shape | passed | One sanitized in-memory mock transport message was acknowledged. | mock-only |
| Storage/source-of-truth expectation | passed | Private manifest/checksum/approved snapshot refs stayed metadata-only and signed/public URLs were rejected as source of truth. | no storage |
| QA/audit/cost expectation | passed | QA/audit/cost remained metadata-only handoff expectations. | no QA/audit/cost rows |

## Runtime Gates

- `controlledPersistedWorkerDispatchSmokePlanRecorded=true`
- `controlledPersistedWorkerDispatchSmokeExecutionRequired=false`
- `controlledPersistedWorkerDispatchSmokeExecuted=true`
- `controlledPersistedWorkerDispatchSmokePassed=true`
- `controlledPersistedWorkerDispatchSmokeResultReviewRequired=true`
- `mockQueueFixtureValidated=true`
- `mockCoordinatorDefaultPathExecuted=true`
- `mockCoordinatorAdapterPreviewPathExecuted=true`
- `mockCoordinatorTransportPreviewPathExecuted=true`
- `mockJobRecordCreated=true`
- `mockIdempotencyRecordCreated=true`
- `mockWorkerLeaseClaimed=true`
- `mockWorkerClaimAttemptCreated=true`
- `mockJobEventCreated=true`
- `mockBackendRuntimeMessageCreated=true`
- `mockRecordsStoredInMemoryOnly=true`
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

## Result

The controlled persisted dispatch smoke executed and passed as a mock-only shape check. It proves the local in-memory persisted dispatch shape can be exercised without real worker dispatch, Cloud Run invocation, inference, generated assets, signed URLs, Supabase mutation, credit mutation, beta, or production.

## Remaining Blocker

The result still requires review before any real worker dispatch readiness claim. Real runtime approval must remain blocked until a later result-review prompt accepts the smoke evidence and defines the next gate.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58BM-CONTROLLED-PERSISTED-WORKER-DISPATCH-SMOKE-RESULT-REVIEW: review controlled persisted Qwen worker dispatch smoke result, no Cloud Run invocation/no inference/no assets/no beta`
