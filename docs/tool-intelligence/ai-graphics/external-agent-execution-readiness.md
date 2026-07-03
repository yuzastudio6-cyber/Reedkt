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

| Tool | Group | Readiness state | Callable | Executable | Blocking prerequisite |
| --- | --- | --- | ---: | ---: | --- |
| `torch_torchvision` | `gpu_model` | `blocked_with_reason` | true | false | `approved native CUDA host; outputDirectory; nativeCudaRuntime; reviewed private proof refs; adapter skip reason: foundation_runtime_output_directory_missing` |
| `transformers` | `gpu_model` | `blocked_with_reason` | true | false | `approved native CUDA host; outputDirectory; nativeCudaRuntime; reviewed private proof refs; adapter skip reason: foundation_runtime_output_directory_missing` |
| `sam2` | `gpu_model` | `blocked_with_reason` | true | false | `approved native CUDA host; outputDirectory; sam2CheckpointLocalPath; nativeCudaRuntime; reviewed private proof refs; adapter skip reason: sam2_checkpoint_missing` |
| `birefnet` | `gpu_model` | `blocked_with_reason` | true | false | `approved native CUDA host; outputDirectory; sourceImageLocalPath; birefnetModelLocalPath; nativeCudaRuntime; reviewed private proof refs; adapter skip reason: birefnet_model_missing` |
| `real_esrgan` | `gpu_model` | `blocked_with_reason` | true | false | `approved native CUDA host; outputDirectory; sourceImageLocalPath; realEsrganModelLocalPath; nativeCudaRuntime; reviewed private proof refs; adapter skip reason: real_esrgan_model_missing` |
| `kornia` | `gpu_model` | `blocked_with_reason` | true | false | `approved native CUDA host; outputDirectory; sourceImageLocalPath; nativeCudaRuntime; reviewed private proof refs; adapter skip reason: kornia_source_frame_missing` |
| `rembg` | `gpu_model` | `blocked_with_reason` | true | false | `approved native CUDA host; outputDirectory; sourceImageLocalPath; rembgModelLocalPath; nativeCudaRuntime; reviewed private proof refs; adapter skip reason: rembg_model_missing` |
| `transparent_background` | `gpu_model` | `blocked_with_reason` | true | false | `approved native CUDA host; outputDirectory; sourceImageLocalPath; transparentBackgroundCheckpointLocalPath; nativeCudaRuntime; reviewed private proof refs; adapter skip reason: transparent_background_checkpoint_missing` |
| `d3` | `cpu_static` | `executable` | true | true | `none` |
| `echarts` | `browser_runtime` | `executable` | true | true | `none` |
| `vega_lite` | `cpu_static` | `executable` | true | true | `none` |
| `vega` | `cpu_static` | `executable` | true | true | `none` |
| `satori` | `cpu_static` | `executable` | true | true | `none` |
| `svgdotjs_svg_js` | `cpu_static` | `executable` | true | true | `none` |
| `viz_js` | `cpu_static` | `executable` | true | true | `none` |
| `lottie_web` | `browser_runtime` | `executable` | true | true | `none` |
| `animejs` | `browser_runtime` | `executable` | true | true | `none` |
| `three_js` | `browser_runtime` | `executable` | true | true | `none` |
| `pixi_js` | `browser_runtime` | `executable` | true | true | `none` |
| `konva` | `browser_runtime` | `executable` | true | true | `none` |
| `babylonjs` | `browser_runtime` | `executable` | true | true | `none` |

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

Run GPU/model local-dev harness on an approved native CUDA host with reviewed private model/checkpoint paths, private source frame/media, and private output directory; then feed accepted per-tool proof back into this readiness report.
