# AI Graphics External Agent GPU Model Proof-Ref Route Caller

Decision: `ai_graphics_external_agent_gpu_model_proof_ref_route_caller_contract_prepared_with_runtime_blocks`

Status: `external_agent_gpu_model_proof_ref_route_caller_ready_for_eight_queue_admission_tools`

This is the caller contract for the eight GPU/model tools. It prepares the exact private external-agent route envelopes that can enter proof-ref mock queue admission when the required private native GPU runtime proof refs, model-weight manifest refs where needed, and per-tool runtime proof refs are present.

It does not claim GPU/model tool execution is ready. It does not perform live queue writes, worker dispatch, tool execution, model loading, GPU runtime startup, signed URLs, public artifacts, external beta readiness, or production readiness. GPU stays cold until a later accepted live worker/tool-call job starts it on demand.

## GPU/model proof-ref caller rows

| Tool | Capability | Needs model manifest | Expected status | Queue mode | Future GPU start allowed after accepted job | GPU starts now |
| --- | --- | ---: | ---: | --- | ---: | ---: |
| `torch_torchvision` | `model_runtime_foundation` | false | `202` | `mock_only_gpu_model_proof_ref` | true | false |
| `transformers` | `model_runtime_foundation` | false | `202` | `mock_only_gpu_model_proof_ref` | true | false |
| `sam2` | `subject_segmentation` | true | `202` | `mock_only_gpu_model_proof_ref` | true | false |
| `birefnet` | `background_removal` | true | `202` | `mock_only_gpu_model_proof_ref` | true | false |
| `real_esrgan` | `upscaling` | true | `202` | `mock_only_gpu_model_proof_ref` | true | false |
| `kornia` | `tensor_image_ops` | false | `202` | `mock_only_gpu_model_proof_ref` | true | false |
| `rembg` | `background_removal` | true | `202` | `mock_only_gpu_model_proof_ref` | true | false |
| `transparent_background` | `background_removal` | true | `202` | `mock_only_gpu_model_proof_ref` | true | false |

## Counts

- `totalAiGraphicsTools`: 21
- `totalProductFacingCapabilities`: 12
- `gpuModelProofRefRouteCallerToolsNow`: 8
- `modelWeightManifestRequiredTools`: 5
- `nativeGpuRuntimeProofRefRequiredTools`: 8
- `externalBetaPerToolRuntimeProofRefRequiredTools`: 8
- `proofRefQueueAdmissionRequestEnvelopesPrepared`: 8
- `expectedProofRefMockQueueAdmissionStatus202Tools`: 8
- `sourceProofRefMockQueueAdmissionsAcceptedTools`: 8
- `sourceMockWorkerClaimsCreated`: 8
- `controlledDirectRouteCallableToolsNow`: 13
- `combinedExternalAgentRouteReachableToolsWithCurrentContracts`: 21
- `directlyExecutableControlledRouteToolsNow`: 13
- `gpuModelQueueAdmissionOnlyToolsNow`: 8
- `all21ExecutableNowTools`: 0
- `liveQueueWritePerformedTools`: 0
- `workerDispatchPerformedTools`: 0
- `toolExecutionPerformedTools`: 0
- `gpuRuntimeShouldStartNowTools`: 0
- `modelWeightsLoadedTools`: 0
- `publicArtifactCreatedTools`: 0
- `signedUrlCreatedTools`: 0
- `externalBetaReadyNowTools`: 0
- `productionReadyNowTools`: 0

## Booleans

- `externalAgentGpuModelProofRefRouteCallerContractPrepared`: true
- `sourceGpuModelProofRefQueueAdmissionSmokeAccepted`: true
- `sourceControlledRouteCallerAccepted`: true
- `routeSchemaEnvelopeAccepted`: true
- `all21ToolsCoveredByCombinedCallerContracts`: true
- `all8GpuModelProofRefRouteCallerEnvelopesPrepared`: true
- `modelWeightManifestRefsRequiredWhereNeeded`: true
- `nativeGpuRuntimeProofRefsRequiredForAll8`: true
- `externalBetaPerToolRuntimeProofRefsRequiredForAll8`: true
- `agentCanSubmitGpuModelToolCallToQueueAdmissionNow`: true
- `agentCanClaimMockGpuModelWorkerLeaseNow`: true
- `combinedExternalAgentRouteReachableToolsWithCurrentContracts`: true
- `gpuRuntimeOnDemandOnly`: true
- `noIdleGpuRuntimeApproved`: true
- `gpuStartsOnlyForAcceptedExternalBetaToolCall`: true
- `agentCanSelectForPlanning`: true
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

replace mock proof-ref queue admission with live service-role queue enqueue that starts GPU only after an accepted worker job claim, then attach native model runtime proof for each of the eight tools
