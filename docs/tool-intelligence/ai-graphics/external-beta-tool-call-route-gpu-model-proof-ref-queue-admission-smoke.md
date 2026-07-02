# AI Graphics External Beta GPU Model Proof-Ref Queue Admission Smoke

Decision: `ai_graphics_external_beta_tool_call_route_gpu_model_proof_ref_queue_admission_smoke_passed`

Status: `gpu_model_proof_ref_route_mock_queue_admission_and_claim_passed_for_eight_tools`

This smoke proves the canonical external-beta tool-call route can accept the eight GPU/model tools into mock queue admission when required private proof refs are present. It also claims each mock job through the existing runtime queue service. It does not execute workers, tools, GPU runtime, model loading, live Supabase writes, signed URLs, or public artifacts.

## GPU/model queue admission and claim

| Tool | Capability | HTTP status | Queue mode | Mock claim created | GPU starts now |
| --- | --- | --- | --- | --- | --- |
| `torch_torchvision` | `model_runtime_foundation` | `202` | `mock_only_gpu_model_proof_ref` | `true` | `false` |
| `transformers` | `model_runtime_foundation` | `202` | `mock_only_gpu_model_proof_ref` | `true` | `false` |
| `sam2` | `subject_segmentation` | `202` | `mock_only_gpu_model_proof_ref` | `true` | `false` |
| `birefnet` | `background_removal` | `202` | `mock_only_gpu_model_proof_ref` | `true` | `false` |
| `real_esrgan` | `upscaling` | `202` | `mock_only_gpu_model_proof_ref` | `true` | `false` |
| `kornia` | `tensor_image_ops` | `202` | `mock_only_gpu_model_proof_ref` | `true` | `false` |
| `rembg` | `background_removal` | `202` | `mock_only_gpu_model_proof_ref` | `true` | `false` |
| `transparent_background` | `background_removal` | `202` | `mock_only_gpu_model_proof_ref` | `true` | `false` |

## Counts

- `totalAiGraphicsTools`: 21
- `gpuModelToolsCovered`: 8
- `gpuModelProofRefMockQueueAdmissionAcceptedTools`: 8
- `gpuModelRuntimeAdmissionReadyWithProvidedEvidenceTools`: 8
- `nativeGpuRuntimeProofRefAcceptedTools`: 8
- `modelWeightManifestRefAcceptedTools`: 5
- `modelWeightManifestRequiredTools`: 5
- `mockQueueInsertedJobs`: 8
- `mockWorkerClaimsCreated`: 8
- `gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools`: 8
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

- `externalBetaToolCallRouteGpuModelProofRefQueueAdmissionSmokePassed`: true
- `all8GpuModelToolsCovered`: true
- `all8GpuModelProofRefMockQueueAdmissionsAccepted`: true
- `all8GpuModelMockJobsClaimed`: true
- `mockOnlyRuntimeModeEnforced`: true
- `privateWorkerClaimLeaseOnly`: true
- `routeQueueAdmissionRequiresProofRefs`: true
- `gpuRuntimeOnDemandOnly`: true
- `noIdleGpuRuntimeApproved`: true
- `gpuStartsOnlyForApprovedWorkerOrToolCall`: true
- `agentCanSelectForPlanning`: true
- `agentCanSubmitGpuModelToolCallToQueueAdmissionNow`: true
- `agentCanClaimMockGpuModelWorkerLeaseNow`: true
- `agentCanExecuteGpuModelToolsNow`: false
- `agentCanExecuteAll21ToolsNow`: false
- `agentCanExecuteToolsNow`: false
- `routeExecutionPerformed`: true
- `mockWorkerClaimPerformed`: true
- `backendQueueSubmissionPerformed`: false
- `liveQueueWritePerformed`: false
- `liveWorkerClaimPerformed`: false
- `workerExecutionPerformed`: false
- `workerEnqueuePerformed`: false
- `workerDispatchPerformed`: false
- `toolExecutionPerformed`: false
- `providerRuntimePerformed`: false
- `browserWebglCanvasRuntimePerformed`: false
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
