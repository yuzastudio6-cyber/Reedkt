# Qwen2.5-VL 7B Controlled Persisted Worker Dispatch Runtime Smoke Plan

Status: `runtime_smoke_plan_recorded`

Decision:
`qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_smoke_plan_recorded_smoke_execution_required`

This packet plans the controlled persisted Qwen worker dispatch runtime smoke for the implemented fail-closed runtime boundary. It is a smoke-plan-only gate. It does not run the smoke, dispatch workers, invoke Cloud Run, run Qwen inference, create generated assets, create signed URLs, mutate Supabase, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Inputs

- Runtime implementation: `src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts`
- Runtime implementation evidence: `src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-implementation.ts`
- Runtime implementation doc: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-implementation.md`
- Runtime plan: `docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-plan.md`
- Local queue contract: `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract.ts`
- Worker schema: `server/validation/worker-schemas.ts`
- Idempotency service: `src/backend/runtime/idempotency-service.ts`
- Worker lease service: `src/backend/runtime/worker-lease-service.ts`
- Fail-closed Qwen adapter: `src/backend/workers/qwen2-5-vl-cloud-run-gpu-dispatch-adapter.ts`
- Private invoke envelope: `src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-envelope.ts`
- Private invoke transport adapter: `src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter.ts`

## Selected Runtime

- Platform: `google_cloud_run_gpu`
- GPU: `nvidia_l4` (`NVIDIA L4`)
- Region: `us-central1`
- Service: `reeditpro-qwen2-5-vl-l4-worker`
- Cost posture: `scale_to_zero_required`
- Minimum instances: `0`
- Initial max instances: `1`
- CPU fallback: `false`

The future runtime still must scale to zero when idle. This smoke plan does not start a GPU service and does not create an always-on GPU cost.

## Source-Of-Truth Path

The smoke must use persisted approved references only:

```text
structured agent findings
+ edit intents
+ approved plan snapshot
+ credit reservation
+ private manifest refs
+ checksum refs
+ persisted worker job
```

Signed URLs and public URLs must remain rejected as source of truth.

## Planned Smoke Assertions

| Assertion | Planned result | Required evidence |
| --- | --- | --- |
| Default runtime path | `blocked_real_lease_backend_required` | Runtime stops at backend/service-role lease requirement before adapter or transport checks. |
| Adapter preview path | `blocked_qwen_dispatch_adapter_fail_closed` | Preview continuation reaches fail-closed Qwen adapter without dispatch submission. |
| Transport preview path | `blocked_private_invoke_transport_preview_only` | Preview continuation reaches private invoke transport preview without resolving URLs, fetching identity tokens, or calling dependencies. |
| Idempotency conflict path | `blocked_idempotency_conflict` | Duplicate idempotency key with conflicting source id is blocked. |
| Missing approved snapshot path | `blocked_missing_approved_snapshot` | Missing approved plan snapshot refs are blocked before idempotency, lease, adapter, or transport checks. |
| Missing credit reservation path | `blocked_missing_credit_reservation` | Missing credit reservation refs are blocked before idempotency, lease, adapter, or transport checks. |
| Missing source-of-truth path | `blocked_missing_source_of_truth_refs` | Missing private refs and signed/public URL source-of-truth attempts are blocked. |
| Invalid worker job schema path | `blocked_invalid_worker_job_schema` | Invalid worker job envelopes are blocked before local queue or runtime checks. |
| Runtime step coverage | metadata-only coverage required | Smoke observes step ids from schema validation through cleanup boundary. |
| Side-effect gate coverage | all side effects false | Smoke proves Cloud Run invocation, inference, Supabase mutation, generated assets, signed URLs, credits, beta, and production remain false. |

## Required Blocked Bypasses

- `raw_chat_worker_input`
- `raw_prompt_payload_fields`
- `raw_model_output_persistence`
- `signed_url_source_of_truth`
- `public_url_source_of_truth`
- `frontend_browser_invocation`
- `direct_cloud_run_service_url_exposure`
- `token_or_bearer_header_persistence`
- `provider_secret_persistence`
- `service_role_key_value_persistence`
- `database_url_persistence`
- `duplicate_active_worker_claims`
- `missing_credit_reservation`
- `missing_approved_snapshot`
- `missing_private_storage_checksum_manifest`
- `generated_asset_row_before_qa_storage_acceptance`
- `beta_or_production_readiness_claim`

## Runtime Gates

- `controlledPersistedWorkerDispatchRuntimeImplementationRequired=false`
- `controlledPersistedWorkerDispatchRuntimeImplemented=true`
- `controlledPersistedWorkerDispatchRuntimeSmokePlanRequired=false`
- `controlledPersistedWorkerDispatchRuntimeSmokePlanRecorded=true`
- `controlledPersistedWorkerDispatchRuntimeSmokeExecutionRequired=true`
- `controlledPersistedWorkerDispatchRuntimeSmokeExecuted=false`
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

## What This Proves

- The controlled persisted worker dispatch runtime smoke is now planned.
- The implemented runtime has a targeted validation path before any real worker dispatch readiness claim.
- The next gate is smoke execution, still without Cloud Run invocation, inference, generated assets, beta, or production.

## What This Does Not Prove

- It does not execute the smoke.
- It does not dispatch a worker.
- It does not invoke Cloud Run or Qwen.
- It does not create generated assets, public artifacts, signed URLs, QA rows, audit rows, credit rows, beta readiness, or production readiness.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58BQ-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-SMOKE-EXECUTION: run controlled persisted Qwen worker dispatch runtime smoke, no Cloud Run invocation/no inference/no assets/no beta`
