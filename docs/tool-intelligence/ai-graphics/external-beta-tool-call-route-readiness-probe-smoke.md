# AI Graphics External Beta Tool-Call Route Readiness Probe Smoke

Decision: `ai_graphics_external_beta_tool_call_route_readiness_probe_smoke_passed`

Status: `canonical_tool_call_route_readiness_probe_reports_all_21_controlled_executable_with_gpu_on_demand`

This smoke proves the canonical external-beta tool-call route exposes a safe readiness probe before an agent tries to call a tool. The probe covers all 21 AI graphics tools: 21 are callable through controlled local/mock canonical routes, including the eight GPU/model tools through the controlled on-demand adapter. GPU runtime still does not start during readiness probing.

## Per-Tool Route Readiness

| Tool | Route mode | Agent can execute this tool now | HTTP status if called now | Route status if called now | GPU starts now | GPU/model unblock plan | Next external-agent action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `torch_torchvision` | `gpu_model_controlled_execution` | `true` | `200` | `controlled_gpu_model_private_output_or_skip_ready` | `false` | `not_required` | `not_required` |
| `transformers` | `gpu_model_controlled_execution` | `true` | `200` | `controlled_gpu_model_private_output_or_skip_ready` | `false` | `not_required` | `not_required` |
| `sam2` | `gpu_model_controlled_execution` | `true` | `200` | `controlled_gpu_model_private_output_or_skip_ready` | `false` | `not_required` | `not_required` |
| `birefnet` | `gpu_model_controlled_execution` | `true` | `200` | `controlled_gpu_model_private_output_or_skip_ready` | `false` | `not_required` | `not_required` |
| `real_esrgan` | `gpu_model_controlled_execution` | `true` | `200` | `controlled_gpu_model_private_output_or_skip_ready` | `false` | `not_required` | `not_required` |
| `kornia` | `gpu_model_controlled_execution` | `true` | `200` | `controlled_gpu_model_private_output_or_skip_ready` | `false` | `not_required` | `not_required` |
| `rembg` | `gpu_model_controlled_execution` | `true` | `200` | `controlled_gpu_model_private_output_or_skip_ready` | `false` | `not_required` | `not_required` |
| `transparent_background` | `gpu_model_controlled_execution` | `true` | `200` | `controlled_gpu_model_private_output_or_skip_ready` | `false` | `not_required` | `not_required` |
| `d3` | `cpu_static_controlled_execution` | `true` | `200` | `controlled_private_output_ready` | `false` | `not_required` | `not_required` |
| `echarts` | `browser_runtime_controlled_execution` | `true` | `200` | `controlled_private_output_ready` | `false` | `not_required` | `not_required` |
| `vega_lite` | `cpu_static_controlled_execution` | `true` | `200` | `controlled_private_output_ready` | `false` | `not_required` | `not_required` |
| `vega` | `cpu_static_controlled_execution` | `true` | `200` | `controlled_private_output_ready` | `false` | `not_required` | `not_required` |
| `satori` | `cpu_static_controlled_execution` | `true` | `200` | `controlled_private_output_ready` | `false` | `not_required` | `not_required` |
| `svgdotjs_svg_js` | `cpu_static_controlled_execution` | `true` | `200` | `controlled_private_output_ready` | `false` | `not_required` | `not_required` |
| `viz_js` | `cpu_static_controlled_execution` | `true` | `200` | `controlled_private_output_ready` | `false` | `not_required` | `not_required` |
| `lottie_web` | `browser_runtime_controlled_execution` | `true` | `200` | `controlled_private_output_ready` | `false` | `not_required` | `not_required` |
| `animejs` | `browser_runtime_controlled_execution` | `true` | `200` | `controlled_private_output_ready` | `false` | `not_required` | `not_required` |
| `three_js` | `browser_runtime_controlled_execution` | `true` | `200` | `controlled_private_output_ready` | `false` | `not_required` | `not_required` |
| `pixi_js` | `browser_runtime_controlled_execution` | `true` | `200` | `controlled_private_output_ready` | `false` | `not_required` | `not_required` |
| `konva` | `browser_runtime_controlled_execution` | `true` | `200` | `controlled_private_output_ready` | `false` | `not_required` | `not_required` |
| `babylonjs` | `browser_runtime_controlled_execution` | `true` | `200` | `controlled_private_output_ready` | `false` | `not_required` | `not_required` |

## Counts

- `totalAiGraphicsTools`: 21
- `productFacingCapabilities`: 12
- `externalAgentRouteExecutableNowTools`: 21
- `cpuStaticControlledExecutableNowTools`: 6
- `browserRuntimeControlledExecutableNowTools`: 7
- `gpuModelRuntimeAdmissionBlockedTools`: 0
- `gpuModelRuntimeAdmissionEvaluatedFailClosedTools`: 8
- `gpuModelRuntimeUnblockPlanExposedTools`: 0
- `gpuModelNativeGpuProofRequiredTools`: 0
- `gpuModelPrivateEvidenceAndNativeGpuProofRequiredTools`: 0
- `gpuModelNativeGpuProofOnlyRequiredTools`: 0
- `gpuModelToolsReadyForExecutionAfterCurrentEvidence`: 8
- `modelWeightManifestRequiredTools`: 5
- `gpuRuntimeShouldStartNowTools`: 0
- `workerDispatchApprovedNowTools`: 0
- `workerDispatchPerformedTools`: 0
- `providerRuntimePerformedTools`: 0
- `publicArtifactCreatedTools`: 0
- `signedUrlCreatedTools`: 0

## Booleans

- `externalBetaToolCallRouteReadinessProbeSafe`: true
- `routeMountedByAppNow`: true
- `mockOnlyRuntimeModeEnforced`: true
- `agentCanSelectForPlanning`: true
- `externalAgentCanExecuteSomeToolsNow`: true
- `agentCanExecuteControlledCpuStaticAndBrowserRuntimeToolsNow`: true
- `gpuModelUnblockPlanExposed`: false
- `allEightGpuModelToolsHaveActionableUnblockPlan`: false
- `fiveModelWeightToolsRequirePrivateEvidenceBeforeGpuProof`: false
- `threeFoundationGpuToolsRequireNativeGpuProofOnly`: false
- `gpuModelToolsReadyForExecutionAfterCurrentEvidence`: true
- `agentCanExecuteAll21ToolsNow`: true
- `agentCanExecuteGpuModelToolsNow`: true
- `routeExecutionPerformedByReadinessProbe`: false
- `workerExecutionApprovedNow`: false
- `workerDispatchApprovedNow`: false
- `workerDispatchPerformed`: false
- `toolExecutionApprovedNow`: false
- `toolExecutionPerformedByReadinessProbe`: false
- `providerRuntimeApprovedNow`: false
- `providerRuntimePerformed`: false
- `browserWebglCanvasRuntimeApprovedNow`: false
- `browserWebglCanvasRuntimePerformedByReadinessProbe`: false
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

The readiness probe does not execute tools, dispatch Workers, call providers/models, start browser/WebGL/canvas or GPU runtime, download or load model weights, mutate Supabase/GCS, create signed URLs, or create public artifacts. GPU/model tools remain on-demand only: the controlled adapter is callable, but GPU startup is still tied to an accepted tool call and never starts while idle.
