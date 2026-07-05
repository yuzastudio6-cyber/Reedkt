# AI Graphics External Agent Controlled Route Caller

Decision: `ai_graphics_external_agent_controlled_route_caller_contract_prepared_for_all21_with_gpu_model_on_demand`

Status: `external_agent_controlled_route_caller_ready_for_all21_controlled_route_calls`

This contract gives the external agent one scoped caller shape for all 21 controlled AI graphics tools that are callable through the canonical private route now. CPU/static and browser-runtime tools execute controlled local packages. GPU/model tools are callable through the controlled route and invoke the on-demand adapter, but they are not runtime-executable until a scoped request supplies explicit approved local-dev runtime inputs and private proof refs. GPU stays cold by default.

## Controlled Caller Tools

| Tool | Group | Capability | Route | Expected status |
| --- | --- | --- | --- | --- |
| `d3` | `cpu_static_controlled_route` | `chart_overlay` | `POST /api/ai-graphics/external-agent/tool-call` | `200` |
| `vega_lite` | `cpu_static_controlled_route` | `data_visualization` | `POST /api/ai-graphics/external-agent/tool-call` | `200` |
| `vega` | `cpu_static_controlled_route` | `data_visualization` | `POST /api/ai-graphics/external-agent/tool-call` | `200` |
| `satori` | `cpu_static_controlled_route` | `svg_graphics` | `POST /api/ai-graphics/external-agent/tool-call` | `200` |
| `svgdotjs_svg_js` | `cpu_static_controlled_route` | `svg_graphics` | `POST /api/ai-graphics/external-agent/tool-call` | `200` |
| `viz_js` | `cpu_static_controlled_route` | `diagram_graphics` | `POST /api/ai-graphics/external-agent/tool-call` | `200` |
| `echarts` | `browser_runtime_controlled_route` | `chart_overlay` | `POST /api/ai-graphics/external-agent/tool-call` | `200` |
| `lottie_web` | `browser_runtime_controlled_route` | `animation_overlay` | `POST /api/ai-graphics/external-agent/tool-call` | `200` |
| `animejs` | `browser_runtime_controlled_route` | `animation_overlay` | `POST /api/ai-graphics/external-agent/tool-call` | `200` |
| `three_js` | `browser_runtime_controlled_route` | `webgl_3d_scene` | `POST /api/ai-graphics/external-agent/tool-call` | `200` |
| `pixi_js` | `browser_runtime_controlled_route` | `canvas_scene` | `POST /api/ai-graphics/external-agent/tool-call` | `200` |
| `konva` | `browser_runtime_controlled_route` | `canvas_scene` | `POST /api/ai-graphics/external-agent/tool-call` | `200` |
| `babylonjs` | `browser_runtime_controlled_route` | `webgl_3d_scene` | `POST /api/ai-graphics/external-agent/tool-call` | `200` |
| `torch_torchvision` | `gpu_model_controlled_route_on_demand` | `model_runtime_foundation` | `POST /api/ai-graphics/external-agent/tool-call` | `200` |
| `transformers` | `gpu_model_controlled_route_on_demand` | `model_runtime_foundation` | `POST /api/ai-graphics/external-agent/tool-call` | `200` |
| `sam2` | `gpu_model_controlled_route_on_demand` | `subject_segmentation` | `POST /api/ai-graphics/external-agent/tool-call` | `200` |
| `birefnet` | `gpu_model_controlled_route_on_demand` | `background_removal` | `POST /api/ai-graphics/external-agent/tool-call` | `200` |
| `real_esrgan` | `gpu_model_controlled_route_on_demand` | `upscaling` | `POST /api/ai-graphics/external-agent/tool-call` | `200` |
| `kornia` | `gpu_model_controlled_route_on_demand` | `tensor_image_ops` | `POST /api/ai-graphics/external-agent/tool-call` | `200` |
| `rembg` | `gpu_model_controlled_route_on_demand` | `background_removal` | `POST /api/ai-graphics/external-agent/tool-call` | `200` |
| `transparent_background` | `gpu_model_controlled_route_on_demand` | `background_removal` | `POST /api/ai-graphics/external-agent/tool-call` | `200` |

## Counts

