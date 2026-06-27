# Qwen2.5-VL 7B Cloud Run GPU Model Load Proof Result

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_model_load_proof_passed_no_inference`

This packet records a bounded Cloud Run L4 model-weight load proof for the fail-closed Qwen2.5-VL 7B worker image. A one-off Cloud Run Job used the dedicated private model-cache bucket, read-only GCSFuse mount, pushed Qwen image, and GPU worker service account to prove the Qwen2.5-VL weights can load onto one NVIDIA L4 in `bfloat16`.

This packet does not run inference, run a forward pass, process a prompt, send a runtime service request, call providers, dispatch production workers, touch Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Inputs

- `docs/qwen2-5-vl-7b-cloud-run-gpu-model-import-proof-result.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-mount-read-proof-result.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-deploy-result.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-image-build-result.md`
- `docker/prod/qwen2-5-vl-cloud-run-gpu/Dockerfile`
- `docker/prod/qwen2-5-vl-cloud-run-gpu/requirements.qwen2-5-vl.txt`
- `server/workers/qwen2_5_vl_cloud_run_gpu/service.py`

## Load Proof Execution

| Area | Value |
| --- | --- |
| Proof job | `qwen25vl-model-load-proof-0627013557` |
| Proof execution | `qwen25vl-model-load-proof-0627013557-t9d4z` |
| Execution created | `2026-06-27T01:36:00.777613Z` |
| Execution started | `2026-06-27T01:36:06.245079Z` |
| Execution completed | `2026-06-27T01:44:58.004667Z` |
| Completion status | success |
| Execution duration | `8m51.75s` |
| Script elapsed time | `440.926s` |
| Checkpoint load time | `46.239s` |
| GPU | `1` x `nvidia-l4` |
| CPU | `8` |
| Memory | `32Gi` |
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

## Load Strategy

| Area | Value |
| --- | --- |
| Loader | `Qwen2_5_VLForConditionalGeneration.from_pretrained` |
| Load dtype | `bfloat16` |
| Attention implementation | `eager` |
| Accelerate imported | false |
| Accelerate missing reason | `No module named 'accelerate'` |
| Load strategy | `transformers_from_pretrained_then_to_cuda` |
| Model moved to CUDA | true |
| Model eval set | true |
| Model deleted before exit | true |
| CUDA cache cleared before exit | true |

The current Qwen image does not include `accelerate`, so this proof used the non-Accelerate Transformers path and moved the loaded model to CUDA. That is acceptable for proving the L4 can hold the model, but the production serving path should still prefer vLLM engine initialization before any inference route is attempted.

## CUDA And Model Load Metrics

| Area | Value |
| --- | --- |
| Torch imported | true |
| Torch version | `2.8.0+cu128` |
| Transformers imported | true |
| Transformers version | `4.57.1` |
| CUDA available | true |
| CUDA device count | `1` |
| CUDA device name | `NVIDIA L4` |
| CUDA total memory bytes | `23583784960` |
| Parameter count | `8292166656` |
| CUDA parameter count | `8292166656` |
| Parameter dtype | `torch.bfloat16` |
| Parameter device | `cuda:0` |
| CUDA memory allocated before load | `0` |
| CUDA memory reserved before load | `0` |
| CUDA memory allocated after load | `16584369664` |
| CUDA memory reserved after load | `16590569472` |
| CUDA memory allocated after cleanup | `1089994752` |
| CUDA memory reserved after cleanup | `1111490560` |

## Runtime Gates

- `cloudRunGpuJobCreated=true`
- `cloudRunGpuJobDeleted=true`
- `gpuRequested=true`
- `torchImported=true`
- `transformersImported=true`
- `cudaAvailable=true`
- `cudaL4Visible=true`
- `modelWeightsLoaded=true`
- `modelLoadRun=true`
- `modelMovedToCuda=true`
- `modelEvalSet=true`
- `parameterCountComputed=true`
- `modelDeletedBeforeExit=true`
- `cudaCacheClearedBeforeExit=true`
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

- The selected cost-friendly L4 target can hold Qwen2.5-VL 7B weights in `bfloat16`.
- The private model-cache mount can feed full checkpoint loading, not only metadata reads.
- All model parameters were present on `cuda:0`.
- The proof remains no-inference and no-forward-pass.
- The one-off Cloud Run Job stops after use and was deleted.

## What This Does Not Prove

- It does not prove vLLM engine initialization.
- It does not prove request serving.
- It does not prove inference.
- It does not prove approved snapshot enforcement at runtime.
- It does not prove Supabase queue/lease integration.
- It does not prove generated asset creation.
- It does not unlock beta or production.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_29-CLOUD-RUN-GPU-VLLM-ENGINE-PROOF: verify vLLM engine initialization from private mount on L4, no inference`
