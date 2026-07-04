# AI Graphics External Agent GPU Model Private Proof Sequence

Decision: `ai_graphics_external_agent_gpu_model_private_proof_sequence_prepared_with_runtime_blocks`

Status: `gpu_model_private_proof_sequence_ready_kornia_first_blocked_until_scoped_private_cuda_proof`

This runner is the one-command local-only path for a scoped GPU/model proof: it calls the real local-dev controlled adapter harness, validates the resulting private proof through the SHA-checked proof-ref bridge, then recomputes all-21 external-agent readiness.

## Requested Tool

- Tool: `kornia`
- Fastest unlock candidate: `kornia`
- Local runtime attempted: `false`
- Local runtime executed for requested tool: `false`
- Accepted private proof: `false`
- Host preflight requested: `false`
- Host eligible for native GPU proof: `false`

## Kornia First Command

`npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool kornia --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-kornia> --source-image <private-approved-frame.png> --detect-host --require-host-eligible --require-accepted-proof`

## Per-Tool Container Private Proof Sequence Commands

- `torch_torchvision`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool torch_torchvision --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-torch_torchvision> --detect-host --require-host-eligible --require-accepted-proof`
- `transformers`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool transformers --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-transformers> --detect-host --require-host-eligible --require-accepted-proof`
- `sam2`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool sam2 --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-sam2> --source-image <private-approved-frame.png> --sam2-checkpoint <private-sam2-checkpoint.pt> --detect-host --require-host-eligible --require-accepted-proof`
- `birefnet`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool birefnet --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-birefnet> --source-image <private-approved-frame.png> --birefnet-model <private-birefnet-model> --detect-host --require-host-eligible --require-accepted-proof`
- `real_esrgan`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool real_esrgan --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-real_esrgan> --source-image <private-approved-frame.png> --real-esrgan-model <private-real-esrgan-model.pth> --detect-host --require-host-eligible --require-accepted-proof`
- `kornia`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool kornia --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-kornia> --source-image <private-approved-frame.png> --detect-host --require-host-eligible --require-accepted-proof`
- `rembg`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool rembg --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-rembg> --source-image <private-approved-frame.png> --rembg-model <private-rembg-model.onnx> --detect-host --require-host-eligible --require-accepted-proof`
- `transparent_background`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --runtime-backend docker_container --runtime-container-image reeditpro/ai-graphics-gpu-worker:proof-local --runtime-container-platform linux/amd64 --tool transparent_background --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-transparent_background> --source-image <private-approved-frame.png> --transparent-background-checkpoint <private-transparent-background-checkpoint.pth> --detect-host --require-host-eligible --require-accepted-proof`

## Per-Tool Host Python Private Proof Sequence Commands

