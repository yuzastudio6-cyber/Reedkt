# AI Graphics External Agent All-21 Controlled Route Execution Smoke

Decision: `ai_graphics_external_agent_all21_controlled_route_execution_smoke_passed`

Status: `external_agent_all21_controlled_route_execution_passed_with_gpu_on_demand`

This smoke starts the real Express app and POSTs all 21 AI graphics tool calls through `/api/ai-graphics/external-beta/tool-call` with the controlled CPU/static, browser-runtime, and GPU/model route flags enabled. It proves the agent-facing route can accept every tool call now while keeping GPU/model runtime on-demand and idle by default.

## Tool Results

| Tool | Group | Capability | HTTP status | Adapter invoked | Adapter executed | Local package execution | Local GPU/model runtime | GPU starts now |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `torch_torchvision` | `gpu_model` | `model_runtime_foundation` | `200` | `true` | `false` | `false` | `false` | `false` |
| `transformers` | `gpu_model` | `model_runtime_foundation` | `200` | `true` | `false` | `false` | `false` | `false` |
| `sam2` | `gpu_model` | `subject_segmentation` | `200` | `true` | `false` | `false` | `false` | `false` |
| `birefnet` | `gpu_model` | `background_removal` | `200` | `true` | `false` | `false` | `false` | `false` |
| `real_esrgan` | `gpu_model` | `upscaling` | `200` | `true` | `false` | `false` | `false` | `false` |
| `kornia` | `gpu_model` | `tensor_image_ops` | `200` | `true` | `false` | `false` | `false` | `false` |
| `rembg` | `gpu_model` | `background_removal` | `200` | `true` | `false` | `false` | `false` | `false` |
| `transparent_background` | `gpu_model` | `background_removal` | `200` | `true` | `false` | `false` | `false` | `false` |
| `d3` | `cpu_static` | `chart_overlay` | `200` | `true` | `true` | `true` | `false` | `false` |
| `echarts` | `browser_runtime` | `chart_overlay` | `200` | `true` | `true` | `true` | `false` | `false` |
| `vega_lite` | `cpu_static` | `data_visualization` | `200` | `true` | `true` | `true` | `false` | `false` |
| `vega` | `cpu_static` | `data_visualization` | `200` | `true` | `true` | `true` | `false` | `false` |
| `satori` | `cpu_static` | `svg_graphics` | `200` | `true` | `true` | `true` | `false` | `false` |
| `svgdotjs_svg_js` | `cpu_static` | `svg_graphics` | `200` | `true` | `true` | `true` | `false` | `false` |
| `viz_js` | `cpu_static` | `diagram_graphics` | `200` | `true` | `true` | `true` | `false` | `false` |
| `lottie_web` | `browser_runtime` | `animation_overlay` | `200` | `true` | `true` | `true` | `false` | `false` |
| `animejs` | `browser_runtime` | `animation_overlay` | `200` | `true` | `true` | `true` | `false` | `false` |
| `three_js` | `browser_runtime` | `webgl_3d_scene` | `200` | `true` | `true` | `true` | `false` | `false` |
| `pixi_js` | `browser_runtime` | `canvas_scene` | `200` | `true` | `true` | `true` | `false` | `false` |
| `konva` | `browser_runtime` | `canvas_scene` | `200` | `true` | `true` | `true` | `false` | `false` |
| `babylonjs` | `browser_runtime` | `webgl_3d_scene` | `200` | `true` | `true` | `true` | `false` | `false` |

## Counts

- `totalAiGraphicsTools`: 21
- `controlledRouteHttp200Tools`: 21
- `controlledRouteAdapterInvokedTools`: 21
- `controlledRouteAdapterExecutedTools`: 13
- `cpuStaticControlledRouteExecutedTools`: 6
- `browserRuntimeControlledRouteExecutedTools`: 7
- `gpuModelControlledRouteInvokedTools`: 8
- `localPackageExecutionPerformedTools`: 13
- `localGpuModelRuntimeExecutionPerformedTools`: 0
- `gpuRuntimeShouldStartNowTools`: 0
- `workerDispatchPerformedTools`: 0
- `providerRuntimePerformedTools`: 0
- `publicArtifactCreatedTools`: 0
- `signedUrlCreatedTools`: 0

## Booleans

- `all21ControlledRouteExecutionSmokePassed`: true
- `all21ToolsCovered`: true
- `all21ToolsReturnedHttp200`: true
- `all21ControlledAdaptersInvoked`: true
- `cpuStaticControlledAdaptersExecuted`: true
- `browserRuntimeControlledAdaptersExecuted`: true
- `gpuModelControlledAdaptersInvoked`: true
- `agentCanExecuteToolsNow`: true
- `agentCanExecuteAll21ToolsNow`: true
- `agentCanExecuteGpuModelToolsNow`: true
- `routeExecutionApprovedNow`: true
- `routeExecutionPerformed`: true
- `controlledToolRouteExecutionPerformed`: true
- `gpuRuntimeOnDemandOnly`: true
- `noIdleGpuRuntimeApproved`: true
- `workerExecutionApprovedNow`: false
- `workerExecutionPerformed`: false
- `workerDispatchApprovedNow`: false
- `workerDispatchPerformed`: false
- `providerRuntimeApprovedNow`: false
- `providerRuntimePerformed`: false
- `browserWebglCanvasRuntimePerformedOutsideControlledAdapter`: false
- `gpuRuntimePerformed`: false
- `gpuRuntimeShouldStartNow`: false
- `modelWeightsDownloaded`: false
- `modelWeightsLoaded`: false
- `modelInferencePerformed`: false
- `mediaProcessingPerformed`: false
- `supabaseMutationPerformed`: false
- `gcsUploadPerformed`: false
- `publicArtifactCreated`: false
- `signedUrlCreated`: false
- `runtimeReadyNow`: false
- `internalBetaReadyNow`: false
- `externalBetaReadyNow`: false
- `productionReadyNow`: false
- `dependencyInstallPerformed`: false
- `packageLockMutationPerformed`: false

## Boundary

This smoke does not dispatch Workers, call providers/models, mutate Supabase/GCS, create signed URLs, create public artifacts, download model weights, unlock paid production, or mark runtime/beta/production ready. CPU/static and browser-runtime adapters execute in the explicit mock/local controlled route. GPU/model adapters are invoked and executable, but local GPU/model runtime does not start unless a future scoped request supplies explicit local-dev runtime inputs and approval refs.