- `totalAiGraphicsTools`: 21
- `totalProductFacingCapabilities`: 12
- `controlledRouteCallableToolsNow`: 21
- `cpuStaticControlledRouteCallableToolsNow`: 6
- `browserRuntimeControlledRouteCallableToolsNow`: 7
- `gpuModelControlledRouteCallableToolsNow`: 8
- `gpuModelToolsBlockedFromControlledRouteCallerNow`: 0
- `requestEnvelopesPrepared`: 21
- `privateOutputOnlyEnvelopes`: 21
- `all21ControlledRouteCallableNowTools`: 21
- `controlledRouteRuntimeExecutableNowTools`: 13
- `all21ControlledRouteExecutableNowTools`: 13
- `all21ExecutableNowTools`: 13
- `controlledRouteLocalPackageExecutionExpectedTools`: 13
- `localGpuModelRuntimeExecutionExpectedInDefaultCallerTools`: 0
- `gpuModelToolsBlockedFromRuntimeExecutionNow`: 8
- `gpuRuntimeShouldStartNowTools`: 0
- `publicArtifactCreatedTools`: 0
- `signedUrlCreatedTools`: 0
- `routeExecutionPerformedInThisLaneTools`: 0
- `productionReadyNowTools`: 0

## Booleans

- `externalAgentControlledRouteCallerContractPrepared`: true
- `sourceControlledRouteRequireGoAccepted`: true
- `sourceControlledWorkerRouteExecutionSmokeAccepted`: true
- `sourceAll21ControlledRouteExecutionSmokeAccepted`: true
- `routeSchemaEnvelopeAccepted`: true
- `all21ToolsCovered`: true
- `all12CapabilitiesCovered`: true
- `all13ControlledRouteCallerEnvelopesPrepared`: true
- `all21ControlledRouteCallerEnvelopesPrepared`: true
- `cpuStatic6ControlledRouteCallerEnvelopesPrepared`: true
- `browserRuntime7ControlledRouteCallerEnvelopesPrepared`: true
- `gpuModel8ControlledRouteCallerEnvelopesPrepared`: true
- `controlledRouteCallerCanInvokeCanonicalRouteFor13ToolsNow`: true
- `controlledRouteCallerCanInvokeCanonicalRouteFor21ToolsNow`: true
- `agentCanExecuteControlledRouteToolsNow`: true
- `agentCanExecuteControlledCpuStaticAndBrowserRuntimeRouteToolsNow`: true
- `agentCanExecuteControlledCpuStaticBrowserRuntimeAndGpuModelRouteToolsNow`: false
- `routeExecutionApprovedForControlled13ToolsNow`: true
- `routeExecutionApprovedForControlled21ToolsNow`: true
- `privateOutputOnly`: true
- `eightGpuModelToolsRemainBlockedFromControlledRouteCaller`: false
- `eightGpuModelToolsRemainBlockedFromRuntimeExecutionNow`: true
- `eightGpuModelToolsInvokeControlledOnDemandAdapter`: true
- `gpuRuntimeOnDemandOnly`: true
- `noIdleGpuRuntimeApproved`: true
- `gpuStartsOnlyForAcceptedExternalBetaToolCall`: true
- `agentCanSelectForPlanning`: true
- `agentCanExecuteAll21ToolsNow`: false
- `agentCanExecuteGpuModelToolsNow`: false
- `agentCanExecuteToolsNow`: true
- `routeExecutionApprovedNow`: true
- `routeExecutionPerformedInThisLane`: false
- `workerExecutionApprovedNow`: false
- `workerExecutionPerformed`: false
- `workerDispatchApprovedNow`: false
- `workerDispatchPerformed`: false
- `toolExecutionApprovedNow`: false
- `toolExecutionPerformed`: false
- `providerRuntimeApprovedNow`: false
- `providerRuntimePerformed`: false
- `browserWebglCanvasRuntimeApprovedNow`: false
- `gpuRuntimeApprovedNow`: false
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

## Agent Call Rule

The agent may invoke `/api/ai-graphics/external-agent/tool-call` for all 21 controlled AI graphics tools using the generated private request envelopes. The request must keep output private, must not request signed URLs, must not create public artifacts, and must not start idle GPU runtime. GPU/model calls are on-demand: the adapter is invoked by the route, while local GPU/model runtime starts only for an explicit approved local-dev runtime request with real private inputs.
