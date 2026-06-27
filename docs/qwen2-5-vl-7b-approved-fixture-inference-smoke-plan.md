# Qwen2.5-VL 7B Approved Fixture Inference Smoke Plan

Decision: `qwen2_5_vl_approved_fixture_inference_smoke_plan_defined_no_execution`.

This packet defines the first private approved-fixture inference smoke for Qwen2.5-VL 7B. It is a plan only. It does not import the model, load model weights, initialize vLLM, run inference, dispatch a worker, mutate Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, process media, render/export, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Evidence

- `docs/qwen2-5-vl-7b-private-invoke-runtime-readiness-review.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-runtime-contract.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-local-queue-contract.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-transport-adapter.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-invoke-cpu-caller-contract-smoke-result.md`

## Selected Runtime

- platform: Google Cloud Run GPU
- GPU: NVIDIA L4
- region: `us-central1`
- service: `reeditpro-qwen2-5-vl-l4-worker`
- runtime: `vllm`
- model: `Qwen/Qwen2.5-VL-7B-Instruct`
- model revision: `cc594898137f460bfe9f0759e9844b3ce807cfb5`
- model aggregate SHA-256: `46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b`
- cost posture: run-on-use, scale-to-zero, minimum instances 0, initial max scale 1
- CPU fallback for real Qwen VLM inference: false

NVIDIA L4 remains the correct cost-friendly GPU for the first bounded fixture because it is already the selected Cloud Run GPU target, supports the existing vLLM package path, and avoids an always-on GPU instance.

## Future Smoke Fixture Shape

The future execution prompt must use one deterministic, private, approved-snapshot fixture derived from the existing Qwen local queue contract. Required fixture fields:

- approved plan snapshot id and hash;
- approval record id;
- credit reservation id or accepted no-spend fixture reservation placeholder;
- worker job id;
- queue lease metadata;
- idempotency key;
- structured finding ids;
- edit intent ids;
- private media or sampled-frame reference;
- source-of-truth refs for Supabase rows, private manifests, checksums, and approved snapshot refs;
- model policy matching the revision and checksum listed above;
- runtime gates carried in the payload;
- metadata-only requested output.

The future smoke may use only private reference metadata. Public URLs and signed URLs are not source of truth.

## Allowed Use Case Ranking

1. `visual_understanding`: first fixture target because it proves the smallest useful private-frame metadata path.
2. `frame_asset_qa`: second, for private generated/still asset visual QA after source-of-truth references exist.
3. `broll_candidate_review`: third, for candidate relevance review after B-roll candidates exist.
4. `caption_visual_consistency_qa`: fourth, advisory only after deterministic OCR and safe-zone checks.

Qwen must not generate B-roll video, replace Wan/LTX/Mochi/Hunyuan generation routes, replace deterministic OCR for exact text, process broad media, render, mux, export, or publish artifacts.

## Future Execution Envelope

A later execution prompt may enable exactly one bounded private request only after repeating the safety preflight:

- approved snapshot and queue fixture validation pass;
- private caller path remains proven;
- service remains internal/private;
- model import/load/inference gates are intentionally enabled only for the single fixture request;
- max scale remains 1 and minimum instances remain 0;
- no batch traffic and no user traffic;
- no retry unless the idempotency policy is explicitly accepted;
- output is metadata-only JSON;
- result is recorded as fixture evidence only.

## Required Future Response Evidence

The future smoke must capture a sanitized summary only:

- execution id;
- runtime revision or service revision;
- model revision/checksum confirmation;
- selected use case;
- private fixture id;
- request id;
- idempotency key reference;
- elapsed duration;
- metadata-output shape;
- inference attempted and completed booleans;
- no generated asset, no public artifact, no signed URL, no render/export, no beta, no production.

No identity token value, service URL value, provider credential, private media bytes, model output image/video asset, or database connection string may be stored in docs or mock specs.

## Runtime Gates In This Plan

- `approvedFixtureInferenceSmokePlanDefined=true`
- `approvedQueueFixtureAvailable=true`
- `privateInvokeContractPathReady=true`
- `selectedGpu=nvidia_l4`
- `modelRevisionPinned=true`
- `firstApprovedFixtureInferenceSmokeExecuted=false`
- `modelImportRun=false`
- `modelLoadRun=false`
- `vllmEngineInitialized=false`
- `inferenceRun=false`
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

## Blocked Until Future Execution Prompt

- any model import, model load, vLLM startup, forward pass, or inference;
- any worker dispatch or queue mutation;
- any Supabase row creation or SQL;
- any generated asset row, public artifact, signed URL, render, mux, or export;
- any beta or production traffic;
- any raw prompt or raw chat request;
- any unbounded media input.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58-APPROVED-FIXTURE-INFERENCE-SMOKE-EXECUTE: run first private approved-fixture Qwen inference smoke, no generated assets/no beta`
