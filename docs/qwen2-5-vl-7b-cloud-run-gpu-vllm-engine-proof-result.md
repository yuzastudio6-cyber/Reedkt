# Qwen2.5-VL 7B Cloud Run GPU vLLM Engine Proof Result

## Status

Decision: `qwen2_5_vl_7b_cloud_run_gpu_vllm_engine_proof_passed_bounded_l4_no_inference`

This packet records a bounded Cloud Run L4 vLLM engine initialization proof for the fail-closed Qwen2.5-VL 7B worker image. The proof used the dedicated private model-cache bucket, read-only GCSFuse mount, compiler-ready Qwen image, and GPU worker service account to initialize a vLLM engine from the mounted Qwen2.5-VL 7B weights without processing a prompt or running inference.

The result also records two important tuning facts. The unbounded vLLM default path is not safe on one L4 because it over-allocates for the 128k context profile. A bounded 2048-token path with `gpu_memory_utilization=0.82` still had no available KV-cache memory after model load. The passing proof used a cost-focused bounded preview profile: one L4, one sequence, `max_model_len=1024`, `max_num_batched_tokens=1024`, explicit `kv_cache_memory_bytes=536870912`, and `gpu_memory_utilization=0.95`.

This packet does not run inference, run a forward pass, process a prompt, send a runtime service request, call providers, dispatch production workers, touch Supabase, execute SQL, create generated assets, create public artifacts, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Inputs

- `docs/qwen2-5-vl-7b-cloud-run-gpu-model-load-proof-result.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-model-import-proof-result.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-private-mount-read-proof-result.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-deploy-result.md`
- `docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-image-build-result.md`
- `docker/prod/qwen2-5-vl-cloud-run-gpu/Dockerfile`
- `docker/prod/qwen2-5-vl-cloud-run-gpu/requirements.qwen2-5-vl.txt`
- `server/workers/qwen2_5_vl_cloud_run_gpu/service.py`

## Compiler-ready Image

| Area | Value |
| --- | --- |
| Rebuild reason | vLLM/Triton required a C compiler for engine initialization |
| Dockerfile package added | `build-essential` |
| Existing runtime package kept | `libnuma1` |
| Cloud Build ID | `b7ea9d0e-b95c-4fa5-8590-14cb11165cc7` |
| Build duration | `16m36s` |
| Image tag | `fail-closed-vllm-compiler-5f6cb91e-20260627t022658z` |
| Image digest | `sha256:35a7265a40272ac66938499f4f2c33f03855810d1677a49e9531b4f3740c4c39` |
| Source bundle file count | `7` |
| Source bundle size | `7.2KiB` |
| Model weights bundled in image | false |
| Secrets bundled in image | false |
| Generated media bundled in image | false |

The first compiler-ready attempt proved the compiler problem was fixed but failed after model load because the 2048-token profile with `gpu_memory_utilization=0.82` still left `-0.90 GiB` available for KV cache. That failure is recorded as a tuning boundary, not a runtime execution failure.

## Passing vLLM Engine Proof Execution

| Area | Value |
| --- | --- |
| Proof job | `qwen25vl-vllm-engine-proof-0627030150` |
| Proof execution | `qwen25vl-vllm-engine-proof-0627030150-7b7gv` |
| Execution created | `2026-06-27T03:01:54.671934Z` |
| Execution started | `2026-06-27T03:02:00.432044Z` |
| Execution completed | `2026-06-27T03:09:24.452636Z` |
| Completion status | success |
| Execution duration | `7m24.02s` |
| Script elapsed time | `354.45s` |
| vLLM engine initialization time | `314.8s` |
| GPU | `1` x `nvidia-l4` |
| CPU | `8` |
| Memory | `32Gi` |
| Retry count | `0` |
| Proof job deleted | true |
| Remaining proof jobs | none observed |

## Runtime Image And Mount

| Area | Value |
| --- | --- |
| Image digest | `sha256:35a7265a40272ac66938499f4f2c33f03855810d1677a49e9531b4f3740c4c39` |
| Runtime identity | `reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com` |
| Bucket | `reeditpro-staging-reeditpro-model-cache` |
| Mount path | `/models/qwen2.5-vl-7b-instruct` |
| Model revision | `cc594898137f460bfe9f0759e9844b3ce807cfb5` |
| Expected aggregate SHA-256 | `46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b` |
| Mount read-only | true |

## Passing Engine Configuration

