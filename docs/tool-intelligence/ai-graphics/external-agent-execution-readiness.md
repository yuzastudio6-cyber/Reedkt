# AI Graphics External Agent Execution Readiness

Decision: `ai_graphics_external_agent_execution_readiness_all21_evaluated_with_gpu_model_blocks`

Status: `external_agent_call_ready_for_all21_runtime_execution_ready_for13_gpu_model_blocked_pending_private_proof`

This is the strict all-21 external-agent readiness report. It separates `callable` from `executable`: all 21 tools can receive controlled private requests, 13 tools execute controlled local adapters now, and the eight GPU/model tools return `blocked_with_reason` until scoped native CUDA, private model/input, and private proof prerequisites are supplied. GPU runtime is on-demand only and does not start idle.

## State Definitions

- `callable`: The external agent can submit the controlled private route request.
- `executable`: The controlled adapter performed bounded runtime work and produced structured private output evidence.
- `blocked_with_reason`: The request shape is valid, but a required runtime/model/input prerequisite is absent.
- `failed_with_diagnostics`: Execution was attempted or route validation failed and the row includes an actionable reason.

## Tool Rows

| Tool | Group | Readiness state | Callable | Executable | Minimum private runtime inputs | Blocking prerequisite |
| --- | --- | --- | ---: | ---: | --- | --- |
| `torch_torchvision` | `gpu_model` | `blocked_with_reason` | true | false | `outputDirectory, nativeCudaRuntime` | `approved native CUDA host; outputDirectory; nativeCudaRuntime; reviewed private proof refs; adapter skip reason: foundation_runtime_output_directory_missing` |
| `transformers` | `gpu_model` | `blocked_with_reason` | true | false | `outputDirectory, nativeCudaRuntime` | `approved native CUDA host; outputDirectory; nativeCudaRuntime; reviewed private proof refs; adapter skip reason: foundation_runtime_output_directory_missing` |
| `sam2` | `gpu_model` | `blocked_with_reason` | true | false | `outputDirectory, nativeCudaRuntime, sam2CheckpointLocalPath` | `approved native CUDA host; outputDirectory; sam2CheckpointLocalPath; nativeCudaRuntime; reviewed private proof refs; adapter skip reason: sam2_checkpoint_missing` |
| `birefnet` | `gpu_model` | `blocked_with_reason` | true | false | `outputDirectory, nativeCudaRuntime, sourceImageLocalPath, birefnetModelLocalPath` | `approved native CUDA host; outputDirectory; sourceImageLocalPath; birefnetModelLocalPath; nativeCudaRuntime; reviewed private proof refs; adapter skip reason: birefnet_model_missing` |
| `real_esrgan` | `gpu_model` | `blocked_with_reason` | true | false | `outputDirectory, nativeCudaRuntime, sourceImageLocalPath, realEsrganModelLocalPath` | `approved native CUDA host; outputDirectory; sourceImageLocalPath; realEsrganModelLocalPath; nativeCudaRuntime; reviewed private proof refs; adapter skip reason: real_esrgan_model_missing` |
| `kornia` | `gpu_model` | `blocked_with_reason` | true | false | `outputDirectory, nativeCudaRuntime, sourceImageLocalPath` | `approved native CUDA host; outputDirectory; sourceImageLocalPath; nativeCudaRuntime; reviewed private proof refs; adapter skip reason: kornia_source_frame_missing` |
| `rembg` | `gpu_model` | `blocked_with_reason` | true | false | `outputDirectory, nativeCudaRuntime, sourceImageLocalPath, rembgModelLocalPath` | `approved native CUDA host; outputDirectory; sourceImageLocalPath; rembgModelLocalPath; nativeCudaRuntime; reviewed private proof refs; adapter skip reason: rembg_model_missing` |
| `transparent_background` | `gpu_model` | `blocked_with_reason` | true | false | `outputDirectory, nativeCudaRuntime, sourceImageLocalPath, transparentBackgroundCheckpointLocalPath` | `approved native CUDA host; outputDirectory; sourceImageLocalPath; transparentBackgroundCheckpointLocalPath; nativeCudaRuntime; reviewed private proof refs; adapter skip reason: transparent_background_checkpoint_missing` |
| `d3` | `cpu_static` | `executable` | true | true | `none` | `none` |
| `echarts` | `browser_runtime` | `executable` | true | true | `none` | `none` |
| `vega_lite` | `cpu_static` | `executable` | true | true | `none` | `none` |
| `vega` | `cpu_static` | `executable` | true | true | `none` | `none` |
| `satori` | `cpu_static` | `executable` | true | true | `none` | `none` |
| `svgdotjs_svg_js` | `cpu_static` | `executable` | true | true | `none` | `none` |
| `viz_js` | `cpu_static` | `executable` | true | true | `none` | `none` |
| `lottie_web` | `browser_runtime` | `executable` | true | true | `none` | `none` |
| `animejs` | `browser_runtime` | `executable` | true | true | `none` | `none` |
| `three_js` | `browser_runtime` | `executable` | true | true | `none` | `none` |
| `pixi_js` | `browser_runtime` | `executable` | true | true | `none` | `none` |
| `konva` | `browser_runtime` | `executable` | true | true | `none` | `none` |
| `babylonjs` | `browser_runtime` | `executable` | true | true | `none` | `none` |

