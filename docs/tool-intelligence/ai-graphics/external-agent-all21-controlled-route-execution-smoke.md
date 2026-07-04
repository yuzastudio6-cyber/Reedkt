# AI Graphics External Agent All-21 Controlled Route Execution Smoke

Decision: `ai_graphics_external_agent_all21_controlled_route_execution_smoke_passed`

Status: `external_agent_all21_controlled_route_execution_passed_with_gpu_on_demand`

This smoke starts the real Express app and POSTs all 21 AI graphics tool calls through `/api/ai-graphics/external-beta/tool-call` with the controlled CPU/static, browser-runtime, and GPU/model route flags enabled. It proves the agent-facing route can accept every tool call now. It does not claim all 21 tools have real runtime execution proof: CPU/static and browser-runtime adapters execute now, while GPU/model adapters are route-callable and remain blocked from runtime execution until native GPU proof and reviewed private model manifests are accepted.

## Tool Results

| Tool | Group | Capability | External-agent state | Callable | Executable | Blocked with reason | HTTP status | Adapter invoked | Adapter executed | Local package execution | Local GPU/model runtime | GPU starts now |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `torch_torchvision` | `gpu_model` | `model_runtime_foundation` | `blocked_with_reason` | `true` | `false` | `true` | `200` | `true` | `false` | `false` | `false` | `false` |
| `transformers` | `gpu_model` | `model_runtime_foundation` | `blocked_with_reason` | `true` | `false` | `true` | `200` | `true` | `false` | `false` | `false` | `false` |
| `sam2` | `gpu_model` | `subject_segmentation` | `blocked_with_reason` | `true` | `false` | `true` | `200` | `true` | `false` | `false` | `false` | `false` |
| `birefnet` | `gpu_model` | `background_removal` | `blocked_with_reason` | `true` | `false` | `true` | `200` | `true` | `false` | `false` | `false` | `false` |
| `real_esrgan` | `gpu_model` | `upscaling` | `blocked_with_reason` | `true` | `false` | `true` | `200` | `true` | `false` | `false` | `false` | `false` |
| `kornia` | `gpu_model` | `tensor_image_ops` | `blocked_with_reason` | `true` | `false` | `true` | `200` | `true` | `false` | `false` | `false` | `false` |
| `rembg` | `gpu_model` | `background_removal` | `blocked_with_reason` | `true` | `false` | `true` | `200` | `true` | `false` | `false` | `false` | `false` |
| `transparent_background` | `gpu_model` | `background_removal` | `blocked_with_reason` | `true` | `false` | `true` | `200` | `true` | `false` | `false` | `false` | `false` |
| `d3` | `cpu_static` | `chart_overlay` | `executable` | `true` | `true` | `false` | `200` | `true` | `true` | `true` | `false` | `false` |
| `echarts` | `browser_runtime` | `chart_overlay` | `executable` | `true` | `true` | `false` | `200` | `true` | `true` | `true` | `false` | `false` |
| `vega_lite` | `cpu_static` | `data_visualization` | `executable` | `true` | `true` | `false` | `200` | `true` | `true` | `true` | `false` | `false` |
| `vega` | `cpu_static` | `data_visualization` | `executable` | `true` | `true` | `false` | `200` | `true` | `true` | `true` | `false` | `false` |
| `satori` | `cpu_static` | `svg_graphics` | `executable` | `true` | `true` | `false` | `200` | `true` | `true` | `true` | `false` | `false` |
| `svgdotjs_svg_js` | `cpu_static` | `svg_graphics` | `executable` | `true` | `true` | `false` | `200` | `true` | `true` | `true` | `false` | `false` |
| `viz_js` | `cpu_static` | `diagram_graphics` | `executable` | `true` | `true` | `false` | `200` | `true` | `true` | `true` | `false` | `false` |
| `lottie_web` | `browser_runtime` | `animation_overlay` | `executable` | `true` | `true` | `false` | `200` | `true` | `true` | `true` | `false` | `false` |
| `animejs` | `browser_runtime` | `animation_overlay` | `executable` | `true` | `true` | `false` | `200` | `true` | `true` | `true` | `false` | `false` |
| `three_js` | `browser_runtime` | `webgl_3d_scene` | `executable` | `true` | `true` | `false` | `200` | `true` | `true` | `true` | `false` | `false` |
| `pixi_js` | `browser_runtime` | `canvas_scene` | `executable` | `true` | `true` | `false` | `200` | `true` | `true` | `true` | `false` | `false` |
| `konva` | `browser_runtime` | `canvas_scene` | `executable` | `true` | `true` | `false` | `200` | `true` | `true` | `true` | `false` | `false` |
| `babylonjs` | `browser_runtime` | `webgl_3d_scene` | `executable` | `true` | `true` | `false` | `200` | `true` | `true` | `true` | `false` | `false` |

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
- `normalizedExternalAgentToolCallResultTools`: 21
- `normalizedExternalAgentCallableResultTools`: 21
- `normalizedExternalAgentExecutableResultTools`: 13
- `normalizedExternalAgentBlockedWithReasonResultTools`: 8
- `normalizedExternalAgentFailedWithDiagnosticsResultTools`: 0
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
- `scopedGpuModelLocalDevRouteAttemptTools`: 8
- `scopedGpuModelLocalDevRouteAttemptBlockedWithReasonTools`: 8
- `scopedGpuModelLocalDevRouteAttemptRuntimeExecutedTools`: 0
- `capabilityMismatchFailureProbeTools`: 1

