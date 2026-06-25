# AI Graphics GPU Model Install Build Targets

Decision: `ai_graphics_gpu_model_install_build_targets_prepared_with_warnings`

This lane prepares named Docker install-proof targets for the 8 AI graphics
model/GPU tools. The target name is `ai_graphics_install_proof`; it stops after
package installation and the import-only smoke script, before app bundle copies,
model-weight manifests, media processing, provider calls, public artifacts, or
runtime/beta/production unlocks.

## Source

- PR #791: [AI graphics satori font runtime proof](https://github.com/yuzastudio6-cyber/Reedkt/pull/791), open/draft/CLEAN at `4a4f13716ac62a40a97f85a0d685a9a1ce09bddd`.
- GPU worker install proof: `ai_graphics_gpu_worker_install_proof_hardened_with_warnings`.
- GPU import readiness: `ai_graphics_gpu_import_readiness_aligned_with_21_tool_install_plan`.

## Build Targets

| Profile | Dockerfile | Target | Tools |
| --- | --- | --- | --- |
| `gpu_worker_ai_graphics` | `docker/prod/gpu-worker/Dockerfile` | `ai_graphics_install_proof` | `torch_torchvision`, `transformers`, `sam2`, `real_esrgan`, `kornia`, `rembg`, `transparent_background` |
| `sam2` | `docker/prod/sam2-runtime/Dockerfile` | `ai_graphics_install_proof` | `sam2`, `torch_torchvision` |
| `birefnet` | `docker/prod/birefnet-runtime/Dockerfile` | `ai_graphics_install_proof` | `birefnet`, `transformers`, `kornia`, `torch_torchvision` |
| `real_esrgan` | `docker/prod/real-esrgan-runtime/Dockerfile` | `ai_graphics_install_proof` | `real_esrgan`, `torch_torchvision` |

## Dependency Alignment

- GPU/model requirements pin `opencv-python-headless==4.10.0.84` with
  `numpy==1.26.4`.
- `opencv-python-headless==4.12.0.88` is intentionally avoided for these
  targets because it requires NumPy 2.x on Python 3.10 and breaks the pinned
  CUDA Torch worker installs.
- The Real-ESRGAN runtime and general GPU worker add a narrow
  `torchvision.transforms.functional_tensor` compatibility shim for
  `basicsr==1.4.2`, re-exporting `rgb_to_grayscale` from
  `torchvision.transforms.functional` while preserving `torchvision==0.20.1+cu124`.
- GPU/model pip installs use `--retries 10 --timeout 120` and matching
  `PIP_DEFAULT_TIMEOUT`/`PIP_RETRIES` environment settings to tolerate large
  CUDA wheel downloads.
- The shared GPU worker installs pinned SAM2 source with
  `--no-build-isolation` after the pinned Torch/TorchVision stack.
  `TORCH_CUDA_ARCH_LIST=8.9` remains set for the approved NVIDIA L4 target, and
  build-time install proof sets `SAM2_BUILD_CUDA=0` to skip the optional SAM2
  CUDA post-processing extension under Docker Desktop/QEMU while preserving the
  CUDA Torch stack for later native NVIDIA runtime proof.
- The shared GPU worker installs `python3-dev` before the SAM2 source extension
  build because Torch extension headers require `Python.h`.
- The shared GPU worker import-only smoke sets `NUMBA_DISABLE_JIT=1` for the
  smoke process because `rembg` imports `pymatting`, which triggers Numba
  compilation during import. Native Numba/JIT runtime behavior remains a later
  GPU-worker proof gate.

## Local Environment

- Host: macOS arm64.
- Docker server: linux/arm64 Docker Desktop.
- NVIDIA runtime available: `false`.
- `docker --gpus all` fails locally with no known GPU vendor.
- Local validation can verify Dockerfile structure and build-target syntax, but
  cannot prove CUDA/NVIDIA runtime.

## Observed Local Build Evidence

| Profile | Platform | Target | Result | Notes |
| --- | --- | --- | --- | --- |
| `gpu_worker_ai_graphics` | `linux/amd64` via Docker Desktop QEMU | `ai_graphics_install_proof` | `passed` | The shared GPU worker build completed with the OpenCV/NumPy, rembg/Python 3.10, DeepFilterNet packaging, BasicSR/TorchVision, SAM2 source-install, and import-only smoke alignments preserved. The smoke imported `torch==2.5.1+cu124`, `torchvision==0.20.1+cu124`, `transformers==4.57.6`, `kornia==0.8.1`, `rembg==2.0.69`, `transparent_background`, `realesrgan`, and `sam2`. Build-time proof uses `SAM2_BUILD_CUDA=0` and `NUMBA_DISABLE_JIT=1`; native NVIDIA runtime proof remains required before execution or beta readiness. |
| `sam2` | `linux/amd64` | `ai_graphics_install_proof` | `passed` | Buildx completed the target and the import-only smoke reported `torch==2.5.1+cu124`, `torchvision==0.20.1+cu124`, `numpy==1.26.4`, `PIL==12.2.0`, `cv2==4.11.0`, `hydra==1.3.2`, `iopath==0.1.10`, and `sam2` import success. |
| `real_esrgan` | `linux/amd64` | `ai_graphics_install_proof` | `passed` | Buildx completed the target after the OpenCV/NumPy pin alignment and BasicSR/TorchVision shim; the import-only smoke reported `torch==2.5.1+cu124`, `torchvision==0.20.1+cu124`, `numpy==1.26.4`, `PIL==10.4.0`, `cv2==4.11.0`, `basicsr==1.4.2`, and `realesrgan` import success. |
| `birefnet` | `linux/amd64` | `ai_graphics_install_proof` | `passed` | Buildx completed the target after pip retry/timeout hardening; the import-only smoke reported `torch==2.5.1+cu124`, `torchvision==0.20.1+cu124`, `transformers==4.57.6`, `safetensors==0.7.0`, `numpy==1.26.4`, `timm==1.0.27`, `kornia==0.8.1`, and `skimage==0.25.2`. |

The GPU worker, SAM2, Real-ESRGAN, and BiRefNet install-proof attempts did not
use an NVIDIA runtime and did not load model weights, process media, call
providers, copy the app bundle before the proof target, create public artifacts,
or create signed URLs.

## GPU Builder Commands Required Next

Run these next on a linux/amd64 builder with NVIDIA runtime access:

```sh
docker buildx build --platform linux/amd64 --target ai_graphics_install_proof -f docker/prod/gpu-worker/Dockerfile .
docker buildx build --platform linux/amd64 --target ai_graphics_install_proof -f docker/prod/sam2-runtime/Dockerfile .
docker buildx build --platform linux/amd64 --target ai_graphics_install_proof -f docker/prod/birefnet-runtime/Dockerfile .
docker buildx build --platform linux/amd64 --target ai_graphics_install_proof -f docker/prod/real-esrgan-runtime/Dockerfile .
docker run --rm --gpus all <built-image> nvidia-smi
docker run --rm --gpus all <built-image> python3 /tmp/ai-graphics-gpu-install-smoke.py --profile gpu_worker_ai_graphics
```

## Gates

- `agentCanSelectForPlanning=true`
- `agentCanExecuteToolsNow=false`
- `toolRouteExecutionReadyNow=false`
- `workerExecutionReadyNow=false`
- `gpuModelRuntimeReadyNow=false`
- `runtimeBetaReadyNow=false`
- `internalBetaReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

No model weights were downloaded, no media was processed, no provider/model
runtime was called, no public artifacts or signed URLs were created, and
`package-lock.json` remains unchanged.
