# AI Graphics External Agent Controlled Route Caller

Decision: `ai_graphics_external_agent_controlled_route_caller_contract_prepared_for_thirteen_tools_with_gpu_model_blocks`

Status: `external_agent_controlled_route_caller_ready_for_thirteen_tools_gpu_model_blocked`

This contract gives the external agent one scoped caller shape for the 13 controlled AI graphics tools that are executable through the canonical private route now. It does not claim all 21 tools are executable. The eight GPU/model tools remain blocked and GPU stays cold until accepted native GPU/model proof exists for a future on-demand job.

## Controlled Caller Tools

| Tool | Group | Capability | Route | Expected status |
| --- | --- | --- | --- | --- |
| `d3` | `cpu_static_controlled_route` | `chart_overlay` | `POST /api/ai-graphics/external-beta/tool-call` | `200` |
| `vega_lite` | `cpu_static_controlled_route` | `chart_overlay` | `POST /api/ai-graphics/external-beta/tool-call` | `200` |
| `vega` | `cpu_static_controlled_route` | `chart_overlay` | `POST /api/ai-graphics/external-beta/tool-call` | `200` |
| `satori` | `cpu_static_controlled_route` | `svg_graphics` | `POST /api/ai-graphics/external-beta/tool-call` | `200` |
| `svgdotjs_svg_js` | `cpu_static_controlled_route` | `svg_graphics` | `POST /api/ai-graphics/external-beta/tool-call` | `200` |
| `viz_js` | `cpu_static_controlled_route` | `diagram_graphics` | `POST /api/ai-graphics/external-beta/tool-call` | `200` |
| `echarts` | `browser_runtime_controlled_route` | `chart_overlay` | `POST /api/ai-graphics/external-beta/tool-call` | `200` |
| `lottie_web` | `browser_runtime_controlled_route` | `animation_overlay` | `POST /api/ai-graphics/external-beta/tool-call` | `200` |
| `animejs` | `browser_runtime_controlled_route` | `animation_overlay` | `POST /api/ai-graphics/external-beta/tool-call` | `200` |
| `three_js` | `browser_runtime_controlled_route` | `webgl_3d_scene` | `POST /api/ai-graphics/external-beta/tool-call` | `200` |
| `pixi_js` | `browser_runtime_controlled_route` | `canvas_scene` | `POST /api/ai-graphics/external-beta/tool-call` | `200` |
| `konva` | `browser_runtime_controlled_route` | `canvas_scene` | `POST /api/ai-graphics/external-beta/tool-call` | `200` |
| `babylonjs` | `browser_runtime_controlled_route` | `webgl_3d_scene` | `POST /api/ai-graphics/external-beta/tool-call` | `200` |

## GPU/Model Tools Still Blocked

