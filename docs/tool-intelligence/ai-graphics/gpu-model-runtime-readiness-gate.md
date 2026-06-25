# AI Graphics GPU Model Runtime Readiness Gate

Decision: `ai_graphics_gpu_model_runtime_readiness_gate_prepared_with_warnings`

Branch: `codex/rp-ai-graphics-gpu-model-runtime-readiness-gate`

Base: `origin/codex/rp-ai-graphics-gpu-model-install-build-targets`

Draft PR: [#856](https://github.com/yuzastudio6-cyber/Reedkt/pull/856), open/draft/CLEAN at `cf1358b35a88d34982eabf30e5b025e705703ecf`, with an empty check rollup at creation.

Source PR: [#833](https://github.com/yuzastudio6-cyber/Reedkt/pull/833)

## Scope

This lane adds the next gate after GPU/model install-proof. It prepares a
native NVIDIA runtime probe for the eight AI graphics GPU/model tools:

- `torch_torchvision`
- `transformers`
- `sam2`
- `birefnet`
- `real_esrgan`
- `kornia`
- `rembg`
- `transparent_background`

The gate is intentionally not an agent execution approval. ReeditPro may still
select these tools only for planning/study metadata until runtime, model
provenance, fixture, Tool Route, Worker, QA, beta, and production gates pass.

## Runtime Probe

New script:

`docker/prod/ai-graphics-gpu-runtime-readiness.py`

The script must run inside the GPU image on native `linux/amd64` with an NVIDIA
runtime. It requires:

- `REEDITPRO_AI_GRAPHICS_GPU_RUNTIME_PROOF=true`
- `nvidia-smi` available and successful
- `torch.cuda.is_available() == true`
- at least one visible CUDA device
- CUDA compute capability at or above `8.9` for the approved NVIDIA L4 target
- a tiny CUDA tensor probe
- optional reviewed model manifest checks via `--require-model-weight-manifests`

The script refuses side-effect flags for model downloads, provider execution,
real media input, public artifacts, signed URLs, Tool Route execution, Worker
execution, Supabase mutation, and GCS upload.

It does not download model weights, load checkpoints, process media, call
providers, execute Product Tool Routes, execute Workers, create signed URLs,
create public artifacts, unlock beta, or unlock production.

## Image Placement

The runtime readiness probe is copied into these images:

| Profile | Dockerfile | Runtime probe path |
| --- | --- | --- |
| `gpu_worker_ai_graphics` | `docker/prod/gpu-worker/Dockerfile` | `/usr/local/bin/ai-graphics-gpu-runtime-readiness.py` |
| `sam2` | `docker/prod/sam2-runtime/Dockerfile` | `/app/ai-graphics-gpu-runtime-readiness.py` |
| `birefnet` | `docker/prod/birefnet-runtime/Dockerfile` | `/usr/local/bin/ai-graphics-gpu-runtime-readiness.py` |
| `real_esrgan` | `docker/prod/real-esrgan-runtime/Dockerfile` | `/usr/local/bin/ai-graphics-gpu-runtime-readiness.py` |

## Required Native GPU Commands

Shared GPU worker:

```sh
docker run --rm --gpus all \
  -e REEDITPRO_AI_GRAPHICS_GPU_RUNTIME_PROOF=true \
  -e MODEL_DOWNLOADS_ENABLED=false \
  -e PROVIDER_EXECUTION_ENABLED=false \
  <gpu-worker-image> \
  python3 /usr/local/bin/ai-graphics-gpu-runtime-readiness.py \
  --profile gpu_worker_ai_graphics \
  --require-model-weight-manifests
```

Dedicated SAM2 image:

```sh
docker run --rm --gpus all \
  -e REEDITPRO_AI_GRAPHICS_GPU_RUNTIME_PROOF=true \
  -e MODEL_DOWNLOADS_ENABLED=false \
  -e PROVIDER_EXECUTION_ENABLED=false \
  <sam2-runtime-image> \
  python3 ./ai-graphics-gpu-runtime-readiness.py \
  --profile sam2 \
  --require-model-weight-manifests
```

Dedicated BiRefNet image:

```sh
docker run --rm --gpus all \
  -e REEDITPRO_AI_GRAPHICS_GPU_RUNTIME_PROOF=true \
  -e MODEL_DOWNLOADS_ENABLED=false \
  -e PROVIDER_EXECUTION_ENABLED=false \
  <birefnet-runtime-image> \
  python3 /usr/local/bin/ai-graphics-gpu-runtime-readiness.py \
  --profile birefnet \
  --require-model-weight-manifests
```

Dedicated Real-ESRGAN image:

```sh
docker run --rm --gpus all \
  -e REEDITPRO_AI_GRAPHICS_GPU_RUNTIME_PROOF=true \
  -e MODEL_DOWNLOADS_ENABLED=false \
  -e PROVIDER_EXECUTION_ENABLED=false \
  <real-esrgan-runtime-image> \
  python3 /usr/local/bin/ai-graphics-gpu-runtime-readiness.py \
  --profile real_esrgan \
  --require-model-weight-manifests
```

## Current State

Local host: `darwin_arm64`.

Native NVIDIA runtime available here: false.

The local proof available in this worktree is the guard behavior only:

```sh
python3 docker/prod/ai-graphics-gpu-runtime-readiness.py --profile gpu_worker_ai_graphics
```

Expected result: `blocked_missing_runtime_proof_opt_in`.

This is correct. It proves the probe will not accidentally run runtime checks
outside an approved native NVIDIA proof lane.

## Remaining Blocks

- Native `linux/amd64` NVIDIA runtime proof has not run here.
- `docker run --gpus all` has not passed here.
- Reviewed `model_tree_manifest.json` files have not been mounted for the model
  tools.
- Model weights have not been downloaded, loaded, or executed.
- SAM2 optional CUDA post-processing extension runtime behavior remains pending
  because install-proof uses `SAM2_BUILD_CUDA=0`.
- `rembg`/`pymatting` Numba runtime JIT behavior remains pending because
  install-proof uses `NUMBA_DISABLE_JIT=1` only for import smoke.
- No minimal fixture/inference proof has run.
- Tool Route, Worker, provider, storage, signed URL, public artifact, internal
  beta, external beta, and production gates remain false.

## Booleans

- `gpuModelRuntimeReadinessGatePrepared=true`
- `all8GpuModelToolsCoveredByRuntimeGate=true`
- `all4GpuRuntimeProfilesHaveRuntimeProbe=true`
- `nativeNvidiaRuntimeRequired=true`
- `explicitRuntimeProofOptInRequired=true`
- `modelWeightManifestGatePrepared=true`
- `agentCanSelectForPlanning=true`
- `agentCanExecuteToolsNow=false`
- `toolRouteExecutionReadyNow=false`
- `workerExecutionReadyNow=false`
- `gpuModelRuntimeReadyNow=false`
- `runtimeBetaReadyNow=false`
- `internalBetaReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`
- `packageLockMutationPerformed=false`
- `modelWeightsDownloaded=false`
- `modelWeightsLoaded=false`
- `mediaProcessingPerformed=false`
- `providerRuntimePerformed=false`
- `publicArtifactCreated=false`
- `signedUrlCreated=false`

## Next Proof

Run the four runtime readiness commands on an approved native NVIDIA builder
with reviewed private model manifests mounted. After that, a separate approved
lane must prove model loading and minimal private fixtures before agent/tool
execution or beta readiness can be reconsidered.
