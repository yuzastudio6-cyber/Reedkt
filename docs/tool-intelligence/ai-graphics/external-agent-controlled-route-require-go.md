# AI Graphics External Agent Controlled Route Require-Go

Decision: `ai_graphics_external_agent_controlled_route_require_go_approved_with_gpu_model_blocks`

Status: `external_agent_controlled_route_execution_approved_for_thirteen_tools_gpu_model_blocked`

Approves the existing controlled external-agent route path for the 13 proven CPU/static and browser/runtime tools only. The eight GPU/model tools remain fail-closed and GPU stays on-demand/idle until an accepted tool call has the required runtime proof references.

## Source Evidence

- External-agent execution gate: `ai_graphics_external_agent_execution_gate_prepared_fail_closed_with_warnings`
- Controlled worker route execution smoke: `ai_graphics_external_agent_controlled_worker_route_execution_smoke_passed_with_runtime_blocks`

## Controlled Agent-Executable Tools

| Tool | Group | Capability | Agent can execute this controlled route now |
| --- | --- | --- | --- |
| `d3` | `cpu_static_controlled_route` | `chart_overlay` | `true` |
| `vega_lite` | `cpu_static_controlled_route` | `data_visualization` | `true` |
| `vega` | `cpu_static_controlled_route` | `data_visualization` | `true` |
| `satori` | `cpu_static_controlled_route` | `svg_graphics` | `true` |
| `svgdotjs_svg_js` | `cpu_static_controlled_route` | `svg_graphics` | `true` |
| `viz_js` | `cpu_static_controlled_route` | `diagram_graphics` | `true` |
| `echarts` | `browser_runtime_controlled_route` | `chart_overlay` | `true` |
| `lottie_web` | `browser_runtime_controlled_route` | `animation_overlay` | `true` |
| `animejs` | `browser_runtime_controlled_route` | `animation_overlay` | `true` |
| `three_js` | `browser_runtime_controlled_route` | `webgl_3d_scene` | `true` |
| `pixi_js` | `browser_runtime_controlled_route` | `canvas_scene` | `true` |
| `konva` | `browser_runtime_controlled_route` | `canvas_scene` | `true` |
| `babylonjs` | `browser_runtime_controlled_route` | `webgl_3d_scene` | `true` |

## GPU/Model Tools Still Blocked

| Tool | Capability | Remaining blocker |
| --- | --- | --- |
| `torch_torchvision` | `model_runtime_foundation` | `gpu_model_tools_require accepted native GPU/model runtime proof and per-tool external-beta runtime proof before agent execution` |
| `transformers` | `model_runtime_foundation` | `gpu_model_tools_require accepted native GPU/model runtime proof and per-tool external-beta runtime proof before agent execution` |
| `sam2` | `subject_segmentation` | `gpu_model_tools_require accepted native GPU/model runtime proof and per-tool external-beta runtime proof before agent execution` |
| `birefnet` | `background_removal` | `gpu_model_tools_require accepted native GPU/model runtime proof and per-tool external-beta runtime proof before agent execution` |
| `real_esrgan` | `upscaling` | `gpu_model_tools_require accepted native GPU/model runtime proof and per-tool external-beta runtime proof before agent execution` |
| `kornia` | `tensor_image_ops` | `gpu_model_tools_require accepted native GPU/model runtime proof and per-tool external-beta runtime proof before agent execution` |
| `rembg` | `background_removal` | `gpu_model_tools_require accepted native GPU/model runtime proof and per-tool external-beta runtime proof before agent execution` |
| `transparent_background` | `background_removal` | `gpu_model_tools_require accepted native GPU/model runtime proof and per-tool external-beta runtime proof before agent execution` |

## Counts

- `totalAiGraphicsTools`: 21
- `totalProductFacingCapabilities`: 12
- `controlledExternalAgentRouteExecutableToolsNow`: 13
- `cpuStaticControlledRouteExecutableToolsNow`: 6
- `browserRuntimeControlledRouteExecutableToolsNow`: 7
- `gpuModelBlockedToolsNow`: 8
- `agentCanExecuteAll21ToolsNowTools`: 0
- `gpuRuntimeShouldStartNowTools`: 0
- `publicArtifactCreatedTools`: 0
- `signedUrlCreatedTools`: 0
- `productionReadyNowTools`: 0

## Booleans

- `externalAgentControlledRouteRequireGoApproved`: true
- `sourceExternalAgentExecutionGateAccepted`: true
- `sourceExternalAgentControlledWorkerRouteExecutionSmokeAccepted`: true
- `all21ToolsCovered`: true
- `all12CapabilitiesCovered`: true
- `controlled13ToolsAgentExecutableNow`: true
- `cpuStatic6ToolsAgentExecutableNow`: true
- `browserRuntime7ToolsAgentExecutableNow`: true
- `agentCanExecuteControlledRouteToolsNow`: true
- `agentCanExecuteControlledCpuStaticAndBrowserRuntimeRouteToolsNow`: true
- `routeExecutionApprovedForControlled13ToolsNow`: true
- `gpuModel8ToolsRemainBlocked`: true
- `gpuRuntimeOnDemandOnly`: true
- `noIdleGpuRuntimeApproved`: true
- `gpuStartsOnlyForAcceptedExternalBetaToolCall`: true
- `agentCanSelectForPlanning`: true
- `agentCanExecuteAll21ToolsNow`: false
- `agentCanExecuteGpuModelToolsNow`: false
- `agentCanExecuteToolsNow`: false
- `routeExecutionApprovedNow`: false
- `workerExecutionApprovedNow`: false
- `workerExecutionPerformed`: false
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

## Boundary

This require-go packet approves only the controlled external-agent route for the 13 proven CPU/static and browser/runtime tools. It does not unlock all-21 execution, GPU/model execution, provider/model calls, live worker dispatch, Supabase/GCS mutation, signed URLs, public artifacts, internal beta, external beta, production, or package-lock mutation.
