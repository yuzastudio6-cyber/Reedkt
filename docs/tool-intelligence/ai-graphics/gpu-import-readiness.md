# AI Graphics GPU Import Readiness

Decision: `ai_graphics_gpu_import_readiness_aligned_with_21_tool_install_plan`

Draft PR: [#775](https://github.com/yuzastudio6-cyber/Reedkt/pull/775), opened as open/draft/CLEAN at creation head `e7ce783d9f9f7afdd8f94c8473f009414b569c73` with empty check rollup.

This lane aligns ReeditPro's dry-run GPU readiness checks with the 21-tool AI graphics install-readiness plan from PR #770. It does not install packages on the host, build a container image, run Python imports, load model weights, create a CUDA context, process media, call providers, create public artifacts, or unlock beta.

## What Changed

- `transformers`, SAM2, `rembg[gpu]`, `transparent-background`, and Real-ESRGAN now have explicit GPU import-readiness definitions.
- BiRefNet is represented through the `transformers` model-loader path plus an approved private `ZhengPeng7/BiRefNet` snapshot requirement, not as a nonexistent standalone package path.
- SAM2 and Real-ESRGAN are no longer listed as pending source-install review because their package paths are declared by PR #770.
- `rembg` and `transparent_background` now have model-weight manifest templates so their model/cache blockers are explicit.
- Babylon.js readiness now points at the actual locked `babylonjs` package instead of `@babylonjs/core`.

## Current Truth

- `agentCanSelectForPlanning=true`
- `agentCanExecuteToolsNow=false`
- `toolRouteExecutionReadyNow=false`
- `workerExecutionReadyNow=false`
- `browserWebglCanvasRuntimeReadyNow=false`
- `gpuModelRuntimeReadyNow=false`
- `runtimeBetaReadyNow=false`
- `internalBetaReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

## Remaining Gates

The next proof must build the GPU worker image and run optional real import checks inside that image without model loading or media processing. Runtime/beta readiness still requires approved model-weight manifests, safe fixture proofs, Tool Route and Worker gating, approved snapshot/credit boundaries, and runtime QA.
