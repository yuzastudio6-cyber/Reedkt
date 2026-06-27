# Qwen2.5-VL 7B Cloud Run GPU Approved Snapshot Contract Smoke Result

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_approved_snapshot_contract_smoke_passed_no_inference`

This packet records a local-only smoke for the Qwen2.5-VL 7B fail-closed worker shell. The smoke starts the Python handler on localhost with bytecode disabled, exercises the approved-snapshot contract paths, and shuts the handler down. It does not use Cloud Run, Google Cloud, model import, model load, vLLM engine initialization, inference, providers, workers, Supabase, SQL, storage, public artifacts, signed URLs, credits, beta, or production.

## Source Inputs

- `server/workers/qwen2_5_vl_cloud_run_gpu/service.py`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-runtime-contract.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-vllm-engine-proof-result.md`
- `src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-runtime-contract.ts`

## Smoke Coverage

| Case | Expected result |
| --- | --- |
| `GET /healthz` | `200`, fail-closed gates true, no runtime side effects |
| `GET /contract` | `200`, returns `qwen2_5_vl_cloud_run_gpu_runtime_request_v1` |
| invalid JSON `POST` | `400`, `invalid_json` |
| oversized `POST` | `413`, `request_too_large` |
| missing-field `POST` | `403`, `qwen_runtime_contract_rejected` |
| nested raw prompt `POST` | `403`, `raw_prompt_field_blocked` reason |
| valid approved-snapshot contract `POST` | `403`, `qwen_inference_disabled_after_contract_check` |

The valid approved-snapshot fixture proves only that the request shape can satisfy the future contract. It still cannot execute because `QWEN_INFERENCE_ENABLED=false` and the handler returns `403`.

## Required Valid Contract Fields

- `schemaVersion`
- `requestId`
- `approvedPlanSnapshotId`
- `approvedPlanSnapshotHash`
- `approvalRecordId`
- `creditReservationId`
- `jobId`
- `queueLease`
- `idempotencyKey`
- `sourceOfTruthRefs`
- `modelPolicy`
- `runtimeGates`
- `task`

## Runtime Gates

- `localHandlerStarted=true`
- `localHandlerStopped=true`
- `contractEndpointChecked=true`
- `healthEndpointChecked=true`
- `invalidJsonRejected=true`
- `oversizedRequestRejected=true`
- `missingFieldsRejected=true`
- `rawPromptRejected=true`
- `validContractAcceptedForFutureRuntime=true`
- `validContractStillExecutes=false`
- `cloudRunTouched=false`
- `gcpMutationCreated=false`
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
- `creditMutationCreated=false`
- `betaUnlocked=false`
- `productionUnlocked=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## What This Proves

- The local handler exposes the runtime contract endpoint.
- The local handler rejects invalid JSON and oversized payloads.
- The local handler rejects contract payloads missing required approved-snapshot fields.
- The local handler recursively blocks raw prompt fields.
- A fully structured future approved-snapshot payload can satisfy the contract checker.
- Even a valid contract still cannot trigger inference in this phase.

## What This Does Not Prove

- It does not prove Cloud Run invocation.
- It does not prove model import, model load, vLLM engine initialization, or inference.
- It does not prove Supabase queue/lease reads or writes.
- It does not prove generated asset creation.
- It does not unlock beta or production.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_32-CLOUD-RUN-GPU-APPROVED-SNAPSHOT-LOCAL-QUEUE-CONTRACT: define local queue payload handoff fixtures for Qwen approved-snapshot jobs, no inference`