- `torch_torchvision`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --tool torch_torchvision --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-torch_torchvision> --detect-host --require-host-eligible --require-accepted-proof`
- `transformers`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --tool transformers --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-transformers> --detect-host --require-host-eligible --require-accepted-proof`
- `sam2`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --tool sam2 --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-sam2> --source-image <private-approved-frame.png> --sam2-checkpoint <private-sam2-checkpoint.pt> --detect-host --require-host-eligible --require-accepted-proof`
- `birefnet`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --tool birefnet --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-birefnet> --source-image <private-approved-frame.png> --birefnet-model <private-birefnet-model> --detect-host --require-host-eligible --require-accepted-proof`
- `real_esrgan`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --tool real_esrgan --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-real_esrgan> --source-image <private-approved-frame.png> --real-esrgan-model <private-real-esrgan-model.pth> --detect-host --require-host-eligible --require-accepted-proof`
- `kornia`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --tool kornia --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-kornia> --source-image <private-approved-frame.png> --detect-host --require-host-eligible --require-accepted-proof`
- `rembg`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --tool rembg --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-rembg> --source-image <private-approved-frame.png> --rembg-model <private-rembg-model.onnx> --detect-host --require-host-eligible --require-accepted-proof`
- `transparent_background`: `npm run --silent ai-graphics:external-agent-gpu-model-private-proof-sequence -- --attempt-local-runtime --tool transparent_background --output-dir .local-artifacts/ai-graphics/gpu-model-local-dev-runtime/<private-run-transparent_background> --source-image <private-approved-frame.png> --transparent-background-checkpoint <private-transparent-background-checkpoint.pth> --detect-host --require-host-eligible --require-accepted-proof`

## Requested Tool Result

- Harness adapter status: `controlled_gpu_model_adapter_invoked_runtime_skipped`
- Harness execution state: `blocked_with_reason`
- Harness skip reason: `kornia_source_frame_missing`
- Harness output JSON SHA-256: `null`
- Bridge status: `blocked_missing_private_local_runtime_proof_result`
- Bridge SHA-256 accepted: `false`
- Readiness state: `blocked_with_reason`
- Readiness blocking prerequisite: `approved native CUDA host; outputDirectory; sourceImageLocalPath; nativeCudaRuntime; reviewed private proof refs; adapter skip reason: kornia_source_frame_missing`

## Counts

- `requestedGpuModelTools`: 1
- `localRuntimeExecutionPerformedTools`: 0
- `toolExecutionApprovedNowTools`: 0
- `acceptedPrivateProofTools`: 0
- `routeSubmissionReadyWithAcceptedPrivateProofTools`: 0
- `readinessAgentExecutableTools`: 13
- `readinessGpuToolsWithValidRuntimeProof`: 0
- `readinessBlockedWithReasonTools`: 8
- `gpuRuntimeShouldStartNowTools`: 0
- `publicArtifactCreatedTools`: 0
- `signedUrlCreatedTools`: 0
- `currentHostGpuProofBlockers`: 0

## Current Host Preflight

- Requested: `false`
- Eligible: `false`
- Blockers: `none`

## Safety Boundary

- `scopedToolOnly`: true
- `oneToolPerPrivateProofSequence`: true
- `defaultTool`: kornia
- `allGpuModelToolsHaveExactPrivateProofSequenceCommand`: true
- `allGpuModelToolsHaveExactContainerPrivateProofSequenceCommand`: true
- `allGpuModelToolsHaveExactHostPrivateProofSequenceCommand`: true
- `defaultToolReason`: Kornia requires CUDA plus one private approved frame and no private model/checkpoint file, so it is the fastest honest GPU/model unlock candidate.
- `explicitRuntimeAttemptRequired`: true
- `privateInputsRequired`: true
- `privateProofResultMustStayUnderLocalArtifacts`: true
- `proofBridgeRequiresOutputJsonSha256Match`: true
- `noIdleGpuRuntimeApproved`: true
- `gpuMayStartOnlyDuringScopedLocalRuntimeAttempt`: false
- `noCpuFallbackForGpuModelTools`: true
- `noModelDownload`: true
- `noProviderRuntime`: true
- `noPublicArtifacts`: true
- `noSignedUrls`: true
- `noExternalBetaUnlock`: true
- `noProductionUnlock`: true
- `hostEligibilityGateSupported`: true
- `requireHostEligibleFlagSupported`: true
- `requireAcceptedProofFlagSupported`: true
- `perToolPrivateProofSequenceCommandsPrepared`: true
- `perToolContainerPrivateProofSequenceCommandsPrepared`: true
- `perToolHostPrivateProofSequenceCommandsPrepared`: true

## Booleans

- `externalAgentGpuModelPrivateProofSequencePrepared`: true
- `korniaFirstUnlockPathPrepared`: true
- `scopedToolOnly`: true
- `localRuntimeAttemptRequested`: false
- `localRuntimeExecutedForRequestedTool`: false
- `proofBridgeExecuted`: true
- `readinessRecomputed`: true
- `acceptedPrivateProofForRequestedTool`: false
- `hostPreflightRequested`: false
- `hostEligibleForNativeGpuProof`: false
- `requireHostEligible`: false
- `requireAcceptedProof`: false
- `agentCanExecute13NonGpuControlledToolsNow`: true
- `agentCanExecuteGpuModelToolsNow`: false
- `agentCanExecuteAll21ToolsNow`: false
- `gpuRuntimeOnDemandOnly`: true
- `noIdleGpuRuntimeApproved`: true
- `gpuRuntimeShouldStartNow`: false
- `gpuRuntimeStartedOnlyDuringScopedAttempt`: true
- `dependencyInstallPerformed`: false
- `packageLockMutationPerformed`: false
- `providerRuntimePerformed`: false
- `publicArtifactCreated`: false
- `signedUrlCreated`: false
- `runtimeReadyNow`: false
- `externalBetaReadyNow`: false
- `productionReadyNow`: false

## Next Action

Run the Kornia-first private proof sequence on an approved native Linux/amd64 NVIDIA CUDA host with the canonical proof image and one private approved source frame.
