# AI Graphics GPU Runtime Proof Result Packet

Decision: `ai_graphics_gpu_runtime_proof_result_packet_prepared_with_no_runtime_results`

This packet adds the server-only ingestion contract for native NVIDIA GPU proof
results produced by `docker/prod/ai-graphics-gpu-runtime-readiness.py`.

It does not run Docker, touch GPU hardware, download model weights, load
checkpoints, process media, call providers, execute Tool Routes or Workers,
create artifacts, or unlock beta/production.

## Scope

- Total AI graphics tools: 21
- GPU runtime targeted tools: 8
- Private model-weight manifest tools: 5
- Required native proof profiles: 4
- Runtime proof results currently committed: 0
- Runtime proof results accepted for owner review: 0

## GPU Runtime Targeted Tools

- `torch_torchvision`: `native_linux_amd64_nvidia_l4_gpu_worker`
- `transformers`: `native_linux_amd64_nvidia_l4_gpu_worker`
- `sam2`: `native_linux_amd64_nvidia_l4_sam2_runtime`
- `birefnet`: `native_linux_amd64_nvidia_l4_birefnet_runtime`
- `real_esrgan`: `native_linux_amd64_nvidia_l4_real_esrgan_runtime`
- `kornia`: `native_linux_amd64_nvidia_l4_gpu_worker`
- `rembg`: `native_linux_amd64_nvidia_l4_gpu_worker`
- `transparent_background`: `native_linux_amd64_nvidia_l4_gpu_worker`

The target map is exact. GPU runtime is on-demand only for a future approved
worker/tool-call handoff. Proof/runtime containers must be ephemeral
`docker run --rm --gpus all` jobs, no idle GPU service is approved, and CPU
fallback is blocked for heavy model paths.

## Required Profiles

- `gpu_worker_ai_graphics`
- `sam2`
- `birefnet`
- `real_esrgan`

## Acceptance Rules

Each result must come from the approved native GPU readiness probe and must
include:

- `status: passed`
- `proofMetadata.probeName=reeditpro_ai_graphics_gpu_runtime_readiness`
- `proofMetadata.probeVersion=2026-06-26.native-gpu-proof-v1`
- `proofMetadata.runtimePlatform=linux`
- `proofMetadata.runtimeMachine=x86_64` or `amd64`
- `proofMetadata.nativeGpuRuntimeProof=true`
- `proofMetadata` side-effect fields false
- no duplicate result records for the same required profile
- exact profile ID
- `nvidiaSmi.available=true`
- `cuda.available=true`
- `cuda.deviceCount >= 1`
- `cuda.capability >= 8.9`
- `cuda.tinyTensorProbePassed=true`
- all profile-required imports
- required model manifest checks with `validated_not_loaded`
- native probe input manifests require reviewed private artifact namespaces only: `private://`, `reeditpro-private://`, or `reeditpro-private-artifact-ref-`
- `privateArtifactRefStatus=present_private_ref_not_logged`
- no raw `privateArtifactRef`, `private://`, `gs://`, HTTP(S), signed URL, or public artifact refs
- all runtime side-effect fields false

If all six profile results pass, the aggregate status becomes
`ready_for_owner_review_not_beta_ready`. That still does not approve agent tool
execution, Tool Route execution, Worker execution, GPU runtime, beta, or
production.

## Current State

Current public packet state is `missing_native_gpu_runtime_proof_results`.
Operators must first prepare reviewed private model-weight manifests, run the
native GPU proof commands on approved NVIDIA infrastructure, then submit the
redacted result JSON files to the validator.

## Interfaces

- Server module: `server/tool-registry/ai-graphics-gpu-runtime-proof-result.ts`
- CLI: `server/cli/ai-graphics-gpu-runtime-proof-result.ts`
- Validate script: `ai-graphics:gpu-runtime-proof-result:validate`
- Diagnostic: `ai-graphics:gpu-runtime-proof-result:diagnostics`

## Runtime State

- `agentCanSelectForPlanning=true`
- `agentCanExecuteToolsNow=false`
- `routeExecutionApprovedNow=false`
- `workerExecutionApprovedNow=false`
- `toolExecutionApprovedNow=false`
- `providerRuntimeApprovedNow=false`
- `browserWebglCanvasRuntimeApprovedNow=false`
- `gpuRuntimeApprovedNow=false`
- `modelWeightsDownloaded=false`
- `modelWeightsLoaded=false`
- `modelInferencePerformed=false`
- `mediaProcessingPerformed=false`
- `runtimeReadyNow=false`
- `internalBetaReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`
- `dependencyInstallPerformed=false`
- `packageLockMutationPerformed=false`
- `publicArtifactCreated=false`
- `signedUrlCreated=false`
