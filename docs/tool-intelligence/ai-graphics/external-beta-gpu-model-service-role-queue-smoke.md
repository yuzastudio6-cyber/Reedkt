# AI Graphics External Beta GPU Model Service-Role Queue Smoke

Decision: `ai_graphics_external_beta_gpu_model_service_role_queue_smoke_harness_prepared_with_runtime_blocks`

Status: `gpu_model_service_role_queue_smoke_prepared_not_executed`

This packet prepares an executable non-production service-role queue-write and worker-claim smoke for the eight GPU/model AI graphics tools. It reuses the existing AI graphics runtime queue service and existing production worker dispatcher boundary. It does not create a new GPU worker and does not start GPU runtime.

## Tools

| Tool | Runtime target | Capability | Source production-worker handler | Specific handler proven | Queue smoke ready | GPU starts now |
| --- | --- | --- | --- | --- | --- | --- |
| `torch_torchvision` | `native_linux_amd64_nvidia_l4_gpu_worker` | `model_runtime_foundation` | `gpu_ai_worker_ai_graphics_model_runtime_foundation` | `true` | `true` | `false` |
| `transformers` | `native_linux_amd64_nvidia_l4_gpu_worker` | `model_runtime_foundation` | `gpu_ai_worker_ai_graphics_model_runtime_foundation` | `true` | `true` | `false` |
| `sam2` | `native_linux_amd64_nvidia_l4_sam2_runtime` | `subject_segmentation` | `gpu_ai_worker_mask_composition_execution` | `true` | `true` | `false` |
| `birefnet` | `native_linux_amd64_nvidia_l4_birefnet_runtime` | `background_removal` | `gpu_ai_worker_mask_composition_execution` | `true` | `true` | `false` |
| `real_esrgan` | `native_linux_amd64_nvidia_l4_real_esrgan_runtime` | `upscaling` | `gpu_ai_worker_enhancement_slowmotion_execution` | `true` | `true` | `false` |
| `kornia` | `native_linux_amd64_nvidia_l4_gpu_worker` | `tensor_image_ops` | `gpu_ai_worker_mask_composition_execution` | `true` | `true` | `false` |
| `rembg` | `native_linux_amd64_nvidia_l4_gpu_worker` | `background_removal` | `gpu_ai_worker_mask_composition_execution` | `true` | `true` | `false` |
| `transparent_background` | `native_linux_amd64_nvidia_l4_gpu_worker` | `background_removal` | `gpu_ai_worker_mask_composition_execution` | `true` | `true` | `false` |

## Counts

- GPU/model tools covered: `8`
- Source production-worker payloads prepared: `8`
- Source production-worker specific-handler routes accepted: `8`
- Expected live queue rows before cleanup: `8`
- Expected worker claim rows before cleanup: `8`
- Expected persisted rows after cleanup: `0`
- Live queue writes now: `0`
- Live worker claims now: `0`
- GPU runtime should start now tools: `0`

## Gates

- `usesExistingAiGraphicsRuntimeQueueService`: `true`
- `sourceExternalAgentGpuModelRuntimeQueueServiceBridgeAccepted`: `true`
- `all8GpuModelProductionWorkerRoutesHitSpecificHandlersWithProvidedEvidence`: `true`
- `newGpuWorkerCreated`: `false`
- `gpuRuntimeOnDemandOnly`: `true`
- `agentCanExecuteGpuModelToolsNow`: `false`
- `agentCanExecuteAll21ToolsNow`: `false`
- `liveServiceRoleQueueSmokeExecutedNow`: `false`
- `liveQueueWriteApprovedNow`: `false`
- `gpuRuntimeShouldStartNow`: `false`
- `externalBetaReadyNow`: `false`
- `productionReadyNow`: `false`

## Required execution environment

- `REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_BETA_GPU_MODEL_QUEUE_SMOKE=true`
- `REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_GPU_MODEL_QUEUE_SMOKE_ENV=non_production`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `E2E_RUNTIME_MODE=local`
- `WORKER_RUNTIME_MODE=mock`

## No-Scope

No dependency install, package-lock mutation, live service-role queue smoke execution in this packet, worker dispatch, tool execution, provider/model call, browser/WebGL/canvas runtime, GPU/model runtime startup, model download/load, media processing, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is performed by the prepared packet.
