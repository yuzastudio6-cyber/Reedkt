# AI Graphics GPU Model Runtime Readiness Gate Implementation Prompt

Implement the next runtime-readiness gate after
`origin/codex/rp-ai-graphics-gpu-model-install-build-targets`.

Goal:

- Prepare a native NVIDIA runtime readiness probe for the 8 AI graphics
  GPU/model tools.
- Keep proof execution blocked on this macOS host.
- Do not enable agent/tool execution, Tool Routes, Workers, providers, model
  loading, media processing, public artifacts, signed URLs, beta, or production.

Implemented result:

- Decision: `ai_graphics_gpu_model_runtime_readiness_gate_prepared_with_warnings`.
- Added runtime readiness probe:
  - `docker/prod/ai-graphics-gpu-runtime-readiness.py`
- Copied the probe into:
  - `docker/prod/gpu-worker/Dockerfile`
  - `docker/prod/sam2-runtime/Dockerfile`
  - `docker/prod/birefnet-runtime/Dockerfile`
  - `docker/prod/real-esrgan-runtime/Dockerfile`
- Added package script:
  - `ai-graphics:gpu-model-runtime-readiness-gate:diagnostics`
- Added diagnostic:
  - `scripts/validation/ai-graphics-gpu-model-runtime-readiness-gate-diagnostics.mjs`
- Added proof records:
  - `docs/tool-intelligence/ai-graphics/gpu-model-runtime-readiness-gate.md`
  - `docs/tool-intelligence/ai-graphics/gpu-model-runtime-readiness-gate.json`

Runtime gate requirements:

- Explicit opt-in: `REEDITPRO_AI_GRAPHICS_GPU_RUNTIME_PROOF=true`.
- Native NVIDIA runtime with `docker run --gpus all`.
- Successful `nvidia-smi`.
- `torch.cuda.is_available()`.
- Visible CUDA device with compute capability `8.9` or higher.
- Tiny CUDA tensor probe.
- Optional reviewed model manifest checks via
  `--require-model-weight-manifests`.

No-scope:

- `agentCanExecuteToolsNow=false`.
- `runtimeBetaReadyNow=false`.
- `productionReadyNow=false`.
- No `npm install`.
- No `npm ci`.
- No package-lock mutation.
- No model downloads.
- No model loading.
- No media processing.
- No provider/model inference.
- No Tool Route execution.
- No Worker execution.
- No public artifacts.
- No signed URLs.
- No Supabase/GCS mutation.
- No internal beta, external beta, paid production, or production unlock.

Next implementation lane:

- Execute the runtime readiness gate on a native `linux/amd64` NVIDIA L4 builder
  with reviewed private model manifests mounted, then run a separate approved
  model-loading and minimal fixture proof lane.
