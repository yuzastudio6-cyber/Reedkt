# AI Graphics External Agent GPU Model Local-Dev Runtime Execution Harness

Decision: `ai_graphics_external_agent_gpu_model_local_dev_runtime_execution_harness_prepared_with_runtime_blocks`

Status: `local_dev_runtime_inputs_required_before_eight_gpu_model_tools_execute`

This harness exercises the real GPU/model controlled adapter for all eight GPU/model tools in explicit `local_dev` mode. The committed record is prerequisite-check only: it records the guarded adapter branch and the exact private local inputs needed before runtime can start. It does not start GPU runtime, load model weights, process media, call providers, create public artifacts, create signed URLs, unlock external beta, or unlock production.

Missing private source/model/checkpoint paths block before Python runtime or Docker GPU attachment. GPU starts only after the scoped tool call supplies the required private inputs and runtime proof.

## Docker Runtime Preflight

When a scoped Docker runtime is requested, the adapter now starts with a bounded Python/module/CUDA preflight inside the selected proof image before launching the heavier model script. Missing Python modules, unavailable Docker Python runtime, unavailable CUDA, or missing ONNX CUDA provider return structured `blocked_with_reason` diagnostics before model loading.

- `dockerContainerPythonModulePreflightBeforeRuntime`: true
- `dockerContainerCudaPreflightBeforeRuntime`: true
- `dockerContainerBackendRequiresScopedGpuAttachment`: true
- `gpuRuntimeOnDemandOnly`: true

## Foundation CPU Runtime Option

`torch_torchvision` and `transformers` may use explicit CPU foundation runtime proof for bounded package import and tensor checks when `--allow-cpu-foundation-runtime` is supplied. This does not download models, run inference, process media, or start GPU runtime.

- `torch_torchvision`: `npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness -- --attempt-local-runtime --tool torch_torchvision --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run> --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json --allow-cpu-foundation-runtime`
- `transformers`: `npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness -- --attempt-local-runtime --tool transformers --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run> --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json --allow-cpu-foundation-runtime`
- `foundationCpuRuntimeAllowedWhenExplicitlyRequested`: true
- `foundationCpuRuntimeDoesNotStartGpu`: true

## Tool rows

| Tool | Capability | Harness mode | Adapter status | Current blocker | Blocking reason | Remaining private inputs | Error message | Local runtime executed | Tool execution approved | GPU starts now |
| --- | --- | --- | --- | --- | --- | --- | --- | ---: | ---: | ---: |
| `torch_torchvision` | `model_runtime_foundation` | `local_dev_prerequisite_check_only` | `controlled_gpu_model_adapter_invoked_runtime_skipped` | `outputDirectory` | `foundation_runtime_output_directory_missing` | `nativeCudaRuntime` | `none` | false | false | false |
| `transformers` | `model_runtime_foundation` | `local_dev_prerequisite_check_only` | `controlled_gpu_model_adapter_invoked_runtime_skipped` | `outputDirectory` | `foundation_runtime_output_directory_missing` | `nativeCudaRuntime` | `none` | false | false | false |
| `sam2` | `subject_segmentation` | `local_dev_prerequisite_check_only` | `controlled_gpu_model_adapter_invoked_runtime_skipped` | `sam2CheckpointLocalPath` | `sam2_checkpoint_missing` | `outputDirectory, sourceImageLocalPath, modelWeightManifestEvidence, nativeCudaRuntime` | `none` | false | false | false |
| `birefnet` | `background_removal` | `local_dev_prerequisite_check_only` | `controlled_gpu_model_adapter_invoked_runtime_skipped` | `birefnetModelLocalPath` | `birefnet_model_missing` | `outputDirectory, sourceImageLocalPath, modelWeightManifestEvidence, nativeCudaRuntime` | `none` | false | false | false |
| `real_esrgan` | `upscaling` | `local_dev_prerequisite_check_only` | `controlled_gpu_model_adapter_invoked_runtime_skipped` | `realEsrganModelLocalPath` | `real_esrgan_model_missing` | `outputDirectory, sourceImageLocalPath, modelWeightManifestEvidence, nativeCudaRuntime` | `none` | false | false | false |
| `kornia` | `tensor_image_ops` | `local_dev_prerequisite_check_only` | `controlled_gpu_model_adapter_invoked_runtime_skipped` | `sourceImageLocalPath` | `kornia_source_frame_missing` | `outputDirectory, nativeCudaRuntime` | `none` | false | false | false |
| `rembg` | `background_removal` | `local_dev_prerequisite_check_only` | `controlled_gpu_model_adapter_invoked_runtime_skipped` | `rembgModelLocalPath` | `rembg_model_missing` | `outputDirectory, sourceImageLocalPath, modelWeightManifestEvidence, nativeCudaRuntime` | `none` | false | false | false |
| `transparent_background` | `background_removal` | `local_dev_prerequisite_check_only` | `controlled_gpu_model_adapter_invoked_runtime_skipped` | `transparentBackgroundCheckpointLocalPath` | `transparent_background_checkpoint_missing` | `outputDirectory, sourceImageLocalPath, modelWeightManifestEvidence, nativeCudaRuntime` | `none` | false | false | false |

