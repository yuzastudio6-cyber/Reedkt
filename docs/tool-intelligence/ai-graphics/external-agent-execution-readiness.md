# AI Graphics External Agent Execution Readiness

Decision: `ai_graphics_external_agent_execution_readiness_all21_evaluated_with_gpu_model_blocks`

Status: `external_agent_call_ready_for_all21_runtime_execution_ready_for13_gpu_model_blocked_pending_private_proof`

This is the strict all-21 external-agent readiness report. It separates `callable` from `executable`: all 21 tools can receive controlled private requests, 13 tools execute controlled local adapters now, and those 13 are also proven through the mock worker-claim-to-canonical-route smoke. The eight GPU/model tools return `blocked_with_reason` until scoped native CUDA, private model/input, and private proof prerequisites are supplied. The mounted route also proves a capability-mismatch request returns `failed_with_diagnostics` without invoking an adapter. GPU runtime is on-demand only and does not start idle.

## State Definitions

- `callable`: The external agent can submit the controlled private route request.
- `executable`: The controlled adapter performed bounded runtime work and produced structured private output evidence.
- `blocked_with_reason`: The request shape is valid, but a required runtime/model/input prerequisite is absent.
- `failed_with_diagnostics`: Execution was attempted or route validation failed and the row includes an actionable reason.

## Execution Scope

- `agentCanSubmitControlledRequestsForAll21`: true
- `agentCanExecuteAnyControlledToolNow`: true
- `agentCanExecute13NonGpuControlledToolsNow`: true
- `agentCanExecuteGpuModelToolsNow`: false
- `agentCanExecuteAll21ControlledToolsNow`: false
- `agentExecutableToolCountNow`: 13
- `agentExecutableNonGpuToolCountNow`: 13
- `agentExecutableGpuModelToolCountNow`: 0
- `gpuModelBlockedToolCountNow`: 8
- `currentHostGpuProofPreflightRequested`: false
- `currentHostEligibleForGpuProof`: false
- `currentHostGpuProofBlockers`: none
- `currentHostGpuProofPreflightCommand`: npm run --silent ai-graphics:external-agent-execution-readiness -- --detect-host

## Tool Rows

