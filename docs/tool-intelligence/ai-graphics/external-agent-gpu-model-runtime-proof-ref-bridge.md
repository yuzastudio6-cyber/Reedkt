# AI Graphics External Agent GPU Model Runtime Proof-Ref Bridge

Decision: `ai_graphics_external_agent_gpu_model_runtime_proof_ref_bridge_prepared_with_runtime_blocks`

Status: `gpu_model_runtime_proof_ref_bridge_blocked_until_private_local_runtime_proof_is_supplied`

This bridge connects real scoped local-dev GPU/model runtime proof evidence to the external-agent proof-ref route caller. The committed record intentionally accepts zero GPU/model proofs because no private local runtime proof result is supplied.

It does not start GPU runtime, write live queues, dispatch workers, execute tools, load model weights, create public artifacts, create signed URLs, unlock external beta, or unlock production. GPU runtime can start only in the upstream scoped local-dev harness call that supplies private inputs for one requested tool.

Private output proof is accepted only when the JSON matches the exact per-tool contract for that tool. The model/checkpoint-backed tools require tool-shaped evidence such as SAM2 mask sequences, BiRefNet mask/cutout output, Real-ESRGAN enhanced output, rembg cutout output, or transparent-background checkpoint output; generic CUDA-looking JSON is not enough. Real-ESRGAN and rembg also accept explicit CPU model proof when the local proof row has `allowCpuModelRuntime=true`, the private model/input/checksum evidence is present, and no GPU attachment is requested.

## Bridge rows

| Tool | Capability | Needs model manifest | Local proof supplied | Local proof accepted | Bridge status | Route submission ready | GPU starts now |
| --- | --- | ---: | ---: | ---: | --- | ---: | ---: |
| `torch_torchvision` | `model_runtime_foundation` | false | false | false | `blocked_missing_private_local_runtime_proof_result` | false | false |
| `transformers` | `model_runtime_foundation` | false | false | false | `blocked_missing_private_local_runtime_proof_result` | false | false |
| `sam2` | `subject_segmentation` | true | false | false | `blocked_missing_private_local_runtime_proof_result` | false | false |
| `birefnet` | `background_removal` | true | false | false | `blocked_missing_private_local_runtime_proof_result` | false | false |
| `real_esrgan` | `upscaling` | true | false | false | `blocked_missing_private_local_runtime_proof_result` | false | false |
| `kornia` | `tensor_image_ops` | false | false | false | `blocked_missing_private_local_runtime_proof_result` | false | false |
| `rembg` | `background_removal` | true | false | false | `blocked_missing_private_local_runtime_proof_result` | false | false |
| `transparent_background` | `background_removal` | true | false | false | `blocked_missing_private_local_runtime_proof_result` | false | false |

## Counts

- `totalAiGraphicsTools`: 21
- `gpuModelToolsCovered`: 8
- `sourceLocalDevHarnessToolsCovered`: 8
- `sourceProofRefRouteCallerToolsCovered`: 8
- `privateLocalRuntimeProofResultSuppliedTools`: 0
- `acceptedPrivateLocalRuntimeProofTools`: 0
- `routeSubmissionReadyWithAcceptedPrivateProofTools`: 0
- `blockedMissingPrivateLocalRuntimeProofResultTools`: 8
- `blockedPrivateLocalRuntimeProofNotExecutedTools`: 0
- `blockedPrivateLocalRuntimeOutputMissingTools`: 0
- `gpuRuntimeShouldStartNowTools`: 0
- `liveQueueWritePerformedTools`: 0
- `workerDispatchPerformedTools`: 0
- `toolExecutionPerformedByBridgeTools`: 0
- `modelWeightsLoadedByBridgeTools`: 0
- `publicArtifactCreatedByBridgeTools`: 0
- `signedUrlCreatedByBridgeTools`: 0
- `externalBetaReadyNowTools`: 0
- `productionReadyNowTools`: 0

## Booleans

- `externalAgentGpuModelRuntimeProofRefBridgePrepared`: true
- `sourceLocalDevRuntimeExecutionHarnessAccepted`: true
- `sourceProofRefRouteCallerAccepted`: true
- `all8GpuModelToolsCoveredByBridge`: true
- `privateLocalRuntimeProofRequiredBeforeProofRefsAccepted`: true
- `exactPerToolPrivateProofEvidenceShapeEnforced`: true
- `routeSubmissionAllowedOnlyWithAcceptedPrivateProof`: false
- `committedRecordAcceptsZeroGpuModelRuntimeProofs`: true
- `gpuRuntimeOnDemandOnly`: true
- `noIdleGpuRuntimeApproved`: true
- `gpuStartsOnlyForScopedAcceptedToolCall`: true
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

## Private proof bridge command

`npm run --silent ai-graphics:external-agent-gpu-model-runtime-proof-ref-bridge -- --local-runtime-proof-result .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run>/harness-result.json`

## Next implementation step

Run the local-dev runtime harness on an approved CUDA host for a scoped GPU/model tool with private inputs, then feed that private harness result into this bridge before submitting proof refs to the external-agent route.
