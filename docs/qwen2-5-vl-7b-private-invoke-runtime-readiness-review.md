# Qwen2.5-VL 7B Private Invoke Runtime Readiness Review

Decision: `qwen2_5_vl_private_invoke_runtime_readiness_review_first_fixture_inference_plan_required`.

This packet reviews the completed private-invoke contract smoke for the Qwen2.5-VL 7B ReeditPro stack tool and defines the remaining evidence required before any first approved-fixture inference smoke can be planned. The private caller path is proven: the dedicated CPU-only Cloud Run caller job reached the internal GPU service and observed HTTP `403` with `qwen_inference_disabled_after_contract_check`, `contractSatisfiedForFutureRuntime=true`, `runtimeContractExecutesNow=false`, and `modelInferenceEnabled=false`.

This review does not enable model import, model load, vLLM engine initialization, Qwen inference, worker dispatch, Supabase mutation, SQL, generated assets, public artifacts, signed URLs, credit mutation, beta, production, `dry_run_passed`, or `generated_local_fixture_passed`.

## Current Runtime Position

- private invoke contract path: ready
- selected runtime: Google Cloud Run GPU
- selected GPU: NVIDIA L4
- target region: `us-central1`
- target service: `reeditpro-qwen2-5-vl-l4-worker`
- cost posture: run-on-use with scale to zero
- minimum instances: 0
- initial maximum instances: 1
- CPU fallback for real Qwen VLM inference: false
- first approved-fixture inference smoke ready: false
- runtime ready: false
- beta ready: false
- production ready: false

NVIDIA L4 remains the best current GPU choice for this stack because it is cost-friendly for bounded visual-understanding requests, can run through Cloud Run GPU, and can preserve a stop-when-idle posture instead of an always-on GPU VM.

## Evidence Accepted By This Review

| Area | Status | Evidence |
| --- | --- | --- |
| Private caller path | ready | CPU-only caller source, image, Cloud Run Job, service account, Direct VPC egress, and narrow invoker path are in place. |
| Fail-closed contract response | ready | The controlled caller execution observed HTTP `403` with `qwen_inference_disabled_after_contract_check`. |
| Runtime contract safety | ready | The service response asserted `contractSatisfiedForFutureRuntime=true`, `runtimeContractExecutesNow=false`, and `modelInferenceEnabled=false`. |
| GPU posture | ready | The selected runtime remains Cloud Run GPU with NVIDIA L4, min instances 0, and initial max scale 1. |
| Persistent fail-closed configuration | ready | CPU caller and GPU service configs remain fail-closed after the contract smoke. |

## First Approved-Fixture Inference Smoke Requirements

A future first inference smoke may be planned only after a separate prompt defines all required fixture contracts. That future plan must require:

- approved plan snapshot reference and immutable approved plan version;
- approval record reference or accepted local-fixture approval placeholder;
- credit reservation evidence or accepted no-spend fixture gate;
- worker job id, queue lease metadata, and idempotency key;
- private source artifact or private sampled-frame reference;
- private artifact manifest with checksum and provenance;
- timing or segment reference when the frame belongs to a planned edit segment;
- model revision and model-weight checksum metadata;
- runtime target of Cloud Run GPU NVIDIA L4 in `us-central1`;
- model import/load/inference enabled only inside that future smoke execution;
- bounded single request, no batch, no user traffic, max scale 1, and no min instances;
- output as private metadata-only JSON;
- no generated asset row, no public artifact, no public URL source of truth, no signed URL source of truth, no render/export, no beta, and no production claim.

## Allowed Future Metadata Use Cases

- `visual_understanding`
- `broll_candidate_review`
- `frame_asset_qa`
- `caption_visual_consistency_qa`

These use cases are metadata and QA support only. Qwen must not generate B-roll video, replace Wan or LTX generation routes, replace deterministic OCR when exact text matters, render final output, export media, publish artifacts, or execute raw chat.

## Runtime Gates

- `privateInvokeContractPathReady=true`
- `firstApprovedFixtureInferenceSmokeReady=false`
- `runtimeReady=false`
- `betaReady=false`
- `productionReady=false`
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
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## Blocked Uses

- raw chat or raw prompt execution
- frontend/browser model runtime
- unbounded video analysis
- public or signed URL fixture input as source of truth
- generated B-roll video creation
- generated asset creation
- final render, mux, export, or delivery
- beta, production, or paid production traffic

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_57-APPROVED-FIXTURE-INFERENCE-SMOKE-PLAN: define first private approved-fixture Qwen inference smoke, no execution`
