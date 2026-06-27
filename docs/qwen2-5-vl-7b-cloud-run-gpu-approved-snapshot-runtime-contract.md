# Qwen2.5-VL 7B Cloud Run GPU Approved Snapshot Runtime Contract

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_approved_snapshot_runtime_contract_defined_no_inference`

This packet defines the fail-closed approved-snapshot request contract for the Qwen2.5-VL 7B Cloud Run GPU service. It moves the worker shell one step closer to ReeditPro's execution architecture by making the service advertise and validate a structured runtime request shape before any future model path may be considered.

This packet does not run inference, process a prompt, run a forward pass, send a runtime service request, call providers, dispatch production workers, touch Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Inputs

- `approved-plan-snapshot-policy.md`
- `model-routing-policy.md`
- `intent-led-edit-planning.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-vllm-engine-proof-result.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-model-load-proof-result.md`
- `server/workers/qwen2_5_vl_cloud_run_gpu/service.py`

## Contract Purpose

Raw chat must never become a worker input. The Qwen Cloud Run service can only move toward execution through:

```text
user/chat request
→ structured agent findings
→ edit intents
→ approved plan snapshot
→ queue lease / worker contract
→ bounded Qwen runtime request
```

The contract added here is still no-execution. It gives future worker phases a narrow request shape to validate, while keeping model import-on-startup and inference disabled.

## Runtime Contract Shape

| Area | Value |
| --- | --- |
| Contract schema version | `qwen2_5_vl_cloud_run_gpu_runtime_request_v1` |
| Contract status | `contract_defined_execution_disabled` |
| Approved snapshot required | true |
| Queue lease required | true |
| Idempotency key required | true |
| Credit reservation required | true |
| Max request bytes | `65536` |
| Service contract endpoint | `/contract` |
| POST execution allowed | false |

Required request fields:

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

## Source-of-truth Requirements

The future request must carry source-of-truth references rather than raw prompts, public URLs, or signed URLs:

- `sourceOfTruthRefs.supabaseRowRefs`
- `sourceOfTruthRefs.privateManifestRefs`
- `sourceOfTruthRefs.checksumRefs`
- `sourceOfTruthRefs.approvedPlanSnapshotRefs`

Signed URLs, public artifacts, raw provider responses, and raw chat text are not source of truth.

## Allowed Future Task Use Cases

The bounded future task list is intentionally narrow:

- `visual_understanding`
- `broll_candidate_review`
- `frame_asset_qa`
- `caption_visual_consistency_qa`

Qwen2.5-VL remains a visual understanding, b-roll review, and QA stack tool. It is not an AI-video generation provider, not a render/export worker, and not a broad media-processing lane.

## Model Policy Requirements

| Area | Value |
| --- | --- |
| Model ID | `Qwen/Qwen2.5-VL-7B-Instruct` |
| Model revision | `cc594898137f460bfe9f0759e9844b3ce807cfb5` |
| Model aggregate SHA-256 | `46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b` |
| Runtime | `vllm` |
| GPU | `nvidia-l4` |
| Serving profile | `bounded_preview_scale_to_zero` |

The selected cost-friendly runtime remains Cloud Run L4 with scale-to-zero behavior. The broader production GPU decision remains future work if ReeditPro needs longer context, video-heavy prompts, or higher concurrency.

## Runtime Gates Required In Request

Every future request must set these gates to false:

- `rawVlmPromptAllowed=false`
- `providerExecutionAllowed=false`
- `mediaProcessingAllowed=false`
- `publicOutputAllowed=false`
- `trackAExecutionAllowed=false`
- `modelInferenceEnabled=false`

The service still checks environment gates:

- `MODEL_DOWNLOADS_ENABLED=false`
- `RAW_VLM_PROMPT_ENABLED=false`
- `PROVIDER_EXECUTION_ENABLED=false`
- `MEDIA_PROCESSING_ENABLED=false`
- `PUBLIC_OUTPUT_ENABLED=false`
- `TRACK_A_EXECUTION_ENABLED=false`
- `QWEN_MODEL_IMPORT_ON_STARTUP=false`
- `QWEN_INFERENCE_ENABLED=false`
- `QWEN_APPROVED_SNAPSHOT_REQUIRED=true`
- `QWEN_QUEUE_LEASE_REQUIRED=true`

## Raw Prompt Rejection

The service rejects runtime request payloads containing these raw prompt field names anywhere in the JSON object:

- `prompt`
- `raw_prompt`
- `rawPrompt`
- `rawWorkerPrompt`
- `raw_worker_prompt`
- `rawPromptPayload`
- `workerPrompt`

This keeps the worker aligned with the approved snapshot policy: workers execute approved structured plan versions, not raw chat or raw prompts.

## Service Behavior

| Request | Result |
| --- | --- |
| `GET /healthz` | reports fail-closed status and contract metadata |
| `GET /readyz` | reports fail-closed status and contract metadata |
| `GET /contract` | returns the contract metadata |
| Invalid JSON `POST` | `400` with `invalid_json` |
| Oversized `POST` | `413` with `request_too_large` |
| Contract-invalid `POST` | `403` with `qwen_runtime_contract_rejected` |
| Contract-valid `POST` | `403` with `qwen_inference_disabled_after_contract_check` |

Even a fully contract-valid request does not execute in this phase.

## Runtime Gates

- `runtimeContractDefined=true`
- `runtimeContractEndpointAdded=true`
- `postBodyBounded=true`
- `approvedSnapshotRequired=true`
- `queueLeaseRequired=true`
- `idempotencyKeyRequired=true`
- `creditReservationRequired=true`
- `sourceOfTruthRefsRequired=true`
- `rawPromptFieldsRejected=true`
- `contractValidRequestStillExecutes=false`
- `modelImportOnStartup=false`
- `modelInferenceEnabled=false`
- `forwardPassRun=false`
- `promptProcessed=false`
- `inferenceRun=false`
- `serviceRuntimeRequestSent=false`
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

- The Qwen service now exposes an explicit approved-snapshot runtime contract.
- Future runtime requests have a deterministic schema boundary before inference can be considered.
- Raw prompt fields are rejected recursively.
- Source-of-truth references, queue lease, idempotency key, approval record, and credit reservation are required.
- The service still refuses every POST because inference remains disabled.

## What This Does Not Prove

- It does not prove runtime invocation.
- It does not prove inference.
- It does not prove queue lease creation.
- It does not prove approved snapshot row reads.
- It does not prove Supabase mutation.
- It does not prove generated asset creation.
- It does not unlock beta or production.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_31-CLOUD-RUN-GPU-APPROVED-SNAPSHOT-CONTRACT-SMOKE: run local contract handler smoke for valid/invalid request fixtures, no inference`
