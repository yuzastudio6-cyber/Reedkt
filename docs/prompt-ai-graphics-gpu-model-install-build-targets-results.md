# AI Graphics GPU Model Install Build Targets Results

Decision: `ai_graphics_gpu_model_install_build_targets_prepared_with_warnings`

Branch: `codex/rp-ai-graphics-gpu-model-install-build-targets`

Base: `origin/codex/rp-ai-graphics-satori-font-runtime-proof`

Source evidence:

- PR #791: AI graphics Satori font runtime proof, open/draft/CLEAN at `4a4f13716ac62a40a97f85a0d685a9a1ce09bddd`.
- GPU worker install proof: `ai_graphics_gpu_worker_install_proof_hardened_with_warnings`.
- GPU import readiness: `ai_graphics_gpu_import_readiness_aligned_with_21_tool_install_plan`.

Result:

- Added the `ai_graphics_install_proof` Docker target to all four GPU/model profiles:
  - `docker/prod/gpu-worker/Dockerfile`
  - `docker/prod/sam2-runtime/Dockerfile`
  - `docker/prod/birefnet-runtime/Dockerfile`
  - `docker/prod/real-esrgan-runtime/Dockerfile`
- The install-proof target stops after Python package install and import-only smoke, before app bundle copies and without model weights.
- Covered all 8 model/GPU tools: `torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, and `transparent_background`.
- Aligned GPU/model requirements to `opencv-python-headless==4.10.0.84`
  with `numpy==1.26.4`; the newer OpenCV 4.12 pin requires NumPy 2.x and
  blocks the pinned CUDA Torch worker install.
- Added a narrow Real-ESRGAN/BasicSR compatibility shim in the Real-ESRGAN
  runtime and general GPU worker images for
  `torchvision.transforms.functional_tensor.rgb_to_grayscale`, preserving the
  pinned `torchvision==0.20.1+cu124` stack.
- Hardened GPU/model pip installs with `--retries 10 --timeout 120` for large
  CUDA wheel downloads.
- Set `TORCH_CUDA_ARCH_LIST=8.9` before the shared GPU worker SAM2 source
  install because Docker build has no visible NVIDIA device for Torch extension
  architecture inference; 8.9 matches the approved NVIDIA L4 target.
- Installed `python3-dev` before the shared GPU worker SAM2 source extension
  build because Torch extension headers require `Python.h`.

Local validation:

- Dockerfile checks passed for all four `ai_graphics_install_proof` targets.
- The shared `gpu_worker_ai_graphics` target completed the main requirements
  install with the OpenCV/NumPy, rembg/Python 3.10, DeepFilterNet packaging,
  and BasicSR/TorchVision alignments preserved. It remains blocked for local
  full target completion because Docker Desktop on Apple Silicon runs the
  `linux/amd64` build through QEMU; SAM2 reached `nvcc` with
  `-gencode=arch=compute_89,code=sm_89`, then QEMU segfaulted during CUDA
  extension compilation. Native linux/amd64 NVIDIA builder proof remains
  required.
- The dedicated SAM2 `ai_graphics_install_proof` target built successfully with
  `docker buildx build --platform linux/amd64` and its import-only smoke passed
  for `torch`, `torchvision`, `numpy`, `PIL`, `cv2`, `hydra`, `iopath`, and
  `sam2`.
- The dedicated Real-ESRGAN `ai_graphics_install_proof` target built
  successfully with `docker buildx build --platform linux/amd64` and its
  import-only smoke passed for `torch`, `torchvision`, `numpy`, `PIL`, `cv2`,
  `basicsr`, and `realesrgan`.
- The dedicated BiRefNet `ai_graphics_install_proof` target built successfully
  with `docker buildx build --platform linux/amd64` and its import-only smoke
  passed for `torch`, `torchvision`, `transformers`, `safetensors`, `PIL`,
  `cv2`, `numpy`, `timm`, `kornia`, `einops`, `scipy`, and `skimage`.
- Local NVIDIA runtime is unavailable on this macOS arm64 host; `docker --gpus all` fails with no known GPU vendor.

Gates remain false:

- `agentCanExecuteToolsNow=false`
- `toolRouteExecutionReadyNow=false`
- `workerExecutionReadyNow=false`
- `gpuModelRuntimeReadyNow=false`
- `runtimeBetaReadyNow=false`
- `internalBetaReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

Next required proof:

- Run the shared `gpu_worker_ai_graphics` install-proof target on a native
  linux/amd64 NVIDIA builder.
- Rerun the four install-proof targets on the NVIDIA builder for final parity.
- Then run NVIDIA runtime checks and import smoke inside the built images.