## Counts

- `totalAiGraphicsTools`: 21
- `requestedGpuModelTools`: 8
- `gpuModelToolsCovered`: 8
- `localDevAdapterBranchInvokedTools`: 8
- `localDevPrerequisiteCheckOnlyTools`: 8
- `localRuntimeExecutionPerformedTools`: 0
- `toolExecutionApprovedNowTools`: 0
- `gpuRuntimeApprovedForScopedControlledToolCallTools`: 0
- `gpuRuntimeShouldStartNowTools`: 0
- `privateLocalRuntimeInputsAcceptedBeforeRuntimeTools`: 0
- `publicArtifactCreatedTools`: 0
- `signedUrlCreatedTools`: 0
- `runtimeReadyNowTools`: 0
- `externalBetaReadyNowTools`: 0
- `productionReadyNowTools`: 0

## Booleans

- `externalAgentGpuModelLocalDevRuntimeExecutionHarnessPrepared`: true
- `scopedGpuModelToolSelectionSupported`: true
- `scopedGpuModelToolSelectionActive`: false
- `controlledAdapterSourceAccepted`: true
- `controlledWorkerDispatchProofAccepted`: true
- `nativeGpuRuntimeProofCommandPlanAccepted`: true
- `localDevAdapterBranchInvokedForAll8`: true
- `all8GpuModelToolsCovered`: true
- `exactLocalRuntimePrerequisitesDocumented`: true
- `gpuRuntimeOnDemandOnly`: true
- `noIdleGpuRuntimeApproved`: true
- `gpuStartsOnlyForApprovedWorkerOrToolCall`: true
- `committedRecordSkipSafe`: true
- `privateLocalRuntimeAttemptRequested`: false
- `privateLocalProofResultWriteSupported`: true
- `privateLocalProofResultWrittenNow`: false
- `privateRuntimeInputManifestSupported`: true
- `privateRuntimeInputManifestOutputDirectoryMustStayUnderLocalArtifacts`: true
- `privateRuntimeInputManifestUsedNow`: false
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
- `routeExecutionPerformed`: false
- `providerRuntimePerformed`: false
- `browserWebglCanvasRuntimePerformed`: false
- `modelWeightsDownloaded`: false
- `mediaProcessingPerformed`: false
- `supabaseMutationPerformed`: false
- `gcsUploadPerformed`: false
- `publicArtifactCreated`: false
- `signedUrlCreated`: false

## Runtime proof output contract

- `runtimeProofOutputValidatedBeforeCompleted`: true
- `runtimeProofOutputMustDeclareOkTrue`: true
- `runtimeProofOutputMustMatchExpectedToolId`: true
- `runtimeProofOutputMustProveCudaOrCudaExecutionProvider`: true
- `runtimeProofOutputCanSkipCudaOnlyForExplicitKorniaCpuTensorRuntime`: true
- `runtimeProofOutputCanSkipCudaOnlyForExplicitFoundationCpuRuntime`: true
- `runtimeProofOutputMustProveNoModelDownload`: true
- `runtimeProofOutputMustProveNoProviderRuntime`: true
- `runtimeProofOutputMustProveNoPublicArtifact`: true
- `runtimeProofOutputMustProveNoSignedUrl`: true

## Private runtime attempt command

`npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness -- --attempt-local-runtime --tool <toolId> --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run> --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json <per-tool-private-input-flags>`

## Private runtime input manifest command

`npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness -- --attempt-local-runtime --tool <toolId> --runtime-input-manifest .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/runtime-inputs.json --result-out .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json`

## Next milestone

Run this harness on an approved native CUDA host with reviewed private model paths and private approved source inputs, then feed accepted per-tool local runtime outputs into the external-agent GPU/model runtime gate.
