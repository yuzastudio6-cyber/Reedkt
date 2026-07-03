# AI Graphics External Beta GPU Model Service-Role Queue Smoke Proof

Decision: `ai_graphics_external_beta_gpu_model_service_role_queue_smoke_proof_prepared_with_runtime_blocks`

Status: `gpu_model_service_role_queue_smoke_proof_prepared_validator_only`

This packet adds a saved-result validator for the eight GPU/model tools. It accepts only a future non-production service-role queue-smoke result that proves eight queue writes, eight worker claims, cleanup to zero persisted smoke rows, no worker dispatch, no tool execution, no GPU runtime start, and no model-weight load.

## Tools

- `torch_torchvision`
- `transformers`
- `sam2`
- `birefnet`
- `real_esrgan`
- `kornia`
- `rembg`
- `transparent_background`

## Validator

- Script: `ai-graphics:external-beta-gpu-model-service-role-queue-smoke-proof`
- Diagnostic: `ai-graphics:external-beta-gpu-model-service-role-queue-smoke-proof:diagnostics`
- Source harness: `ai-graphics:external-beta-gpu-model-service-role-queue-smoke`
- Accepted result decision: `ai_graphics_external_beta_gpu_model_service_role_queue_smoke_passed_with_cleanup`
- Accepted result status: `gpu_model_service_role_queue_smoke_passed_with_cleanup_no_worker_dispatch`

## Acceptance

- Tools submitted: `8`
- Job IDs returned: `8`
- Worker claims returned: `8`
- GPU runtime start allowed only for accepted external-beta jobs: `8`
- Worker dispatches accepted: `0`
- Tool executions accepted: `0`
- GPU runtime should start now: `false`
- Model weights loaded now: `false`
- Fixture rows persisted after cleanup: `0`

## Boundary

The validator is saved-result only. It does not perform a live queue write, worker claim, worker dispatch, tool execution, provider/model call, browser/WebGL/canvas runtime, GPU runtime start, model download/load, Supabase/GCS mutation, signed URL creation, public artifact creation, external beta unlock, or production unlock.
