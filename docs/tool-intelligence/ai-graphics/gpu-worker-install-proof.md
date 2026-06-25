# AI Graphics GPU Worker Install Proof

Decision: `ai_graphics_gpu_worker_install_proof_hardened_with_warnings`

This lane hardens the GPU/model install path for the 8 non-JS AI graphics
tools while preserving PR #780's Node proof for the 13 JS tools. It does not
claim local CUDA image build, GPU runtime, model-weight loading, media
processing, Tool Route, Worker dispatch, beta, or production readiness.

## Source

- PR #780: [AI graphics node runtime proof](https://github.com/yuzastudio6-cyber/Reedkt/pull/780), open/draft/CLEAN at `740a72818b4ca89bbec24ca9c9d22eae915d9a91`.

## Draft PR

- PR #783: [AI graphics GPU worker install proof](https://github.com/yuzastudio6-cyber/Reedkt/pull/783), open/draft/CLEAN at creation head `b6c7da82f3b73de9271fba94d8d8f0031a04be5f`.
- Check rollup at PR creation: empty.

## GPU Install Surfaces

| Profile | Dockerfile | Tools | Install proof |
| --- | --- | --- | --- |
| `gpu_worker_ai_graphics` | `docker/prod/gpu-worker/Dockerfile` | `torch_torchvision`, `transformers`, `sam2`, `real_esrgan`, `kornia`, `rembg`, `transparent_background` | Build-time import smoke declared |
| `sam2` | `docker/prod/sam2-runtime/Dockerfile` | `sam2`, `torch_torchvision` | Build-time import smoke declared |
| `birefnet` | `docker/prod/birefnet-runtime/Dockerfile` | `birefnet`, `transformers`, `kornia`, `torch_torchvision` | Build-time import smoke declared |
| `real_esrgan` | `docker/prod/real-esrgan-runtime/Dockerfile` | `real_esrgan`, `torch_torchvision` | Build-time import smoke declared |

## Inherited Node Install Proof

PR #780 remains the current install/runtime proof for the 13 JavaScript tools:
`d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`,
`viz_js`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, and
`babylonjs`.

## Pinned AI Graphics GPU Packages

- `torch==2.5.1+cu124`
- `torchvision==0.20.1+cu124`
- `transformers==4.57.6`
- `kornia==0.8.1`
- `opencv-python-headless==4.12.0.88`
- `rembg[gpu]==2.0.76`
- `transparent-background==1.3.4`
- `realesrgan==0.3.0`
- `facebookresearch/sam2` pinned at commit `2b90b9f5ceec907a1c18123530e92e794ad901a4`

## Boundaries

- `agentCanSelectForPlanning=true`
- `agentCanExecuteToolsNow=false`
- `toolRouteExecutionReadyNow=false`
- `workerExecutionReadyNow=false`
- `gpuModelRuntimeReadyNow=false`
- `runtimeBetaReadyNow=false`
- `internalBetaReadyNow=false`
- `productionReadyNow=false`
- `modelWeightsDownloaded=false`
- `mediaProcessingPerformed=false`
- `publicArtifactCreated=false`

## Warnings

Local Docker Desktop is `aarch64` and this host has no NVIDIA runtime, so this
lane cannot honestly claim a local CUDA image build or GPU execution. It makes
the target worker image builds fail fast if the pinned packages do not import.

Full beta readiness still requires a linux/amd64 GPU build/import proof on the
target runner and approved model-weight mounts.
