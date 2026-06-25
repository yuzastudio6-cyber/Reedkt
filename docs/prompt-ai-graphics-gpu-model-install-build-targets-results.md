# AI Graphics GPU Model Install Build Targets Results

Decision: `ai_graphics_gpu_model_install_build_targets_prepared_with_warnings`

Branch: `codex/rp-ai-graphics-gpu-model-install-build-targets`

Base: `origin/codex/rp-ai-graphics-satori-font-runtime-proof`

Draft PR: [#833](https://github.com/yuzastudio6-cyber/Reedkt/pull/833)

PR status: open/draft/CLEAN at `2bb9788a3c31a942ac5c6a59e49bde803199ebcf`; check rollup empty after shared GPU worker install-proof follow-up.

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
- Set `SAM2_BUILD_CUDA=0` for the shared GPU worker SAM2 source install so
  build-time install proof skips the optional SAM2 CUDA post-processing
  extension under Docker Desktop/QEMU while preserving the CUDA Torch stack for
  later native NVIDIA runtime proof.
- Installed `python3-dev` before the shared GPU worker SAM2 source extension
  build because Torch extension headers require `Python.h`.
- Set `NUMBA_DISABLE_JIT=1` only for the shared GPU worker import-only smoke
  process because `rembg` imports `pymatting`, which otherwise triggers slow
  Numba compilation during import under QEMU.

Local validation:

- Dockerfile checks passed for all four `ai_graphics_install_proof` targets.
- The shared `gpu_worker_ai_graphics` target built successfully with
  `docker buildx build --platform linux/amd64` and its import-only smoke passed
  for `torch`, `torchvision`, `transformers`, `kornia`, `rembg`,
  `transparent_background`, `realesrgan`, and `sam2`.
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

- Rerun the four install-proof targets on a native linux/amd64 NVIDIA builder
  for cloud parity.
- Run NVIDIA runtime checks and import smoke inside the built images.
- Prove SAM2 optional CUDA post-processing extension behavior and rembg Numba
  runtime/JIT behavior on the native GPU worker before beta execution.
