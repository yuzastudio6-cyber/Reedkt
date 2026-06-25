# AI Graphics 21-Tool Runtime Install Readiness

Decision: `ai_graphics_21_tool_runtime_install_readiness_started_with_gpu_worker_install_declarations`

This lane starts the real install-readiness path for the full 21-tool AI graphics set. It does not claim final beta readiness yet. It makes the next truthful state better: all 13 JavaScript graphics tools remain declared and locked in the Node package lock, and the GPU worker now declares the missing AI/model/background-removal install candidates that belong in GPU worker scope.

## Current Install Split

- 13 JavaScript graphics tools are declared and locked in `package.json` / `package-lock.json`.
- 7 model/image tools are declared in `docker/prod/gpu-worker/requirements.gpu.txt`.
- `birefnet` uses the `transformers` model-loader path plus an approved private `ZhengPeng7/BiRefNet` model snapshot rather than a standalone Python package.
- Heavy model tools target `gpu_ai_worker`, not CPU worker or frontend runtime.

## Newly Declared GPU Worker Packages

- `transformers`
- `rembg[gpu]`
- `transparent-background`
- `realesrgan`
- pinned SAM2 source install: `facebookresearch/sam2@2b90b9f5ceec907a1c18123530e92e794ad901a4`

The GPU worker image now uses a CUDA devel base and installs `git`, so pinned source installs and SAM2 CUDA extension builds are possible inside the worker image build. `SAM2_BUILD_ALLOW_ERRORS=0` is set so the build fails instead of silently accepting a missing SAM2 CUDA extension.

## Not Yet Beta Ready

Beta readiness still requires actual image build, import smoke, approved model-weight manifests, approved synthetic or safe private fixtures, browser/canvas/WebGL runtime proofs, Tool Route and Worker handoff wiring, and approved snapshot/credit gates. Until those pass:

- `agentCanExecuteToolsNow=false`
- `toolRouteExecutionReadyNow=false`
- `workerExecutionReadyNow=false`
- `browserWebglCanvasRuntimeReadyNow=false`
- `gpuModelRuntimeReadyNow=false`
- `runtimeBetaReadyNow=false`
- `internalBetaReadyNow=false`
- `productionReadyNow=false`

## Coordination

Duplicate search found many related owner lanes but no exact all-21 AI graphics install-readiness branch. Track A render/export and Track B media ownership remain separate; this lane covers AI graphics install readiness and connects to those owners through documented runtime boundaries rather than taking over their tools.