| Area | Value |
| --- | --- |
| Runtime | `vllm` |
| vLLM version | `0.11.0` |
| Torch version | `2.8.0+cu128` |
| dtype | `bfloat16` |
| tensor parallel size | `1` |
| max model length | `1024` |
| max number of sequences | `1` |
| max batched tokens | `1024` |
| GPU memory utilization | `0.95` |
| explicit KV cache memory bytes | `536870912` |
| multimodal prompt limit | `image=1, video=0` |
| eager execution | true |
| prefix caching | false |
| log stats disabled | true |

This profile is a bounded preview/first-serving profile, not a claim that the 7B model can handle broad video-heavy or long-context traffic on one L4. Wider context, video prompts, higher concurrency, or lower latency may require quantization, CPU offload, a smaller model, or a larger GPU serving lane.

## CUDA And Engine Metrics

| Area | Value |
| --- | --- |
| CUDA available | true |
| CUDA device count | `1` |
| CUDA device name | `NVIDIA L4` |
| CUDA total memory bytes | `23583784960` |
| vLLM imported | true |
| vLLM engine initialization attempted | true |
| vLLM engine initialized | true |
| Engine deleted before exit | true |
| CUDA cache cleared before exit | true |
| CUDA memory allocated after cleanup | `0` |
| CUDA memory reserved after cleanup | `0` |

## Service Update

| Area | Value |
| --- | --- |
| Service | `reeditpro-qwen2-5-vl-l4-worker` |
| Previous ready revision | `reeditpro-qwen2-5-vl-l4-worker-00002-r2s` |
| Updated ready revision | `reeditpro-qwen2-5-vl-l4-worker-00003-9qh` |
| Image digest | `sha256:35a7265a40272ac66938499f4f2c33f03855810d1677a49e9531b4f3740c4c39` |
| Traffic | `100%` to latest revision |
| Service ready | true |
| Public unauthenticated access | disabled |
| Ingress | `internal-and-cloud-load-balancing` |
| Runtime request sent | false |

The service update only moved the fail-closed Cloud Run service to the compiler-ready image. It did not enable model import on startup, inference, provider execution, public outputs, or runtime request handling.

## Runtime Gates

- `compilerReadyImageBuilt=true`
- `compilerReadyImageUsed=true`
- `cloudRunGpuJobCreated=true`
- `cloudRunGpuJobDeleted=true`
- `gpuRequested=true`
- `torchImported=true`
- `vllmImported=true`
- `cudaAvailable=true`
- `cudaL4Visible=true`
- `vllmEngineInitializationAttempted=true`
- `vllmEngineInitialized=true`
- `vllmEngineDeletedBeforeExit=true`
- `cudaCacheClearedBeforeExit=true`
- `cloudRunServiceUpdated=true`
- `cloudRunRevisionReady=true`
- `minInstancesZero=true`
- `maxInstancesOne=true`
- `boundedPreviewConfigUsed=true`
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

## GPU Decision

The current cost-friendly decision is to keep Qwen2.5-VL 7B on Cloud Run L4 for a bounded, scale-to-zero preview/runtime proof lane. Cloud Run L4 is viable for this constrained vLLM engine profile and preserves the user's requested lifecycle shape: run only when invoked, scale to zero when unused, and cap concurrency at one.

This is not a full production throughput decision. If ReeditPro needs long-context VLM reasoning, video-heavy prompts, multiple concurrent requests, or lower cold-start latency, the next architecture review should compare:

- L4 plus quantized Qwen2.5-VL 7B.
- L4 plus CPU offload for slower but cheaper bounded workloads.
- A smaller Qwen VLM candidate for low-cost preview.
- A larger GPU serving lane outside Cloud Run L4 for higher-memory production workloads.

## What This Proves

- The compiler-ready Qwen Cloud Run image can initialize vLLM `0.11.0` from the private model mount on one L4.
- The selected scale-to-zero GPU path is viable for a bounded preview profile.
- The dedicated private model-cache mount remains usable for model-backed runtime initialization.
- The Cloud Run service can be updated to the compiler-ready image while staying fail-closed.
- The proof remains no-inference and no-forward-pass.
- The one-off Cloud Run Job stops after use and was deleted.

## What This Does Not Prove

- It does not prove model inference.
- It does not prove prompt processing.
- It does not prove request serving.
- It does not prove long-context or video-heavy vLLM serving on one L4.
- It does not prove approved snapshot enforcement at runtime.
- It does not prove Supabase queue/lease integration.
- It does not prove generated asset creation.
- It does not unlock beta or production.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_30-CLOUD-RUN-GPU-VLLM-APPROVED-SNAPSHOT-RUNTIME-CONTRACT: define the approved-snapshot request contract for the fail-closed Cloud Run service, no inference`
