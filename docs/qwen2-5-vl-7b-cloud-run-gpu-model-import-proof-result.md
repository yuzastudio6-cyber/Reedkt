# Qwen2.5-VL 7B Cloud Run GPU Model Import Proof Result

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_model_import_proof_passed_no_weight_load_no_inference`

This packet records a bounded Cloud Run L4 model-import proof for the fail-closed Qwen2.5-VL 7B worker image. A one-off Cloud Run Job used the same pushed Qwen image, dedicated private model-cache bucket, read-only GCSFuse mount, and GPU worker service account to prove CUDA visibility and package/model metadata import from the mounted cache.

This packet does not load Qwen weights, run inference, send a runtime service request, call providers, dispatch production workers, touch Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Inputs

- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-mount-read-proof-result.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-deploy-result.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-image-build-result.md`
- `docker/prod/qwen2-5-vl-cloud-run-gpu/Dockerfile`
- `docker/prod/qwen2-5-vl-cloud-run-gpu/requirements.qwen2-5-vl.txt`
- `server/workers/qwen2_5_vl_cloud_run_gpu/service.py`
- `model-routing-policy.md`
- `open-source-tool-registry.md`
- `approved-plan-snapshot-policy.md`

## Import Proof Execution

| Area | Value |
| --- | --- |
| Proof job | `qwen25vl-model-import-proof-0627012628` |
| Proof execution | `qwen25vl-model-import-proof-0627012628-8x8p9` |
| Execution created | `2026-06-27T01:26:32.402408Z` |
| Execution started | `2026-06-27T01:26:36.214386Z` |
| Execution completed | `2026-06-27T01:29:31.386619Z` |
| Completion status | success |
| Execution duration | `2m55.17s` |
| Script elapsed time | `26.443s` |
| GPU | `1` x `nvidia-l4` |
| CPU | `4` |
| Memory | `16Gi` |
| Retry count | `0` |
| Proof job deleted | true |
| Remaining proof jobs | none observed |

## Runtime Image And Mount

| Area | Value |
| --- | --- |
| Image digest | `sha256:572acc29405cee48a42baf98f39d949915b8ef14df638736b886673efc47b630` |
| Runtime identity | `reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com` |
| Bucket | `reeditpro-staging-reeditpro-model-cache` |
| Mount path | `/models/qwen2.5-vl-7b-instruct` |
| Model revision | `cc594898137f460bfe9f0759e9844b3ce807cfb5` |
| Expected aggregate SHA-256 | `46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b` |
| Mount read-only | true |

## CUDA And Package Imports

| Area | Value |
| --- | --- |
| Torch imported | true |
| Torch version | `2.8.0+cu128` |
| CUDA available | true |
| CUDA device count | `1` |
| CUDA device name | `NVIDIA L4` |
| CUDA total memory bytes | `23583784960` |
| Transformers imported | true |
| Transformers version | `4.57.1` |
| vLLM imported | true |
| vLLM version | `0.11.0` |
| Qwen VL utils imported | true |
| Qwen VL utils module | `qwen_vl_utils` |

## Local Model Metadata Imports

| Area | Value |
| --- | --- |
| `AutoConfig.from_pretrained(..., local_files_only=true)` | true |
| `AutoTokenizer.from_pretrained(..., local_files_only=true)` | true |
| `AutoProcessor.from_pretrained(..., local_files_only=true)` | true |
| Qwen model class imported | true |
| Model type | `qwen2_5_vl` |
| Architecture | `Qwen2_5_VLForConditionalGeneration` |
| Hidden size | `3584` |
| Hidden layers | `28` |
| Tokenizer class | `Qwen2TokenizerFast` |
| Tokenizer vocab size | `151643` |
| Processor class | `Qwen2_5_VLProcessor` |

## Fail-closed Runtime Gates

- `gpuRequested=true`
- `torchImported=true`
- `cudaAvailable=true`
- `cudaL4Visible=true`
- `transformersImported=true`
- `qwenVlUtilsImported=true`
- `vllmImported=true`
- `autoConfigImportedFromMount=true`
- `autoTokenizerImportedFromMount=true`
- `autoProcessorImportedFromMount=true`
- `qwenModelClassImported=true`
- `modelWeightsLoaded=false`
- `modelLoadRun=false`
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

- The Qwen Cloud Run image can start on one NVIDIA L4 with CUDA visible.
- The installed runtime dependencies are compatible enough to import Torch, Transformers, vLLM, and Qwen VL utilities.
- The pinned Qwen cache can be used as a local-only source for `AutoConfig`, `AutoTokenizer`, and `AutoProcessor`.
- The Qwen2.5-VL model class is importable in the worker image.
- The dedicated private bucket and read-only mount remain compatible with the import path.

## What This Does Not Prove

- It does not prove model weight load.
- It does not prove vLLM engine initialization.
- It does not prove inference.
- It does not prove request routing.
- It does not prove approved snapshot enforcement at runtime.
- It does not prove Supabase queue/lease integration.
- It does not prove generated asset creation.
- It does not unlock beta or production.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_28-CLOUD-RUN-GPU-MODEL-LOAD-PROOF: verify Qwen weight load from private mount on L4, no inference`
