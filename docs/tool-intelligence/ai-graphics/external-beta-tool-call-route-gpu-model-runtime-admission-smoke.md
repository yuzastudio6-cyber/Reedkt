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

## Native-GPU Proof Ref Admission Results

These rows prove the canonical route now preserves accepted private native GPU proof refs for the three native-GPU-only tools. The route can mark those requests as ready for future worker enqueue, but the current lane still returns `409`, does not enqueue a live worker, does not dispatch, and does not start GPU runtime.

| Tool | HTTP status | Admission decision | Evidence state | Worker enqueue still blocked | GPU start allowed after accepted job | GPU starts now |
| --- | --- | --- | --- | --- | --- | --- |
| `torch_torchvision` | `409` | `runtime_job_admission_ready_for_worker_enqueue` | `proof_refs_accepted_pending_live_worker_enqueue` | `true` | `true` | `false` |
| `transformers` | `409` | `runtime_job_admission_ready_for_worker_enqueue` | `proof_refs_accepted_pending_live_worker_enqueue` | `true` | `true` | `false` |
| `kornia` | `409` | `runtime_job_admission_ready_for_worker_enqueue` | `proof_refs_accepted_pending_live_worker_enqueue` | `true` | `true` | `false` |

## Model-Weight Proof Ref Admission Results

These rows prove the canonical route now preserves both accepted private model-weight manifest refs and accepted private native GPU proof refs for the five model-weight tools. The route can mark those requests as ready for future worker enqueue, but the current lane still returns `409`, does not enqueue a live worker, does not dispatch, does not load model weights, and does not start GPU runtime.

| Tool | HTTP status | Admission decision | Evidence state | Model manifest ref accepted | Native GPU proof ref accepted | Worker enqueue still blocked | GPU starts now |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `sam2` | `409` | `runtime_job_admission_ready_for_worker_enqueue` | `proof_refs_accepted_pending_live_worker_enqueue` | `true` | `true` | `true` | `false` |
| `birefnet` | `409` | `runtime_job_admission_ready_for_worker_enqueue` | `proof_refs_accepted_pending_live_worker_enqueue` | `true` | `true` | `true` | `false` |
| `real_esrgan` | `409` | `runtime_job_admission_ready_for_worker_enqueue` | `proof_refs_accepted_pending_live_worker_enqueue` | `true` | `true` | `true` | `false` |
| `rembg` | `409` | `runtime_job_admission_ready_for_worker_enqueue` | `proof_refs_accepted_pending_live_worker_enqueue` | `true` | `true` | `true` | `false` |
| `transparent_background` | `409` | `runtime_job_admission_ready_for_worker_enqueue` | `proof_refs_accepted_pending_live_worker_enqueue` | `true` | `true` | `true` | `false` |

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
- `nativeGpuProofOnlyAdmissionReadyWithProvidedRefsTools`: 3
- `modelWeightAdmissionReadyWithProvidedRefsTools`: 5
- `allGpuModelAdmissionReadyWithProvidedRefsTools`: 8
- `proofReadyGpuRuntimeStartAllowedForAcceptedExternalBetaJobTools`: 3
- `proofReadyModelWeightGpuRuntimeStartAllowedForAcceptedExternalBetaJobTools`: 5
- `allProofReadyGpuRuntimeStartAllowedForAcceptedExternalBetaJobTools`: 8
- `proofReadyWorkerEnqueueStillBlockedTools`: 3
- `proofReadyModelWeightWorkerEnqueueStillBlockedTools`: 5
- `allProofReadyWorkerEnqueueStillBlockedTools`: 8
- `proofReadyGpuRuntimeShouldStartNowTools`: 0
- `proofReadyModelWeightGpuRuntimeShouldStartNowTools`: 0
- `allProofReadyGpuRuntimeShouldStartNowTools`: 0
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
- `nativeGpuProofOnlyToolsAcceptPrivateProofRefsForAdmission`: true
- `modelWeightToolsAcceptPrivateManifestAndGpuProofRefsForAdmission`: true
- `allGpuModelToolsAcceptRequiredPrivateProofRefsForAdmission`: true
- `proofReadyGpuToolsStillFailClosedBeforeWorkerEnqueue`: true
- `proofReadyModelWeightToolsStillFailClosedBeforeWorkerEnqueue`: true
- `allProofReadyGpuModelToolsStillFailClosedBeforeWorkerEnqueue`: true
- `proofReadyGpuToolsDoNotStartGpuRuntime`: true
- `proofReadyModelWeightToolsDoNotLoadWeightsOrStartGpu`: true
- `allProofReadyGpuModelToolsDoNotStartGpuRuntimeOrLoadWeights`: true
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
