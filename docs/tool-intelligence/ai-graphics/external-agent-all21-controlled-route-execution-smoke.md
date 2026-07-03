# AI Graphics External Agent All-21 Controlled Route Execution Smoke

Decision: `ai_graphics_external_agent_all21_controlled_route_execution_smoke_passed`

Status: `external_agent_all21_controlled_route_execution_passed_with_gpu_on_demand`

This smoke starts the real Express app and POSTs all 21 AI graphics tool calls through `/api/ai-graphics/external-beta/tool-call` with the controlled CPU/static, browser-runtime, and GPU/model route flags enabled. It proves the agent-facing route can accept every tool call now. It does not claim all 21 tools have real runtime execution proof: CPU/static and browser-runtime adapters execute now, while GPU/model adapters are route-callable and remain blocked from runtime execution until native GPU proof and reviewed private model manifests are accepted.

## Tool Results

| Tool | Group | Capability | External-agent state | HTTP status | Adapter invoked | Adapter executed | Local package execution | Local GPU/model runtime | GPU starts now |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `torch_torchvision` | `gpu_model` | `model_runtime_foundation` | `blocked_with_reason` | `200` | `true` | `false` | `false` | `false` | `false` |
| `transformers` | `gpu_model` | `model_runtime_foundation` | `blocked_with_reason` | `200` | `true` | `false` | `false` | `false` | `false` |
| `sam2` | `gpu_model` | `subject_segmentation` | `blocked_with_reason` | `200` | `true` | `false` | `false` | `false` | `false` |
| `birefnet` | `gpu_model` | `background_removal` | `blocked_with_reason` | `200` | `true` | `false` | `false` | `false` | `false` |
| `real_esrgan` | `gpu_model` | `upscaling` | `blocked_with_reason` | `200` | `true` | `false` | `false` | `false` | `false` |
| `kornia` | `gpu_model` | `tensor_image_ops` | `blocked_with_reason` | `200` | `true` | `false` | `false` | `false` | `false` |
| `rembg` | `gpu_model` | `background_removal` | `blocked_with_reason` | `200` | `true` | `false` | `false` | `false` | `false` |
| `transparent_background` | `gpu_model` | `background_removal` | `blocked_with_reason` | `200` | `true` | `false` | `false` | `false` | `false` |
| `d3` | `cpu_static` | `chart_overlay` | `executable` | `200` | `true` | `true` | `true` | `false` | `false` |
| `echarts` | `browser_runtime` | `chart_overlay` | `executable` | `200` | `true` | `true` | `true` | `false` | `false` |
| `vega_lite` | `cpu_static` | `data_visualization` | `executable` | `200` | `true` | `true` | `true` | `false` | `false` |
| `vega` | `cpu_static` | `data_visualization` | `executable` | `200` | `true` | `true` | `true` | `false` | `false` |
| `satori` | `cpu_static` | `svg_graphics` | `executable` | `200` | `true` | `true` | `true` | `false` | `false` |
| `svgdotjs_svg_js` | `cpu_static` | `svg_graphics` | `executable` | `200` | `true` | `true` | `true` | `false` | `false` |
| `viz_js` | `cpu_static` | `diagram_graphics` | `executable` | `200` | `true` | `true` | `true` | `false` | `false` |
| `lottie_web` | `browser_runtime` | `animation_overlay` | `executable` | `200` | `true` | `true` | `true` | `false` | `false` |
| `animejs` | `browser_runtime` | `animation_overlay` | `executable` | `200` | `true` | `true` | `true` | `false` | `false` |
| `three_js` | `browser_runtime` | `webgl_3d_scene` | `executable` | `200` | `true` | `true` | `true` | `false` | `false` |
| `pixi_js` | `browser_runtime` | `canvas_scene` | `executable` | `200` | `true` | `true` | `true` | `false` | `false` |
| `konva` | `browser_runtime` | `canvas_scene` | `executable` | `200` | `true` | `true` | `true` | `false` | `false` |
| `babylonjs` | `browser_runtime` | `webgl_3d_scene` | `executable` | `200` | `true` | `true` | `true` | `false` | `false` |

## Counts

- `totalAiGraphicsTools`: 21
- `controlledRouteHttp200Tools`: 21
- `controlledRouteCallableTools`: 21
- `controlledRouteAdapterInvokedTools`: 21
- `controlledRouteAdapterExecutedTools`: 13
- `realRuntimeExecutedTools`: 13
- `executableStateTools`: 13
- `blockedWithReasonStateTools`: 8
- `failedWithDiagnosticsStateTools`: 0
- `cpuStaticControlledRouteExecutedTools`: 6
- `browserRuntimeControlledRouteExecutedTools`: 7
- `gpuModelControlledRouteInvokedTools`: 8
- `gpuModelRuntimeProofRequiredTools`: 8
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
- `normalizedExternalAgentExecutionStatesReturned`: true
- `thirteenToolsReturnExecutableState`: true
- `eightGpuModelToolsReturnBlockedWithReasonState`: true
- `noToolsReturnFailedWithDiagnosticsState`: true
- `agentCanCallAll21ControlledRoutesNow`: true
- `agentCanExecuteToolsNow`: false
- `agentCanExecuteAll21ToolsNow`: false
- `agentCanExecuteGpuModelToolsNow`: false
- `agentCanExecuteRealRuntimeFor13ToolsNow`: true
- `agentCanExecuteRealRuntimeForAll21ToolsNow`: false
- `gpuModelRuntimeProofAcceptedNow`: false
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

This smoke does not dispatch Workers, call providers/models, mutate Supabase/GCS, create signed URLs, create public artifacts, download model weights, unlock paid production, or mark runtime/beta/production ready. CPU/static and browser-runtime adapters execute in the explicit mock/local controlled route. GPU/model adapters are invoked through the controlled route, but local GPU/model runtime does not start until a scoped request supplies explicit local-dev runtime inputs, reviewed private manifests, accepted native GPU proof, and approval refs.
