# AI Graphics Beta Tool Call Readiness

Decision: `ai_graphics_beta_tool_call_readiness_contract_prepared_with_fail_closed_defaults`.

This contract joins the canonical AI graphics ranking system to the beta evidence bundle. It covers all 21 AI graphics tools and all 12 product-facing capabilities. The agent may select ranked tools for planning and study metadata now, but tool calls remain blocked unless a complete owner-accepted evidence bundle is supplied to the evaluator.

## Evidence Policy

- Default committed evidence keeps beta tool-call eligibility at `0` of `21`.
- A complete evidence packet can make `21` of `21` tools beta-callable for the future owner gate.
- The evaluator can consume either an already assembled beta evidence bundle via `--beta-evidence-bundle-packet` or a full local assembly packet containing `betaEvidenceBundle` via `--beta-evidence-local-assembly-packet`.
- The local assembly packet path is for private/local owner-gate evidence handoff only. Committed docs stay sanitized and must not include raw private refs, model files, GPU proof logs, generated media, public artifact URLs, or signed URLs.
- Partial evidence does not create a callable subset. The contract requires the complete 21-tool evidence bundle before any beta tool-call handoff is considered eligible.
- The eight heavy/model tools preserve exact native NVIDIA L4 runtime targets through the beta-call contract. GPU use is on-demand only for a future approved worker or tool-call handoff; proof/runtime containers must be ephemeral `docker run --rm --gpus all` jobs, no idle GPU runtime is approved, and CPU fallback is blocked for heavy model paths.
- The CLI and diagnostic are evaluator-only. They do not execute tools, workers, routes, providers, browser/WebGL/canvas runtimes, GPU/model runtimes, model downloads, media processing, public artifact creation, or signed URL creation.

## Tool Coverage

- `torch_torchvision`
- `transformers`
- `sam2`
- `birefnet`
- `real_esrgan`
- `kornia`
- `rembg`
- `transparent_background`
- `d3`
- `echarts`
- `vega_lite`
- `vega`
- `satori`
- `svgdotjs_svg_js`
- `viz_js`
- `lottie_web`
- `animejs`
- `three_js`
- `pixi_js`
- `konva`
- `babylonjs`

## GPU Runtime Targets

- `torch_torchvision`: `native_linux_amd64_nvidia_l4_gpu_worker`
- `transformers`: `native_linux_amd64_nvidia_l4_gpu_worker`
- `sam2`: `native_linux_amd64_nvidia_l4_sam2_runtime`
- `birefnet`: `native_linux_amd64_nvidia_l4_birefnet_runtime`
- `real_esrgan`: `native_linux_amd64_nvidia_l4_real_esrgan_runtime`
- `kornia`: `native_linux_amd64_nvidia_l4_gpu_worker`
- `rembg`: `native_linux_amd64_nvidia_l4_gpu_worker`
- `transparent_background`: `native_linux_amd64_nvidia_l4_gpu_worker`

## Capability Coverage

- `chart_overlay`
- `data_visualization`
- `svg_graphics`
- `diagram_graphics`
- `animation_overlay`
- `canvas_scene`
- `webgl_3d_scene`
- `background_removal`
- `subject_segmentation`
- `upscaling`
- `tensor_image_ops`
- `model_runtime_foundation`

## Runtime Gates

- `agentCanSelectForPlanning`: true
- `agentCanExecuteToolsNow`: false
- `routeExecutionApprovedNow`: false
- `workerExecutionApprovedNow`: false
- `toolExecutionApprovedNow`: false
- `providerRuntimeApprovedNow`: false
- `browserWebglCanvasRuntimeApprovedNow`: false
- `gpuRuntimeApprovedNow`: false
- `runtimeReadyNow`: false
- `internalBetaReadyNow`: false
- `externalBetaReadyNow`: false
- `productionReadyNow`: false

## Result

The ranking system is connected to beta evidence without weakening the runtime boundary. Tool-call selection remains planning-only in committed state, and the complete evidence path is available for a later owner gate to verify all 21 tools together. A future private evidence assembly can be handed directly to this evaluator while preserving on-demand-only GPU startup and false runtime/beta/production gates.