| Tool | Group | Install/runtime state | Readiness state | Callable | Executable | Worker-route evidence accepted | Current blocker | Remaining private runtime inputs | Minimum private runtime inputs | Blocking prerequisite |
| --- | --- | --- | --- | ---: | ---: | ---: | --- | --- | --- | --- |
| `torch_torchvision` | `gpu_model` | `install_target_prepared_runtime_blocked_pending_cuda_private_inputs` | `blocked_with_reason` | true | false | true | `outputDirectory` | `nativeCudaRuntime` | `outputDirectory, nativeCudaRuntime` | `approved native CUDA host; outputDirectory; nativeCudaRuntime; reviewed private proof refs; adapter skip reason: foundation_runtime_output_directory_missing` |
| `transformers` | `gpu_model` | `install_target_prepared_runtime_blocked_pending_cuda_private_inputs` | `blocked_with_reason` | true | false | true | `outputDirectory` | `nativeCudaRuntime` | `outputDirectory, nativeCudaRuntime` | `approved native CUDA host; outputDirectory; nativeCudaRuntime; reviewed private proof refs; adapter skip reason: foundation_runtime_output_directory_missing` |
| `sam2` | `gpu_model` | `install_target_prepared_runtime_blocked_pending_cuda_private_inputs` | `blocked_with_reason` | true | false | true | `sam2CheckpointLocalPath` | `outputDirectory, nativeCudaRuntime, sourceImageLocalPath` | `outputDirectory, nativeCudaRuntime, sourceImageLocalPath, sam2CheckpointLocalPath` | `approved native CUDA host; outputDirectory; sourceImageLocalPath; sam2CheckpointLocalPath; nativeCudaRuntime; reviewed private proof refs; adapter skip reason: sam2_checkpoint_missing` |
| `birefnet` | `gpu_model` | `install_target_prepared_runtime_blocked_pending_cuda_private_inputs` | `blocked_with_reason` | true | false | true | `birefnetModelLocalPath` | `outputDirectory, nativeCudaRuntime, sourceImageLocalPath` | `outputDirectory, nativeCudaRuntime, sourceImageLocalPath, birefnetModelLocalPath` | `approved native CUDA host; outputDirectory; sourceImageLocalPath; birefnetModelLocalPath; nativeCudaRuntime; reviewed private proof refs; adapter skip reason: birefnet_model_missing` |
| `real_esrgan` | `gpu_model` | `install_target_prepared_runtime_blocked_pending_cuda_private_inputs` | `blocked_with_reason` | true | false | true | `realEsrganModelLocalPath` | `outputDirectory, nativeCudaRuntime, sourceImageLocalPath` | `outputDirectory, nativeCudaRuntime, sourceImageLocalPath, realEsrganModelLocalPath` | `approved native CUDA host; outputDirectory; sourceImageLocalPath; realEsrganModelLocalPath; nativeCudaRuntime; reviewed private proof refs; adapter skip reason: real_esrgan_model_missing` |
| `kornia` | `gpu_model` | `install_target_prepared_runtime_blocked_pending_cuda_private_inputs` | `blocked_with_reason` | true | false | true | `sourceImageLocalPath` | `outputDirectory, nativeCudaRuntime` | `outputDirectory, nativeCudaRuntime, sourceImageLocalPath` | `approved native CUDA host; outputDirectory; sourceImageLocalPath; nativeCudaRuntime; reviewed private proof refs; adapter skip reason: kornia_source_frame_missing` |
| `rembg` | `gpu_model` | `install_target_prepared_runtime_blocked_pending_cuda_private_inputs` | `blocked_with_reason` | true | false | true | `rembgModelLocalPath` | `outputDirectory, nativeCudaRuntime, sourceImageLocalPath` | `outputDirectory, nativeCudaRuntime, sourceImageLocalPath, rembgModelLocalPath` | `approved native CUDA host; outputDirectory; sourceImageLocalPath; rembgModelLocalPath; nativeCudaRuntime; reviewed private proof refs; adapter skip reason: rembg_model_missing` |
| `transparent_background` | `gpu_model` | `install_target_prepared_runtime_blocked_pending_cuda_private_inputs` | `blocked_with_reason` | true | false | true | `transparentBackgroundCheckpointLocalPath` | `outputDirectory, nativeCudaRuntime, sourceImageLocalPath` | `outputDirectory, nativeCudaRuntime, sourceImageLocalPath, transparentBackgroundCheckpointLocalPath` | `approved native CUDA host; outputDirectory; sourceImageLocalPath; transparentBackgroundCheckpointLocalPath; nativeCudaRuntime; reviewed private proof refs; adapter skip reason: transparent_background_checkpoint_missing` |
| `d3` | `cpu_static` | `controlled_runtime_present_and_executed` | `executable` | true | true | true | `none` | `none` | `none` | `none` |
| `echarts` | `browser_runtime` | `controlled_runtime_present_and_executed` | `executable` | true | true | true | `none` | `none` | `none` | `none` |
| `vega_lite` | `cpu_static` | `controlled_runtime_present_and_executed` | `executable` | true | true | true | `none` | `none` | `none` | `none` |
| `vega` | `cpu_static` | `controlled_runtime_present_and_executed` | `executable` | true | true | true | `none` | `none` | `none` | `none` |
| `satori` | `cpu_static` | `controlled_runtime_present_and_executed` | `executable` | true | true | true | `none` | `none` | `none` | `none` |
| `svgdotjs_svg_js` | `cpu_static` | `controlled_runtime_present_and_executed` | `executable` | true | true | true | `none` | `none` | `none` | `none` |
| `viz_js` | `cpu_static` | `controlled_runtime_present_and_executed` | `executable` | true | true | true | `none` | `none` | `none` | `none` |
| `lottie_web` | `browser_runtime` | `controlled_runtime_present_and_executed` | `executable` | true | true | true | `none` | `none` | `none` | `none` |
| `animejs` | `browser_runtime` | `controlled_runtime_present_and_executed` | `executable` | true | true | true | `none` | `none` | `none` | `none` |
| `three_js` | `browser_runtime` | `controlled_runtime_present_and_executed` | `executable` | true | true | true | `none` | `none` | `none` | `none` |
| `pixi_js` | `browser_runtime` | `controlled_runtime_present_and_executed` | `executable` | true | true | true | `none` | `none` | `none` | `none` |
| `konva` | `browser_runtime` | `controlled_runtime_present_and_executed` | `executable` | true | true | true | `none` | `none` | `none` | `none` |
| `babylonjs` | `browser_runtime` | `controlled_runtime_present_and_executed` | `executable` | true | true | true | `none` | `none` | `none` | `none` |

## Counts

- `totalToolsCovered`: 21
- `packageRuntimePresentForPlannedSurfaceTools`: 21
- `controlledExecutionRuntimePresentNowTools`: 13
- `agentCallableTools`: 21
- `agentExecutableTools`: 13
- `cpuStaticExecutableTools`: 6
- `browserRuntimeExecutableTools`: 7
- `gpuToolsWithValidRuntimeProof`: 0
- `gpuModelProofRefBridgeAcceptedTools`: 0
- `gpuModelProofRefBridgeBlockedTools`: 8
- `controlledWorkerRouteExecutableTools`: 13
- `mockWorkerQueueJobCreatedTools`: 13
- `mockWorkerClaimPerformedTools`: 13
- `mockWorkerEventRecordedTools`: 13
- `gpuModelBlockedByControlledWorkerRouteTools`: 8
- `gpuModelBlockedWithReasonTools`: 8
- `currentHostGpuProofBlockers`: 0
- `blockedWithReasonTools`: 8
- `failedWithDiagnosticsTools`: 0
- `capabilityMismatchFailureProbeTools`: 1
- `gpuRuntimeShouldStartNowTools`: 0
- `publicArtifactCreatedTools`: 0
- `signedUrlCreatedTools`: 0
- `workerDispatchPerformedTools`: 0
- `providerRuntimePerformedTools`: 0
- `runtimeReadyNowTools`: 0
- `externalBetaReadyNowTools`: 0
- `productionReadyNowTools`: 0
- `fastestGpuModelUnlockCandidateTools`: 1
- `privateLocalRuntimeProofResultSuppliedTools`: 0