## Counts

- `totalToolsCovered`: 21
- `agentCallableTools`: 21
- `agentExecutableTools`: 13
- `cpuStaticExecutableTools`: 6
- `browserRuntimeExecutableTools`: 7
- `gpuToolsWithValidRuntimeProof`: 0
- `gpuModelBlockedWithReasonTools`: 8
- `blockedWithReasonTools`: 8
- `failedWithDiagnosticsTools`: 0
- `gpuRuntimeShouldStartNowTools`: 0
- `publicArtifactCreatedTools`: 0
- `signedUrlCreatedTools`: 0
- `workerDispatchPerformedTools`: 0
- `providerRuntimePerformedTools`: 0
- `runtimeReadyNowTools`: 0
- `externalBetaReadyNowTools`: 0
- `productionReadyNowTools`: 0
- `fastestGpuModelUnlockCandidateTools`: 1

## Fastest GPU/Model Unlock Candidate

- Tool: `kornia`
- Recommended backend: `docker_container`
- Canonical proof image: `reeditpro/ai-graphics-gpu-worker:proof-local`
- Reason: Kornia is the narrowest GPU/model execution unlock candidate because it uses the real controlled adapter, requires CUDA plus a private approved frame and output directory, and does not require a model-weight manifest.
- Expected current-host blocker without attached NVIDIA GPU: `gpu_model_runtime_container_gpu_unavailable`
- Next direct harness command: `npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool kornia --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run> --source-image <private-approved-frame.png>`
- Next controlled route command: `npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke -- --scoped-gpu-tool kornia --scoped-gpu-runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --scoped-gpu-runtime-container-platform linux/amd64 --scoped-gpu-output-dir .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/kornia --scoped-gpu-source-image .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/kornia/private-approved-frame.ppm`

## Booleans

- `externalAgentExecutionReadinessCompleted`: true
- `all21ToolsCovered`: true
- `agentCanSubmitControlledToolRequests`: true
- `agentCallableToolsReady`: true
- `all13NonGpuControlledAdapterOutputsValidated`: true
- `all8GpuModelToolsEvaluated`: true
- `gpuModelToolsBlockedUntilPrerequisites`: true
- `scopedGpuModelRuntimeProofAcceptedTools`: 0
- `strictCallableExecutableBlockedFailedContractCreated`: true
- `gpuRuntimeOnDemandOnly`: true
- `noIdleGpuRuntimeApproved`: true
- `gpuRuntimeShouldStartNow`: false
- `sourceScopedGpuRuntimeStartedOnlyDuringAcceptedProof`: true
- `agentCanSelectForPlanning`: true
- `agentCanExecuteToolsNow`: true
- `agentCanExecute13ControlledToolsNow`: true
- `agentCanExecuteAll21ToolsNow`: false
- `agentCanExecuteGpuModelToolsNow`: false
- `routeExecutionApprovedNow`: true
- `routeExecutionPerformedInReadinessRunner`: true
- `toolExecutionApprovedFor13ControlledToolsNow`: true
- `toolExecutionApprovedForGpuModelToolsNow`: false
- `toolExecutionApprovedForAll21ToolsNow`: false
- `workerExecutionApprovedNow`: false
- `workerExecutionPerformed`: false
- `workerDispatchPerformed`: false
- `providerRuntimeApprovedNow`: false
- `providerRuntimePerformed`: false
- `browserWebglCanvasRuntimeApprovedNow`: false
- `gpuRuntimeApprovedNow`: false
- `gpuRuntimePerformed`: false
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

## Next Action

First target kornia with the container local-dev command on an approved native CUDA host. After kornia returns structured private local output, repeat per GPU/model tool with reviewed model/checkpoint paths where required and feed accepted proof back into this readiness report.