## Booleans

- `all21ControlledRouteExecutionSmokePassed`: true
- `all21ToolsCovered`: true
- `all21ToolsReturnedHttp200`: true
- `all21ControlledAdaptersInvoked`: true
- `cpuStaticControlledAdaptersExecuted`: true
- `browserRuntimeControlledAdaptersExecuted`: true
- `gpuModelControlledAdaptersInvoked`: true
- `normalizedExternalAgentExecutionStatesReturned`: true
- `normalizedExternalAgentToolCallResultsReturned`: true
- `normalizedExternalAgentToolCallResultsMatchStates`: true
- `normalizedExternalAgentToolCallResultsPreserveSafetyGates`: true
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
- `all8ScopedGpuModelLocalDevRouteAttemptsAccepted`: true
- `all8ScopedGpuModelRuntimeContainerPayloadsAccepted`: true
- `capabilityMismatchFailureProbeAccepted`: true
- `scopedGpuModelLocalDevRouteAttemptAccepted`: true
- `scopedGpuModelLocalDevRouteAttemptBlockedWithReason`: true
- `scopedGpuModelRuntimeContainerPayloadAccepted`: true
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

## Scoped GPU/model route attempts

| Tool | External-agent state | Blocking reason | Runtime image provided | Runtime executed | GPU starts now | Next exact command |
| --- | --- | --- | --- | --- | --- | --- |
| `torch_torchvision` | `blocked_with_reason` | `gpu_model_runtime_container_image_missing` | `false` | `false` | `false` | `npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke -- --scoped-gpu-tool torch_torchvision --scoped-gpu-runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --scoped-gpu-runtime-container-platform linux/amd64 --scoped-gpu-output-dir .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/torch_torchvision` |
| `transformers` | `blocked_with_reason` | `gpu_model_runtime_container_image_missing` | `false` | `false` | `false` | `npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke -- --scoped-gpu-tool transformers --scoped-gpu-runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --scoped-gpu-runtime-container-platform linux/amd64 --scoped-gpu-output-dir .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/transformers` |
| `sam2` | `blocked_with_reason` | `gpu_model_runtime_container_image_missing` | `false` | `false` | `false` | `npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke -- --scoped-gpu-tool sam2 --scoped-gpu-runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --scoped-gpu-runtime-container-platform linux/amd64 --scoped-gpu-output-dir .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/sam2 --scoped-gpu-source-image .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/sam2/private-approved-frame.ppm --scoped-gpu-sam2-checkpoint .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/sam2/private-sam2-checkpoint.pt` |
| `birefnet` | `blocked_with_reason` | `gpu_model_runtime_container_image_missing` | `false` | `false` | `false` | `npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke -- --scoped-gpu-tool birefnet --scoped-gpu-runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --scoped-gpu-runtime-container-platform linux/amd64 --scoped-gpu-output-dir .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/birefnet --scoped-gpu-source-image .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/birefnet/private-approved-frame.ppm --scoped-gpu-birefnet-model .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/birefnet/private-birefnet-model` |
| `real_esrgan` | `blocked_with_reason` | `gpu_model_runtime_container_image_missing` | `false` | `false` | `false` | `npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke -- --scoped-gpu-tool real_esrgan --scoped-gpu-runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --scoped-gpu-runtime-container-platform linux/amd64 --scoped-gpu-output-dir .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/real_esrgan --scoped-gpu-source-image .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/real_esrgan/private-approved-frame.ppm --scoped-gpu-real-esrgan-model .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/real_esrgan/private-real-esrgan-model.pth` |
| `kornia` | `blocked_with_reason` | `gpu_model_runtime_container_image_missing` | `false` | `false` | `false` | `npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke -- --scoped-gpu-tool kornia --scoped-gpu-runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --scoped-gpu-runtime-container-platform linux/amd64 --scoped-gpu-output-dir .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/kornia --scoped-gpu-source-image .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/kornia/private-approved-frame.ppm` |
| `rembg` | `blocked_with_reason` | `gpu_model_runtime_container_image_missing` | `false` | `false` | `false` | `npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke -- --scoped-gpu-tool rembg --scoped-gpu-runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --scoped-gpu-runtime-container-platform linux/amd64 --scoped-gpu-output-dir .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/rembg --scoped-gpu-source-image .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/rembg/private-approved-frame.ppm --scoped-gpu-rembg-model .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/rembg/private-rembg-model.onnx` |
| `transparent_background` | `blocked_with_reason` | `gpu_model_runtime_container_image_missing` | `false` | `false` | `false` | `npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke -- --scoped-gpu-tool transparent_background --scoped-gpu-runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --scoped-gpu-runtime-container-platform linux/amd64 --scoped-gpu-output-dir .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/transparent_background --scoped-gpu-source-image .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/transparent_background/private-approved-frame.ppm --scoped-gpu-transparent-background-checkpoint .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/transparent_background/private-transparent-background-checkpoint.pth` |