## Fastest GPU/Model Unlock Candidate

- Tool: `kornia`
- Recommended backend: `docker_container`
- Canonical proof image: `reeditpro/ai-graphics-gpu-worker:proof-local`
- Reason: Kornia is the narrowest GPU/model execution unlock candidate because it uses the real controlled adapter, requires CUDA plus a private approved frame and output directory, and does not require a model-weight manifest.
- Expected current-host blocker without attached NVIDIA GPU: `gpu_model_runtime_container_gpu_unavailable`
- Build proof-local image if missing: `docker buildx build --platform linux/amd64 --target ai_graphics_install_proof -f docker/prod/gpu-worker/Dockerfile -t reeditpro/ai-graphics-gpu-worker:proof-local .`
- Next direct harness command: `npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool kornia --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run> --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json --source-image <private-approved-frame.png>`
- Next controlled route command: `npm run --silent ai-graphics:external-agent-all21-controlled-route-execution-smoke -- --scoped-gpu-tool kornia --scoped-gpu-runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --scoped-gpu-runtime-container-platform linux/amd64 --scoped-gpu-output-dir .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/kornia --scoped-gpu-source-image .local-artifacts/ai-graphics/gpu-model-route-runtime-attempt-smoke/kornia/private-approved-frame.ppm`
- Next proof-ref bridge command: `npm run --silent ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge -- --local-runtime-proof-result .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json`
- Next direct readiness command with private proof: `npm run --silent ai-graphics:external-agent-execution-readiness -- --local-runtime-proof-result .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json`
- Next current-host preflight command: `npm run --silent ai-graphics:external-agent-execution-readiness -- --detect-host`

## Failure Diagnostics Guard

- Capability mismatch probe accepted: `true`
- Probe count: `1`
- Probe state: `failed_with_diagnostics`
- Guard: a valid tool with the wrong product-facing capability returns `failed_with_diagnostics` and does not invoke or execute an adapter.

## Booleans

- `externalAgentExecutionReadinessCompleted`: true
- `all21ToolsCovered`: true
- `all21ToolsHaveInstallSurfaceEvidence`: true
- `thirteenToolsHaveControlledExecutionRuntimePresentNow`: true
- `eightGpuModelToolsInstallTargetPreparedButRuntimeBlocked`: true
- `agentCanSubmitControlledToolRequests`: true
- `agentCallableToolsReady`: true
- `all13NonGpuControlledAdapterOutputsValidated`: true
- `controlledWorkerRouteSmokeAccepted`: true
- `all13NonGpuControlledWorkerRouteOutputsValidated`: true
- `mockWorkerClaimBeforeRouteExecutionAccepted`: true
- `mockWorkerEventAfterRouteExecutionAccepted`: true
- `all8GpuModelToolsBlockedByControlledWorkerRoute`: true
- `all8GpuModelToolsEvaluated`: true
- `gpuModelToolsBlockedUntilPrerequisites`: true
- `gpuModelProofRefBridgeBlocksUntilPrivateProof`: true
- `scopedGpuModelRuntimeProofAcceptedTools`: 0
- `privateLocalRuntimeProofResultSupplied`: false
- `strictCallableExecutableBlockedFailedContractCreated`: true
- `capabilityMismatchFailureProbeAccepted`: true
- `gpuRuntimeOnDemandOnly`: true
- `noIdleGpuRuntimeApproved`: true
- `gpuRuntimeShouldStartNow`: false
- `sourceScopedGpuRuntimeStartedOnlyDuringAcceptedProof`: true
- `agentCanSelectForPlanning`: true
- `agentCanExecuteToolsNow`: true
- `agentCanExecuteAnyControlledToolNow`: true
- `agentCanExecute13ControlledToolsNow`: true
- `agentCanExecute13NonGpuControlledToolsNow`: true
- `agentCanExecuteAll21ToolsNow`: false
- `agentCanExecuteAll21ControlledToolsNow`: false
- `agentCanExecuteGpuModelToolsNow`: false
- `currentHostGpuProofPreflightRequested`: false
- `currentHostEligibleForGpuProof`: false
- `routeExecutionApprovedNow`: true
- `routeExecutionPerformedInReadinessRunner`: true
- `controlledWorkerRouteExecutionPerformedInReadinessRunner`: true
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

First target kornia with the container local-dev command on an approved native CUDA host. After kornia returns structured private local output, feed that private harness result into the GPU/model runtime proof-ref bridge, then repeat per GPU/model tool with reviewed model/checkpoint paths where required.
