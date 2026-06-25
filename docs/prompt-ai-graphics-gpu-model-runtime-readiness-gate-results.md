# AI Graphics GPU Model Runtime Readiness Gate Results

Decision: `ai_graphics_gpu_model_runtime_readiness_gate_prepared_with_warnings`

Branch: `codex/rp-ai-graphics-gpu-model-runtime-readiness-gate`

Base: `origin/codex/rp-ai-graphics-gpu-model-install-build-targets`

Draft PR: [#856](https://github.com/yuzastudio6-cyber/Reedkt/pull/856), open/draft/CLEAN at `cf1358b35a88d34982eabf30e5b025e705703ecf`, with an empty check rollup at creation.

Source PR: [#833](https://github.com/yuzastudio6-cyber/Reedkt/pull/833)

Result:

- Added `docker/prod/ai-graphics-gpu-runtime-readiness.py`.
- Copied the runtime readiness probe into the shared GPU worker, SAM2, BiRefNet,
  and Real-ESRGAN runtime images.
- Added diagnostic script:
  `scripts/validation/ai-graphics-gpu-model-runtime-readiness-gate-diagnostics.mjs`.
- Added package script:
  `ai-graphics:gpu-model-runtime-readiness-gate:diagnostics`.
- Added proof records:
  - `docs/tool-intelligence/ai-graphics/gpu-model-runtime-readiness-gate.md`
  - `docs/tool-intelligence/ai-graphics/gpu-model-runtime-readiness-gate.json`

Covered tools:

- `torch_torchvision`
- `transformers`
- `sam2`
- `birefnet`
- `real_esrgan`
- `kornia`
- `rembg`
- `transparent_background`

Runtime gate behavior:

- Requires `REEDITPRO_AI_GRAPHICS_GPU_RUNTIME_PROOF=true`.
- Requires native NVIDIA runtime and successful `nvidia-smi`.
- Requires `torch.cuda.is_available()`.
- Requires a visible CUDA device with compute capability at or above `8.9`.
- Runs a tiny CUDA tensor probe.
- Can require reviewed private model manifests via
  `--require-model-weight-manifests`.
- Refuses side-effect flags for model downloads, provider execution, real media
  input, Tool Route execution, Worker execution, public artifacts, signed URLs,
  Supabase mutation, and GCS upload.

Local validation:

- The local host is `darwin_arm64` and has no native NVIDIA runtime.
- The probe was not run as a GPU runtime proof here.
- Local guard validation is limited to proving the script blocks without the
  explicit runtime-proof opt-in.

No-scope:

- `agentCanExecuteToolsNow=false`.
- `runtimeBetaReadyNow=false`.
- `productionReadyNow=false`.
- No model weights downloaded.
- No model weights loaded.
- No media processed.
- No provider/model inference.
- No Tool Route execution.
- No Worker execution.
- No browser/WebGL/canvas runtime.
- No GPU/model runtime proof on this host.
- No public artifacts.
- No signed URLs.
- No package-lock mutation.
- No internal beta, external beta, paid production, or production unlock.

Next required proof:

- Run the four runtime readiness commands on native `linux/amd64` NVIDIA L4.
- Mount reviewed private `model_tree_manifest.json` files for SAM2, BiRefNet,
  Real-ESRGAN, rembg, and transparent-background.
- Follow with model-loading and minimal private fixture proof before beta/tool
  execution can be reconsidered.
