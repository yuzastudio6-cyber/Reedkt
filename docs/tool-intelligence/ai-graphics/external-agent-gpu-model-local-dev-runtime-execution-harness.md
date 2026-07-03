# AI Graphics External Agent GPU Model Local-Dev Runtime Execution Harness

Decision: `ai_graphics_external_agent_gpu_model_local_dev_runtime_execution_harness_prepared_with_runtime_blocks`

Status: `local_dev_runtime_inputs_required_before_eight_gpu_model_tools_execute`

This harness exercises the real GPU/model controlled adapter for all eight GPU/model tools in explicit `local_dev` mode. The committed record is prerequisite-check only: it records the guarded adapter branch and the exact private local inputs needed before runtime can start. It does not start GPU runtime, load model weights, process media, call providers, create public artifacts, create signed URLs, unlock external beta, or unlock production.

Missing private source/model/checkpoint paths block before Python runtime or Docker GPU attachment. GPU starts only after the scoped tool call supplies the required private inputs and runtime proof.

## Tool rows

| Tool | Capability | Harness mode | Adapter status | Skip reason | Error message | Local runtime executed | Tool execution approved | GPU starts now |
| --- | --- | --- | --- | --- | --- | ---: | ---: | ---: |
| `torch_torchvision` | `model_runtime_foundation` | `local_dev_prerequisite_check_only` | `controlled_gpu_model_adapter_invoked_runtime_skipped` | `foundation_runtime_output_directory_missing` | `none` | false | false | false |
| `transformers` | `model_runtime_foundation` | `local_dev_prerequisite_check_only` | `controlled_gpu_model_adapter_invoked_runtime_skipped` | `foundation_runtime_output_directory_missing` | `none` | false | false | false |
| `sam2` | `subject_segmentation` | `local_dev_prerequisite_check_only` | `controlled_gpu_model_adapter_invoked_runtime_skipped` | `sam2_checkpoint_missing` | `none` | false | false | false |
| `birefnet` | `background_removal` | `local_dev_prerequisite_check_only` | `controlled_gpu_model_adapter_invoked_runtime_skipped` | `birefnet_model_missing` | `none` | false | false | false |
| `real_esrgan` | `upscaling` | `local_dev_prerequisite_check_only` | `controlled_gpu_model_adapter_invoked_runtime_skipped` | `real_esrgan_model_missing` | `none` | false | false | false |
| `kornia` | `tensor_image_ops` | `local_dev_prerequisite_check_only` | `controlled_gpu_model_adapter_invoked_runtime_skipped` | `kornia_source_frame_missing` | `none` | false | false | false |
| `rembg` | `background_removal` | `local_dev_prerequisite_check_only` | `controlled_gpu_model_adapter_invoked_runtime_skipped` | `rembg_model_missing` | `none` | false | false | false |
| `transparent_background` | `background_removal` | `local_dev_prerequisite_check_only` | `controlled_gpu_model_adapter_invoked_runtime_skipped` | `transparent_background_checkpoint_missing` | `none` | false | false | false |

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

## Private runtime attempt command

`npm run --silent ai-graphics:external-agent-gpu-model-local-dev-runtime-execution-harness -- --attempt-local-runtime --tool <toolId> --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run> <per-tool-private-input-flags>`

## Next milestone

Run this harness on an approved native CUDA host with reviewed private model paths and private approved source inputs, then feed accepted per-tool local runtime outputs into the external-agent GPU/model runtime gate.
