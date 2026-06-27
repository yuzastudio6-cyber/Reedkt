# AI Graphics 21-Tool Runtime Install Readiness

Decision: `ai_graphics_21_tool_runtime_install_readiness_started_with_gpu_worker_install_declarations`

Draft PR: [#770](https://github.com/yuzastudio6-cyber/Reedkt/pull/770), opened as open/draft/CLEAN at creation head `f5e0711ac946d28271b72a030fda661a09a29182` with empty check rollup.

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

Current downstream evidence now accepts runtime proof packets for all 13
JavaScript graphics tools:

- Node/static proof evidence: `d3`, `vega_lite`, `vega`,
  `svgdotjs_svg_js`, and `viz_js`.
- Browser/canvas/WebGL proof evidence: `echarts`, `lottie_web`, `animejs`,
  `three_js`, `pixi_js`, `konva`, and `babylonjs`.
- Satori font-fixture proof evidence: `satori`.

Those proof packets do not approve agent tool calls by themselves. Beta
readiness still requires native GPU image/runtime proof, approved model-weight
manifests, approved synthetic or safe private fixtures where applicable, Tool
Route and Worker handoff wiring, and approved snapshot/credit gates. Until
those pass:

- `agentCanExecuteToolsNow=false`
- `toolRouteExecutionReadyNow=false`
- `workerExecutionReadyNow=false`
- `browserWebglCanvasRuntimeReadyNow=false`
- `gpuModelRuntimeReadyNow=false`
- `runtimeBetaReadyNow=false`
- `internalBetaReadyNow=false`
- `productionReadyNow=false`

## Remaining Runtime Blocks

- 8 GPU/model tools still need native NVIDIA runtime proof and private
  model/model-cache manifest evidence where applicable.
- 21 tools still need Tool Route, Worker, approved snapshot, credit, artifact,
  and beta-owner gates before agent execution can be enabled.
- The accepted Node/browser/Satori proof packets should be consumed as evidence
  unless package versions, sandbox policy, or proof records drift.

## Coordination

Duplicate search found many related owner lanes but no exact all-21 AI graphics install-readiness branch. Track A render/export and Track B media ownership remain separate; this lane covers AI graphics install readiness and connects to those owners through documented runtime boundaries rather than taking over their tools.