| Tool | Capability | Expected status | Required proof before caller use |
| --- | --- | --- | --- |
| `torch_torchvision` | `model_runtime_foundation` | `409` | `reviewed native linux/amd64 NVIDIA L4 runtime proof; reviewed private model-weight manifest when model weights are required; external-beta per-tool runtime proof recheck with accepted private evidence; approved worker enqueue lane that starts GPU only for the accepted job` |
| `transformers` | `model_runtime_foundation` | `409` | `reviewed native linux/amd64 NVIDIA L4 runtime proof; reviewed private model-weight manifest when model weights are required; external-beta per-tool runtime proof recheck with accepted private evidence; approved worker enqueue lane that starts GPU only for the accepted job` |
| `sam2` | `subject_segmentation` | `409` | `reviewed native linux/amd64 NVIDIA L4 runtime proof; reviewed private model-weight manifest when model weights are required; external-beta per-tool runtime proof recheck with accepted private evidence; approved worker enqueue lane that starts GPU only for the accepted job` |
| `birefnet` | `background_removal` | `409` | `reviewed native linux/amd64 NVIDIA L4 runtime proof; reviewed private model-weight manifest when model weights are required; external-beta per-tool runtime proof recheck with accepted private evidence; approved worker enqueue lane that starts GPU only for the accepted job` |
| `real_esrgan` | `upscaling` | `409` | `reviewed native linux/amd64 NVIDIA L4 runtime proof; reviewed private model-weight manifest when model weights are required; external-beta per-tool runtime proof recheck with accepted private evidence; approved worker enqueue lane that starts GPU only for the accepted job` |
| `kornia` | `tensor_image_ops` | `409` | `reviewed native linux/amd64 NVIDIA L4 runtime proof; reviewed private model-weight manifest when model weights are required; external-beta per-tool runtime proof recheck with accepted private evidence; approved worker enqueue lane that starts GPU only for the accepted job` |
| `rembg` | `background_removal` | `409` | `reviewed native linux/amd64 NVIDIA L4 runtime proof; reviewed private model-weight manifest when model weights are required; external-beta per-tool runtime proof recheck with accepted private evidence; approved worker enqueue lane that starts GPU only for the accepted job` |
| `transparent_background` | `background_removal` | `409` | `reviewed native linux/amd64 NVIDIA L4 runtime proof; reviewed private model-weight manifest when model weights are required; external-beta per-tool runtime proof recheck with accepted private evidence; approved worker enqueue lane that starts GPU only for the accepted job` |

## Counts

- `totalAiGraphicsTools`: 21
- `totalProductFacingCapabilities`: 12
- `controlledRouteCallableToolsNow`: 13
- `cpuStaticControlledRouteCallableToolsNow`: 6
- `browserRuntimeControlledRouteCallableToolsNow`: 7
- `gpuModelToolsBlockedFromControlledRouteCallerNow`: 8
- `requestEnvelopesPrepared`: 13
- `privateOutputOnlyEnvelopes`: 13
- `all21ExecutableNowTools`: 0
- `gpuRuntimeShouldStartNowTools`: 0
- `publicArtifactCreatedTools`: 0
- `signedUrlCreatedTools`: 0
- `routeExecutionPerformedInThisLaneTools`: 0
- `productionReadyNowTools`: 0

## Booleans

- `externalAgentControlledRouteCallerContractPrepared`: true
- `sourceControlledRouteRequireGoAccepted`: true
- `sourceControlledWorkerRouteExecutionSmokeAccepted`: true
- `routeSchemaEnvelopeAccepted`: true
- `all21ToolsCovered`: true
- `all12CapabilitiesCovered`: true
- `all13ControlledRouteCallerEnvelopesPrepared`: true
- `cpuStatic6ControlledRouteCallerEnvelopesPrepared`: true
- `browserRuntime7ControlledRouteCallerEnvelopesPrepared`: true
- `controlledRouteCallerCanInvokeCanonicalRouteFor13ToolsNow`: true
- `agentCanExecuteControlledRouteToolsNow`: true
- `agentCanExecuteControlledCpuStaticAndBrowserRuntimeRouteToolsNow`: true
- `routeExecutionApprovedForControlled13ToolsNow`: true
- `privateOutputOnly`: true
- `eightGpuModelToolsRemainBlockedFromControlledRouteCaller`: true
- `gpuRuntimeOnDemandOnly`: true
- `noIdleGpuRuntimeApproved`: true
- `gpuStartsOnlyForAcceptedExternalBetaToolCall`: true
- `agentCanSelectForPlanning`: true
- `agentCanExecuteAll21ToolsNow`: false
- `agentCanExecuteGpuModelToolsNow`: false
- `agentCanExecuteToolsNow`: false
- `routeExecutionApprovedNow`: false
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

The agent may invoke `/api/ai-graphics/external-beta/tool-call` only for the 13 controlled CPU/static and browser/runtime tools using the generated private request envelopes. The request must keep output private, must not request signed URLs, must not create public artifacts, and must not start GPU runtime. GPU/model tools stay blocked from this caller until their proof chain is accepted.