## Capability mismatch failure probe

- `toolId`: `d3`
- `requestedCapabilityId`: `background_removal`
- `externalAgentExecutionState`: `failed_with_diagnostics`
- `routeStatus`: `external_beta_tool_call_route_failed_with_diagnostics_capability_mismatch`
- `failureDiagnostics`: `AI graphics capability background_removal is not valid for d3.`
- `adapterInvoked`: `false`
- `adapterExecuted`: `false`
- `expectedCapabilities`: `chart_overlay, data_visualization, svg_graphics, diagram_graphics, planning_metadata_only`

## Canonical fastest scoped GPU/model route attempt

- `toolId`: `kornia`
- `runtimeExecutionBackend`: `docker_container`
- `runtimeContainerImageProvided`: `false`
- `requestedRuntimeContainerImage`: `null`
- `nextExactCommand`: `npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke -- --scoped-gpu-tool kornia --scoped-gpu-runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --scoped-gpu-runtime-container-platform linux/amd64 --scoped-gpu-output-dir .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/kornia --scoped-gpu-source-image .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/kornia/private-approved-frame.ppm`
- `externalAgentExecutionState`: `blocked_with_reason`
- `blockingReasonCode`: `gpu_model_runtime_container_image_missing`
- `gpuRuntimeShouldStartNow`: `false`

POSTs a scoped GPU/model local-dev runtime request through the mounted external-agent route. The request includes explicit private local input/output paths and runtimeExecutionBackend=docker_container, but intentionally omits runtimeContainerImage so the route proves payload forwarding into the GPU/model adapter while blocking before any GPU startup or model execution.

## Boundary

This smoke does not dispatch Workers, call providers/models, mutate Supabase/GCS, create signed URLs, create public artifacts, download model weights, unlock paid production, or mark runtime/beta/production ready. CPU/static and browser-runtime adapters execute in the explicit mock/local controlled route. GPU/model adapters are invoked through the controlled route, but local GPU/model runtime does not start until a scoped request supplies explicit local-dev runtime inputs, reviewed private manifests, accepted native GPU proof, and approval refs.

Missing private source/model/checkpoint paths block before Docker GPU attachment. If no Docker runtime image is supplied, the scoped request blocks at the missing image prerequisite before inspecting local private inputs.
