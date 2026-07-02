# AI Graphics External Agent GPU Model Runtime Queue Service Bridge

Decision: `ai_graphics_external_agent_gpu_model_runtime_queue_service_bridge_prepared_with_runtime_blocks`

Status: `external_agent_gpu_model_runtime_queue_service_bridge_ready_for_eight_tools`

This bridge binds the eight external-agent GPU/model proof-ref request envelopes to the existing AI graphics runtime queue service. It creates mock-only runtime queue jobs and mock worker leases for the eight GPU/model tools, using the canonical production tool id, worker type, runtime target, private artifact manifest, approved snapshot, credit reservation, and private proof refs from the source caller packet.

It does not perform live queue writes, route execution, worker dispatch, tool execution, model loading, GPU runtime startup, signed URLs, public artifacts, external beta readiness, or production readiness. GPU remains cold until a later accepted live worker job claim starts it on demand.

## Queue bridge rows

| Tool | Capability | Production tool | Worker | Runtime target | Mock queue service | Mock worker lease | GPU starts now | Tool execution |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| `torch_torchvision` | `model_runtime_foundation` | `torch_torchvision` | `gpu_ai_worker` | `native_linux_amd64_nvidia_l4_gpu_worker` | true | true | false | false |
| `transformers` | `model_runtime_foundation` | `transformers` | `gpu_ai_worker` | `native_linux_amd64_nvidia_l4_gpu_worker` | true | true | false | false |
| `sam2` | `subject_segmentation` | `sam2` | `gpu_ai_worker` | `native_linux_amd64_nvidia_l4_sam2_runtime` | true | true | false | false |
| `birefnet` | `background_removal` | `birefnet` | `gpu_ai_worker` | `native_linux_amd64_nvidia_l4_birefnet_runtime` | true | true | false | false |
| `real_esrgan` | `upscaling` | `real_esrgan` | `gpu_ai_worker` | `native_linux_amd64_nvidia_l4_real_esrgan_runtime` | true | true | false | false |
| `kornia` | `tensor_image_ops` | `kornia` | `gpu_ai_worker` | `native_linux_amd64_nvidia_l4_gpu_worker` | true | true | false | false |
| `rembg` | `background_removal` | `rembg` | `gpu_ai_worker` | `native_linux_amd64_nvidia_l4_gpu_worker` | true | true | false | false |
| `transparent_background` | `background_removal` | `transparent_background` | `gpu_ai_worker` | `native_linux_amd64_nvidia_l4_gpu_worker` | true | true | false | false |

## Counts

- `totalAiGraphicsTools`: 21
- `totalProductFacingCapabilities`: 12
- `gpuModelRuntimeQueueServiceBridgeToolsNow`: 8
- `sourceGpuModelProofRefRouteCallerTools`: 8
- `sourceRuntimeQueueServicePayloadsReadyWithProvidedEvidence`: 21
- `mockRuntimeQueueServiceBatchesCreated`: 8
- `mockRuntimeQueueServiceJobsCreated`: 8
- `mockWorkerClaimsCreated`: 8
- `toolsValidatedThroughCanonicalReadiness`: 8
- `gpuModelRuntimeTargetedTools`: 8
- `liveQueueWritePerformedTools`: 0
- `workerDispatchPerformedTools`: 0
- `workerExecutionPerformedTools`: 0
- `toolExecutionPerformedTools`: 0
- `gpuRuntimeShouldStartNowTools`: 0
- `modelWeightsDownloadedTools`: 0
- `modelWeightsLoadedTools`: 0
- `modelInferencePerformedTools`: 0
- `publicArtifactCreatedTools`: 0
- `signedUrlCreatedTools`: 0
- `externalBetaReadyNowTools`: 0
- `productionReadyNowTools`: 0

## Booleans

- `externalAgentGpuModelRuntimeQueueServiceBridgePrepared`: true
- `sourceGpuModelProofRefRouteCallerAccepted`: true
- `sourceRuntimeQueueServiceBridgeAccepted`: true
- `all8GpuModelProofRefRouteCallerRowsQueuedThroughRuntimeService`: true
- `all8MockRuntimeQueueJobsCreated`: true
- `all8MockWorkerClaimsCreated`: true
- `all8ToolsValidatedThroughCanonicalReadiness`: true
- `usesExistingAiGraphicsRuntimeQueueService`: true
- `usesExistingRuntimeQueueServiceValidation`: true
- `gpuRuntimeOnDemandOnly`: true
- `noIdleGpuRuntimeApproved`: true
- `gpuStartsOnlyForAcceptedExternalBetaToolCall`: true
- `agentCanSelectForPlanning`: true
- `agentCanSubmitGpuModelToolCallToRuntimeQueueAdmissionNow`: true
- `agentCanClaimMockGpuModelWorkerLeaseNow`: true
- `agentCanExecuteGpuModelToolsNow`: false
- `agentCanExecuteAll21ToolsNow`: false
- `agentCanExecuteToolsNow`: false
- `routeExecutionApprovedNow`: false
- `routeExecutionPerformedInThisLane`: false
- `backendQueueSubmissionApprovedNow`: false
- `backendQueueSubmissionPerformed`: false
- `liveQueueWriteApprovedNow`: false
- `liveQueueWritePerformed`: false
- `workerExecutionApprovedNow`: false
- `workerExecutionPerformed`: false
- `workerDispatchApprovedNow`: false
- `workerDispatchPerformed`: false
- `toolExecutionApprovedNow`: false
- `toolExecutionPerformed`: false
- `providerRuntimeApprovedNow`: false
- `providerRuntimePerformed`: false
- `browserWebglCanvasRuntimeApprovedNow`: false
- `browserWebglCanvasRuntimePerformed`: false
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

## Next implementation step

turn the eight mock runtime queue jobs into an explicitly authorized non-production service-role queue write, then attach real worker claim and native model-runtime proof while preserving GPU startup only after an accepted job claim
