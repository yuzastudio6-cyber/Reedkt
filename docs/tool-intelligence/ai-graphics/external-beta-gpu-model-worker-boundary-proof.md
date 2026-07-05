# AI Graphics External Beta GPU/Model Worker Boundary Proof

Decision: `ai_graphics_external_beta_gpu_model_worker_boundary_proof_passed_with_existing_worker_path`

Status: `gpu_model_route_admission_bound_to_existing_runtime_queue_and_mock_worker_dispatch`

This proof binds the eight GPU/model tool route-admission results to the existing AI graphics runtime queue service and production worker dispatcher boundary. It does not create a new GPU worker. It does not perform live queue writes, dispatch live workers, execute tools, load model weights, start GPU runtime, create signed URLs, or create public artifacts.

## Source

- Source route admission packet: `docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-gpu-model-runtime-admission-smoke.json`
- Source decision: `ai_graphics_external_beta_tool_call_route_gpu_model_runtime_admission_smoke_passed`
- Source accepted: `true`
- Existing worker boundary: `ai_graphics_runtime_queue_service_and_production_worker_dispatcher`
- New GPU worker created: `false`

## Tool Boundary Results

| Tool | Runtime target | Queue mock-only | Mock claim | Dispatcher handoff | GPU starts now |
| --- | --- | --- | --- | --- | --- |
| `torch_torchvision` | `native_linux_amd64_nvidia_l4_gpu_worker` | yes | yes | yes | no |
| `transformers` | `native_linux_amd64_nvidia_l4_gpu_worker` | yes | yes | yes | no |
| `sam2` | `native_linux_amd64_nvidia_l4_sam2_runtime` | yes | yes | yes | no |
| `birefnet` | `native_linux_amd64_nvidia_l4_birefnet_runtime` | yes | yes | yes | no |
| `real_esrgan` | `native_linux_amd64_nvidia_l4_real_esrgan_runtime` | yes | yes | yes | no |
| `kornia` | `native_linux_amd64_nvidia_l4_gpu_worker` | yes | yes | yes | no |
| `rembg` | `native_linux_amd64_nvidia_l4_gpu_worker` | yes | yes | yes | no |
| `transparent_background` | `native_linux_amd64_nvidia_l4_gpu_worker` | yes | yes | yes | no |

## Counts

- GPU/model tools covered: `8`
- Source proof-ready tools: `8`
- Existing runtime queue service jobs created in mock mode: `8`
- Mock worker claims returned: `8`
- Mock worker events recorded: `8`
- Existing production worker dispatcher dry-run jobs completed: `8`
- In-memory dispatcher leases created/released: `8` / `8`
- Live Supabase queue writes now: `0`
- Live worker dispatches now: `0`
- Tool executions now: `0`
- GPU runtime should start now tools: `0`

## Booleans

- `gpuModelWorkerBoundaryProofPassed`: `true`
- `all8GpuModelToolsUseExistingRuntimeQueueService`: `true`
- `usesExistingProductionWorkerDispatcher`: `true`
- `newGpuWorkerCreated`: `false`
- `gpuRuntimeOnDemandOnly`: `true`
- `noIdleGpuRuntimeApproved`: `true`
- `agentCanExecuteGpuModelToolsNow`: `false`
- `gpuRuntimeShouldStartNow`: `false`
- `modelWeightsLoaded`: `false`
- `publicArtifactCreated`: `false`
- `signedUrlCreated`: `false`

## Next Milestones

- Promote this mock boundary proof into a non-production live queue-write smoke with approved service-role and private artifact refs.
- Attach live worker claim telemetry and a Cloud Run/GPU worker pool only after external-beta queue authorization is approved.
- Keep GPU runtime on-demand: start GPU only after an accepted live worker/tool-call job claims a GPU/model tool.
- Do not create a new GPU worker unless the existing runtime queue service or production worker dispatcher cannot support private model mounting, GPU lifecycle, rollback, or artifact isolation.
