# AI Graphics GPU Model Install Build Targets Implementation Prompt

Implement the GPU/model install build-target preparation lane from
`origin/codex/rp-ai-graphics-satori-font-runtime-proof`.

Goal:

- Prepare real Docker build targets for the 8 AI graphics model/GPU tools.
- Keep proof target execution limited to dependency install plus import-only smoke.
- Do not require app bundle artifacts, model weights, media, providers, signed URLs, public artifacts, beta, or production readiness.

Implemented result:

- Decision: `ai_graphics_gpu_model_install_build_targets_prepared_with_warnings`.
- Draft PR: [#833](https://github.com/yuzastudio6-cyber/Reedkt/pull/833), open/draft/CLEAN at `8330ba32634f41dd4e6ac681aecaa023979b09d4`, with an empty check rollup at creation.
- Added package script:
  - `ai-graphics:gpu-model-install-build-targets:diagnostics`
- Added diagnostic:
  - `scripts/validation/ai-graphics-gpu-model-install-build-targets-diagnostics.mjs`
- Added proof records:
  - `docs/tool-intelligence/ai-graphics/gpu-model-install-build-targets.md`
  - `docs/tool-intelligence/ai-graphics/gpu-model-install-build-targets.json`
- Added `ai_graphics_install_proof` target to:
  - `docker/prod/gpu-worker/Dockerfile`
  - `docker/prod/sam2-runtime/Dockerfile`
  - `docker/prod/birefnet-runtime/Dockerfile`
  - `docker/prod/real-esrgan-runtime/Dockerfile`
- Aligned the AI graphics GPU/model requirement files to
  `opencv-python-headless==4.10.0.84` so they remain compatible with the pinned
  `numpy==1.26.4` CUDA Torch stack.
- Added the minimal Real-ESRGAN/BasicSR `torchvision.transforms.functional_tensor`
  shim needed for `torchvision==0.20.1+cu124` imports.
- Hardened GPU/model pip installs with `--retries 10 --timeout 120` for large
  CUDA wheel downloads.
- Set `TORCH_CUDA_ARCH_LIST=8.9` for the shared GPU worker SAM2 source install
  because Docker build has no visible NVIDIA device for Torch extension
  architecture inference; 8.9 matches the approved NVIDIA L4 target.
- Installed `python3-dev` before the shared GPU worker SAM2 source extension
  build because Torch extension headers require `Python.h`.
- Recorded the shared `gpu_worker_ai_graphics` local target as
  `blocked_pending_native_linux_amd64_gpu_builder`: its main requirements
  install completed with dependency alignments preserved, but SAM2 CUDA
  extension compilation reached `nvcc` for `sm_89` and then failed under local
  Docker Desktop QEMU emulation. Native linux/amd64 NVIDIA builder proof remains
  required.
- Observed local build evidence:
  - `docker/prod/sam2-runtime/Dockerfile` `ai_graphics_install_proof` built
    successfully for `linux/amd64` with import-only smoke passing for `sam2`
    and its package prerequisites.
  - `docker/prod/real-esrgan-runtime/Dockerfile` `ai_graphics_install_proof`
    built successfully for `linux/amd64` with import-only smoke passing for
    `real_esrgan` and its package prerequisites.
  - `docker/prod/birefnet-runtime/Dockerfile` `ai_graphics_install_proof` built
    successfully for `linux/amd64` with import-only smoke passing for
    `birefnet` prerequisites including `transformers` and `kornia`.

No-scope:

- No model weights downloaded.
- No media processed.
- No provider/model inference.
- No Tool Route or Worker execution approval.
- `gpuModelRuntimeReadyNow=false`.
- No GPU runtime proof on this macOS arm64 host.
- No claim that the shared GPU worker install-proof target is locally complete.
- No package-lock mutation.
- No internal beta, external beta, paid production, or production unlock.

Next implementation lane:

- Run the shared `gpu_worker_ai_graphics` `ai_graphics_install_proof` target on a
  native linux/amd64 NVIDIA builder, then rerun the dedicated install-proof
  targets and NVIDIA runtime checks inside the built images.
