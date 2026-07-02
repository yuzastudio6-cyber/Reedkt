# AI Graphics External Beta Canonical Tool-Call GPU Model Runtime Admission Smoke

Decision: `ai_graphics_external_beta_tool_call_route_gpu_model_runtime_admission_smoke_passed`

Status: `canonical_tool_call_route_gpu_model_runtime_admission_fail_closed_for_eight_tools`

This smoke proves the canonical external-beta tool-call route now handles the eight GPU/model tools explicitly. Each request remains fail-closed because reviewed private model-weight evidence and native NVIDIA L4 runtime proof are not accepted yet. GPU runtime remains off and can start only after a future accepted live worker enqueue for a real approved job.

## GPU/Model Admission Results

| Tool | Capability | HTTP status | Runtime target | Readiness blocker | Next external-agent action | GPU starts now |
| --- | --- | --- | --- | --- | --- | --- |
| `torch_torchvision` | `model_runtime_foundation` | `409` | `native_linux_amd64_nvidia_l4_gpu_worker` | `blocked_pending_native_gpu_runtime_proof` | `provide_native_gpu_runtime_result` | `false` |
| `transformers` | `model_runtime_foundation` | `409` | `native_linux_amd64_nvidia_l4_gpu_worker` | `blocked_pending_native_gpu_runtime_proof` | `provide_native_gpu_runtime_result` | `false` |
| `sam2` | `subject_segmentation` | `409` | `native_linux_amd64_nvidia_l4_sam2_runtime` | `blocked_pending_private_model_weight_evidence_and_native_gpu_runtime_proof` | `provide_reviewed_private_model_weight_evidence_then_native_gpu_runtime_result` | `false` |
| `birefnet` | `background_removal` | `409` | `native_linux_amd64_nvidia_l4_birefnet_runtime` | `blocked_pending_private_model_weight_evidence_and_native_gpu_runtime_proof` | `provide_reviewed_private_model_weight_evidence_then_native_gpu_runtime_result` | `false` |
| `real_esrgan` | `upscaling` | `409` | `native_linux_amd64_nvidia_l4_real_esrgan_runtime` | `blocked_pending_private_model_weight_evidence_and_native_gpu_runtime_proof` | `provide_reviewed_private_model_weight_evidence_then_native_gpu_runtime_result` | `false` |
| `kornia` | `tensor_image_ops` | `409` | `native_linux_amd64_nvidia_l4_gpu_worker` | `blocked_pending_native_gpu_runtime_proof` | `provide_native_gpu_runtime_result` | `false` |
| `rembg` | `background_removal` | `409` | `native_linux_amd64_nvidia_l4_gpu_worker` | `blocked_pending_private_model_weight_evidence_and_native_gpu_runtime_proof` | `provide_reviewed_private_model_weight_evidence_then_native_gpu_runtime_result` | `false` |
| `transparent_background` | `background_removal` | `409` | `native_linux_amd64_nvidia_l4_gpu_worker` | `blocked_pending_private_model_weight_evidence_and_native_gpu_runtime_proof` | `provide_reviewed_private_model_weight_evidence_then_native_gpu_runtime_result` | `false` |

## Counts

- `totalAiGraphicsTools`: 21
- `controlledCanonicalRouteExecutedTools`: 13
- `gpuModelRuntimeAdmissionEvaluatedTools`: 8
- `gpuModelRuntimeAdmissionBlockedTools`: 8
- `gpuModelUnblockPlanExposedTools`: 8
- `modelWeightManifestRequiredTools`: 5
- `privateEvidenceAndNativeGpuProofRequiredTools`: 5
- `nativeGpuProofOnlyRequiredTools`: 3
- `nativeGpuRuntimeProofRequiredTools`: 8
- `gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools`: 0
- `gpuRuntimeShouldStartNowTools`: 0
- `workerDispatchPerformedTools`: 0
- `toolExecutionPerformedTools`: 0
- `modelWeightsLoadedTools`: 0
- `publicArtifactCreatedTools`: 0
- `signedUrlCreatedTools`: 0

## Booleans

- `canonicalToolCallRouteGpuModelRuntimeAdmissionSmokePassed`: true
- `canonicalToolCallRouteGpuModelRuntimeAdmissionEvaluated`: true
- `eightGpuModelToolsEvaluatedByCanonicalRouteNow`: true
- `eightGpuModelToolsRemainFailClosed`: true
- `allGpuModelToolsExposeActionableUnblockPlan`: true
- `fiveModelWeightToolsExposePrivateEvidenceAndNativeGpuBlocker`: true
- `threeFoundationGpuToolsExposeNativeGpuOnlyBlocker`: true
- `noGpuModelToolReportsAcceptedEvidenceNow`: true
- `allGpuModelToolsReportNativeGpuProofMissing`: true
- `allModelWeightToolsReportManifestMissing`: true
- `gpuRuntimeOnDemandOnly`: true
- `noIdleGpuRuntimeApproved`: true
- `gpuStartsOnlyForApprovedWorkerOrToolCall`: true
- `agentCanSelectForPlanning`: true
- `agentCanExecuteControlledCpuStaticAndBrowserRuntimeToolsNow`: true
- `agentCanExecuteAll21ToolsNow`: false
- `agentCanExecuteGpuModelToolsNow`: false
- `routeExecutionPerformed`: true
- `workerExecutionApprovedNow`: false
- `workerDispatchPerformed`: false
- `toolExecutionApprovedNow`: false
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
- `externalBetaReadyNow`: false
- `productionReadyNow`: false
- `dependencyInstallPerformed`: false
- `packageLockMutationPerformed`: false

## Boundary

No model weights are downloaded or loaded, no inference is performed, no Worker dispatch happens, no provider/model runtime runs, no Supabase/GCS mutation happens, and no signed URL or public artifact is created. CPU/static and browser-runtime controlled route execution remain the only canonical-route executable tool groups at 13 of 21 tools.
