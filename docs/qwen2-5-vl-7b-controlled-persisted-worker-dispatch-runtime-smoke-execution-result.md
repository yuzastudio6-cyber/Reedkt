# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Smoke Execution Result

Decision: `qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_smoke_executed_mock_only_result_review_required`.

This packet records the controlled persisted Qwen worker dispatch runtime smoke execution. The smoke executed only in local TypeScript/mock memory against the fail-closed runtime implementation. It exercised default lease-boundary blocking, adapter preview blocking, private invoke transport preview blocking, idempotency conflict blocking, approved snapshot blocking, credit reservation blocking, private source-of-truth blocking, and invalid worker job schema blocking.

This does not create real persisted rows. It does not run SQL, mutate Supabase cloud, deploy migrations, resolve service URLs, fetch identity tokens, create auth headers, invoke Cloud Run, import or load Qwen, initialize vLLM, run inference, dispatch workers, upload storage objects, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Smoke Inputs

- Plan packet: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-smoke-plan.md`
- Runtime implementation: `src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts`
- Queue fixture: `QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture`
- Runtime smoke plan spec: `QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_PLAN`
- Selected runtime: NVIDIA L4, scale to zero required, minimum instances 0, initial max instances 1

## Executed Mock Checks

| Check | Result | Evidence | Runtime effect |
| --- | --- | --- | --- |
| Default runtime path | blocked as expected | `blocked_real_lease_backend_required` proves real lease mutation remains backend-required by default. | no real lease |
| Adapter preview path | blocked as expected | `blocked_qwen_dispatch_adapter_fail_closed` proves Qwen dispatch adapter remains fail-closed. | no worker dispatch |
| Transport preview path | blocked as expected | `blocked_private_invoke_transport_preview_only` proves transport preview does not resolve URLs, fetch tokens, or call dependencies. | no Cloud Run |
| Idempotency conflict path | blocked as expected | `blocked_idempotency_conflict` proves duplicate idempotency with a different source is rejected. | mock-only |
| Missing approved snapshot path | blocked as expected | `blocked_missing_approved_snapshot` proves workers still require approved snapshots. | no worker execution |
| Missing credit reservation path | blocked as expected | `blocked_missing_credit_reservation` proves credit reservation references remain required before dispatch. | no credit mutation |
| Missing private source-of-truth refs path | blocked as expected | `blocked_missing_source_of_truth_refs` proves private row, manifest, checksum, and approved snapshot refs are required. | no storage |
| Invalid worker job schema path | blocked as expected | `blocked_invalid_worker_job_schema` proves invalid envelopes stop before runtime checks. | no runtime work |
| Runtime step coverage | passed | Transport preview reached schema, queue, snapshot/credit/source refs, idempotency, lease, adapter, envelope, transport, QA/audit/cost/credit, and cleanup boundaries. | no side effects |
| Side-effect gate coverage | passed | Every unsafe runtime flag remains false across the executed paths. | no runtime execution |

## Runtime Gates

- `controlledPersistedWorkerDispatchRuntimeSmokePlanRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeSmokeExecutionRequired=false`
- `controlledPersistedWorkerDispatchRuntimeSmokeExecuted=true`
- `controlledPersistedWorkerDispatchRuntimeSmokePassed=true`
- `controlledPersistedWorkerDispatchRuntimeSmokeResultReviewRequired=true`
- `defaultRuntimeLeaseBoundaryBlocked=true`
- `adapterPreviewBoundaryBlocked=true`
- `transportPreviewBoundaryBlocked=true`
- `idempotencyConflictBlocked=true`
- `missingApprovedSnapshotBlocked=true`
- `missingCreditReservationBlocked=true`
- `missingSourceOfTruthRefsBlocked=true`
- `invalidWorkerJobSchemaBlocked=true`
- `allRequiredRuntimeStatusesObserved=true`
- `transportPreviewReachedAllRuntimeBoundaries=true`
- `selectedGpuL4=true`
- `scaleToZeroRequired=true`
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

## Result

The controlled persisted worker dispatch runtime smoke executed and passed as a mock-only shape check. It proves the fail-closed runtime implementation returns the planned blocked statuses and reaches the expected runtime boundaries without real worker dispatch, Cloud Run invocation, inference, generated assets, signed URLs, Supabase mutation, credit mutation, beta, or production.

## Remaining Blocker

The result still requires review before any real worker dispatch readiness claim. Real runtime approval must remain blocked until a later result-review prompt accepts the smoke evidence and defines the next gate.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58BR-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-SMOKE-RESULT-REVIEW: review controlled persisted Qwen worker dispatch runtime smoke result, no Cloud Run invocation/no inference/no assets/no beta`
