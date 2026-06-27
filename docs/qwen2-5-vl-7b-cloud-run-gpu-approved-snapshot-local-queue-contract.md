# Qwen2.5-VL 7B Cloud Run GPU Approved Snapshot Local Queue Contract

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_approved_snapshot_local_queue_contract_defined_no_dispatch_no_inference`

This packet defines the local queue handoff shape for future Qwen2.5-VL approved-snapshot jobs. It composes the existing ReeditPro worker queue envelope with the Qwen Cloud Run GPU approved-snapshot runtime contract, but it does not dispatch a worker, invoke Cloud Run, import the model, initialize vLLM, run inference, touch Supabase, execute SQL, mutate credits, create generated assets, publish artifacts, create signed URLs, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Inputs

- `server/validation/worker-schemas.ts`
- `server/validation/job-schemas.ts`
- `src/types/worker-lease.ts`
- `src/backend/workers/sfx-worker-contracts.ts`
- `src/backend/workers/lyria-worker-contracts.ts`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-runtime-contract.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-contract-smoke-result.md`
- `server/workers/qwen2_5_vl_cloud_run_gpu/service.py`

## Handoff Path

Raw chat must not become a worker input. The only acceptable future path is:

```text
user/chat request
→ structured agent findings
→ edit intents
→ approved plan snapshot
→ credit reservation
→ queue lease / worker contract
→ bounded Qwen runtime request
```

The local queue contract remains metadata-only. It shows what a future queue item must carry before any later worker-dispatch prompt can be considered.

## Queue Envelope

The future queue item must satisfy the existing `runWorkerJobSchema`.

| Field | Required | Value / policy |
| --- | --- | --- |
| `workspaceId` | yes | Workspace source-of-truth reference |
| `projectId` | yes for this contract | Project source-of-truth reference |
| `workerType` | yes | `qwen2_5_vl_cloud_run_gpu_worker` |
| `workerInstanceId` | yes for this contract | Local mock worker instance reference |
| `idempotencyKey` | yes | Stable approved-snapshot job idempotency key |
| `dryRun` | yes | `true` for the local fixture |
| `jobType` | yes | `media_analysis` |
| `approvedPlanSnapshotId` | yes | Must match the runtime payload |
| `creditReservationId` | yes | Must match the runtime payload |
| `payloadJson` | yes | Bounded Qwen runtime request shape |

Qwen2.5-VL remains a visual understanding, b-roll review, frame asset QA, and caption/visual consistency QA tool. It is not a provider generation route, final render/export worker, public artifact delivery path, or broad media-processing lane.

## Runtime Payload

The `payloadJson` value must carry the approved-snapshot runtime request fields already defined by the Cloud Run service contract:

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

The `payloadJson.sourceOfTruthRefs` block must include Supabase row references, private manifest references, checksum references, and approved snapshot references. Signed URLs, public URLs, raw chat text, raw model prompts, and provider responses are not source of truth.

## Model Policy

| Area | Required value |
| --- | --- |
| Model ID | `Qwen/Qwen2.5-VL-7B-Instruct` |
| Model revision | `cc594898137f460bfe9f0759e9844b3ce807cfb5` |
| Model aggregate SHA-256 | `46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b` |
| Runtime | `vllm` |
| GPU | `nvidia-l4` |
| Serving profile | `bounded_preview_scale_to_zero` |

The selected runtime remains Cloud Run GPU with one L4 and scale-to-zero service settings. This contract does not change GPU capacity, service configuration, model cache, or image configuration.

## Runtime Gates

Every local queue fixture and future queue payload must keep these gates false:

- `rawVlmPromptAllowed=false`
- `providerExecutionAllowed=false`
- `mediaProcessingAllowed=false`
- `publicOutputAllowed=false`
- `trackAExecutionAllowed=false`
- `modelInferenceEnabled=false`

The local queue contract also keeps dispatch and runtime invocation closed:

- `dispatchAllowedNow=false`
- `cloudRunInvocationAllowedNow=false`
- `inferenceAllowedNow=false`
- `serviceRuntimeRequestSent=false`

## Accepted Local Fixture

The deterministic local fixture is accepted only for future dispatch planning. It includes:

- Approved plan snapshot reference.
- Approval record reference.
- Credit reservation reference.
- Queue lease reference.
- Idempotency key.
- Source-of-truth references.
- Qwen model policy.
- False runtime gates.
- One bounded task use case.

`acceptedForFutureDispatch=true` means the shape is suitable for a later dispatch-readiness prompt. It does not mean dispatch is allowed now.

## Blocked Fixtures

The local queue contract rejects these future bypasses:

- Missing approved plan snapshot.
- Missing credit reservation.
- Missing queue lease.
- Raw prompt payload fields.
- Signed URL or public URL as source of truth.
- Enabled runtime gate.
- Model policy mismatch.
- Worker type mismatch.

## Runtime Flags

- `localQueueContractDefined=true`
- `validQueueFixtureMatchesRunWorkerJobSchema=true`
- `validQueueFixtureAcceptedForFutureDispatch=true`
- `dispatchAllowedNow=false`
- `cloudRunInvocationAllowedNow=false`
- `serviceRuntimeRequestSent=false`
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

- ReeditPro has a local queue fixture shape for Qwen approved-snapshot jobs.
- The queue envelope matches `runWorkerJobSchema`.
- The nested payload matches the approved-snapshot runtime contract.
- Required approval, credit, lease, idempotency, and source-of-truth references are represented.
- Raw prompt and signed URL source-of-truth bypasses remain blocked.

## What This Does Not Prove

- It does not prove job creation.
- It does not prove queue claim or lease creation.
- It does not prove worker dispatch.
- It does not prove Cloud Run invocation.
- It does not prove model import, model load, vLLM startup, or inference.
- It does not prove Supabase mutation, credit mutation, generated asset creation, public artifact delivery, beta readiness, or production readiness.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_33-CLOUD-RUN-GPU-APPROVED-SNAPSHOT-DISPATCH-READINESS: audit Worker Runtime dispatch readiness for Qwen approved-snapshot jobs, no dispatch`
