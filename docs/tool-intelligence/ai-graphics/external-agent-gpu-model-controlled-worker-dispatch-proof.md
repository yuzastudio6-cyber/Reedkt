# AI Graphics External Agent GPU Model Controlled Worker Dispatch Proof

Decision: `ai_graphics_external_agent_gpu_model_controlled_worker_dispatch_proof_passed_with_runtime_blocks`

Status: `gpu_model_controlled_worker_dispatch_invokes_adapter_for_eight_tools_runtime_skipped`

This proof dispatches all eight GPU/model AI graphics tools through the production worker dispatcher into the guarded GPU/model controlled adapter route. It proves the worker/router/adapter handoff is wired. It does not start GPU runtime, load model weights, execute model inference, write public artifacts, create signed URLs, unlock external beta, or unlock production.

## Worker dispatch rows

| Tool | Handler | Adapter status | Adapter invoked | Local GPU/model runtime executed | Tool execution approved | GPU starts now |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| `torch_torchvision` | `gpu_ai_worker_ai_graphics_gpu_model_controlled_adapter` | `controlled_gpu_model_adapter_invoked_runtime_skipped` | true | false | false | false |
| `transformers` | `gpu_ai_worker_ai_graphics_gpu_model_controlled_adapter` | `controlled_gpu_model_adapter_invoked_runtime_skipped` | true | false | false | false |
| `sam2` | `gpu_ai_worker_ai_graphics_gpu_model_controlled_adapter` | `controlled_gpu_model_adapter_invoked_runtime_skipped` | true | false | false | false |
| `birefnet` | `gpu_ai_worker_ai_graphics_gpu_model_controlled_adapter` | `controlled_gpu_model_adapter_invoked_runtime_skipped` | true | false | false | false |
| `real_esrgan` | `gpu_ai_worker_ai_graphics_gpu_model_controlled_adapter` | `controlled_gpu_model_adapter_invoked_runtime_skipped` | true | false | false | false |
| `kornia` | `gpu_ai_worker_ai_graphics_gpu_model_controlled_adapter` | `controlled_gpu_model_adapter_invoked_runtime_skipped` | true | false | false | false |
| `rembg` | `gpu_ai_worker_ai_graphics_gpu_model_controlled_adapter` | `controlled_gpu_model_adapter_invoked_runtime_skipped` | true | false | false | false |
| `transparent_background` | `gpu_ai_worker_ai_graphics_gpu_model_controlled_adapter` | `controlled_gpu_model_adapter_invoked_runtime_skipped` | true | false | false | false |

## Counts

- `totalAiGraphicsTools`: 21
- `gpuModelToolsCovered`: 8
- `gpuModelControlledWorkerDispatchAttemptedTools`: 8
- `gpuModelControlledWorkerDispatchCompletedTools`: 8
- `dispatcherHardGateBlocks`: 0
- `adapterRouteOutputProducedTools`: 8
- `controlledAdapterInvokedTools`: 8
- `adapterRuntimeSkippedTools`: 8
- `inMemoryWorkerLeasesCreatedTools`: 8
- `inMemoryWorkerLeasesReleasedTools`: 8
- `toolRunResultsCreatedTools`: 0
- `artifactRecordsCreatedTools`: 0
- `qualityGateResultsCreatedTools`: 0
- `localGpuModelRuntimeExecutionPerformedTools`: 0
- `toolExecutionApprovedNowTools`: 0
- `gpuRuntimeApprovedForScopedControlledToolCallTools`: 0
- `gpuRuntimeShouldStartNowTools`: 0
- `publicArtifactCreatedTools`: 0
- `signedUrlCreatedTools`: 0
- `externalBetaReadyNowTools`: 0
- `productionReadyNowTools`: 0

## Booleans

- `externalAgentGpuModelControlledWorkerDispatchProofPassed`: true
- `sourceGpuModelProofRefRouteCallerAccepted`: true
- `productionWorkerDispatcherBoundaryExercised`: true
- `gpuModelControlledAdapterRouteSelectedForAll8`: true
- `controlledAdapterInvokedForAll8`: true
- `adapterRuntimeSkippedByDefaultForAll8`: true
- `all8GpuModelToolsCovered`: true
- `inMemoryWorkerLeasesCreatedAndReleased`: true
- `gpuRuntimeOnDemandOnly`: true
- `noIdleGpuRuntimeApproved`: true
- `gpuStartsOnlyForApprovedWorkerOrToolCall`: true
- `agentCanSelectForPlanning`: true
- `agentCanExecuteGpuModelToolsNow`: false
- `agentCanExecuteAll21ToolsNow`: false
- `agentCanExecuteToolsNow`: false
- `routeExecutionApprovedNow`: false
- `backendQueueSubmissionApprovedNow`: false
- `liveQueueWriteApprovedNow`: false
- `workerExecutionApprovedNow`: false
- `workerEnqueueApprovedNow`: false
- `workerDispatchApprovedNow`: false
- `toolExecutionApprovedNow`: false
- `providerRuntimeApprovedNow`: false
- `browserWebglCanvasRuntimeApprovedNow`: false
- `gpuRuntimeApprovedNow`: false
- `gpuRuntimeShouldStartNow`: false
- `runtimeReadyNow`: false
- `externalBetaReadyNow`: false
- `productionReadyNow`: false
- `dependencyInstallPerformed`: false
- `packageLockMutationPerformed`: false
- `backendQueueSubmissionPerformed`: false
- `liveQueueWritePerformed`: false
- `workerEnqueuePerformed`: false
- `workerDispatchPerformed`: false
- `toolExecutionPerformed`: false
- `routeExecutionPerformed`: false
- `providerRuntimePerformed`: false
- `browserWebglCanvasRuntimePerformed`: false
- `gpuRuntimePerformed`: false
- `modelWeightsDownloaded`: false
- `modelWeightsLoaded`: false
- `modelInferencePerformed`: false
- `mediaProcessingPerformed`: false
- `supabaseMutationPerformed`: false
- `gcsUploadPerformed`: false
- `publicArtifactCreated`: false
- `signedUrlCreated`: false

## Next milestone

bind accepted native GPU/model proof refs to non-production worker enqueue and then run local-dev GPU/model adapter execution only on an approved GPU host with private model manifests
