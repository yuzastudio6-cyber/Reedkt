# AI Graphics External Beta Tool-Call Route Readiness Probe Smoke

Decision: `ai_graphics_external_beta_tool_call_route_readiness_probe_smoke_passed`

Status: `canonical_tool_call_route_readiness_probe_reports_13_executable_and_8_blocked`

This smoke proves the canonical external-beta tool-call route exposes a safe readiness probe before an agent tries to call a tool. The probe covers all 21 AI graphics tools: 13 are callable through controlled local/mock canonical routes, and the eight GPU/model tools are known by the route but fail closed until native GPU/model-weight proof is accepted.

## Per-Tool Route Readiness

| Tool | Route mode | Agent can execute this tool now | HTTP status if called now | Route status if called now | GPU starts now | GPU/model unblock plan | Next external-agent action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `torch_torchvision` | `gpu_model_runtime_admission_blocked` | `false` | `409` | `gpu_model_runtime_admission_blocked_pending_native_gpu_and_model_weight_evidence` | `false` | `blocked_pending_native_gpu_runtime_proof` | `provide_native_gpu_runtime_result` |
| `transformers` | `gpu_model_runtime_admission_blocked` | `false` | `409` | `gpu_model_runtime_admission_blocked_pending_native_gpu_and_model_weight_evidence` | `false` | `blocked_pending_native_gpu_runtime_proof` | `provide_native_gpu_runtime_result` |
| `sam2` | `gpu_model_runtime_admission_blocked` | `false` | `409` | `gpu_model_runtime_admission_blocked_pending_native_gpu_and_model_weight_evidence` | `false` | `blocked_pending_private_model_weight_evidence_and_native_gpu_runtime_proof` | `provide_reviewed_private_model_weight_evidence_then_native_gpu_runtime_result` |
| `birefnet` | `gpu_model_runtime_admission_blocked` | `false` | `409` | `gpu_model_runtime_admission_blocked_pending_native_gpu_and_model_weight_evidence` | `false` | `blocked_pending_private_model_weight_evidence_and_native_gpu_runtime_proof` | `provide_reviewed_private_model_weight_evidence_then_native_gpu_runtime_result` |
| `real_esrgan` | `gpu_model_runtime_admission_blocked` | `false` | `409` | `gpu_model_runtime_admission_blocked_pending_native_gpu_and_model_weight_evidence` | `false` | `blocked_pending_private_model_weight_evidence_and_native_gpu_runtime_proof` | `provide_reviewed_private_model_weight_evidence_then_native_gpu_runtime_result` |
| `kornia` | `gpu_model_runtime_admission_blocked` | `false` | `409` | `gpu_model_runtime_admission_blocked_pending_native_gpu_and_model_weight_evidence` | `false` | `blocked_pending_native_gpu_runtime_proof` | `provide_native_gpu_runtime_result` |
| `rembg` | `gpu_model_runtime_admission_blocked` | `false` | `409` | `gpu_model_runtime_admission_blocked_pending_native_gpu_and_model_weight_evidence` | `false` | `blocked_pending_private_model_weight_evidence_and_native_gpu_runtime_proof` | `provide_reviewed_private_model_weight_evidence_then_native_gpu_runtime_result` |
| `transparent_background` | `gpu_model_runtime_admission_blocked` | `false` | `409` | `gpu_model_runtime_admission_blocked_pending_native_gpu_and_model_weight_evidence` | `false` | `blocked_pending_private_model_weight_evidence_and_native_gpu_runtime_proof` | `provide_reviewed_private_model_weight_evidence_then_native_gpu_runtime_result` |
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
- `externalAgentRouteExecutableNowTools`: 13
- `cpuStaticControlledExecutableNowTools`: 6
- `browserRuntimeControlledExecutableNowTools`: 7
- `gpuModelRuntimeAdmissionBlockedTools`: 8
- `gpuModelRuntimeAdmissionEvaluatedFailClosedTools`: 8
- `gpuModelRuntimeUnblockPlanExposedTools`: 8
- `gpuModelNativeGpuProofRequiredTools`: 8
- `gpuModelPrivateEvidenceAndNativeGpuProofRequiredTools`: 5
- `gpuModelNativeGpuProofOnlyRequiredTools`: 3
- `gpuModelToolsReadyForExecutionAfterCurrentEvidence`: 0
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
- `gpuModelUnblockPlanExposed`: true
- `allEightGpuModelToolsHaveActionableUnblockPlan`: true
- `fiveModelWeightToolsRequirePrivateEvidenceBeforeGpuProof`: true
- `threeFoundationGpuToolsRequireNativeGpuProofOnly`: true
- `gpuModelToolsReadyForExecutionAfterCurrentEvidence`: false
- `agentCanExecuteAll21ToolsNow`: false
- `agentCanExecuteGpuModelToolsNow`: false
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

The readiness probe does not execute tools, dispatch Workers, call providers/models, start browser/WebGL/canvas or GPU runtime, download or load model weights, mutate Supabase/GCS, create signed URLs, or create public artifacts. GPU/model tools remain on-demand only and blocked until future accepted native runtime evidence exists.
