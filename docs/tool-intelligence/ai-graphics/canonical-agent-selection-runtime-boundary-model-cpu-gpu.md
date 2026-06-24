# Model CPU/GPU Runtime Boundary

Decision: `ai_graphics_canonical_agent_selection_runtime_boundary_review_passed_with_warnings`

Covers `torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, and `transparent_background`. CPU import, model provenance, model-weight, and GPU/runtime approvals are required before execution.

## Boundary Booleans
- agentCanSelectForPlanning=true
- agentCanExecuteToolsNow=false
- routeExecutionApprovedNow=false
- workerExecutionApprovedNow=false
- toolExecutionApprovedNow=false
- browserWebglCanvasRuntimeApprovedNow=false
- gpuRuntimeApprovedNow=false
- providerRuntimeApprovedNow=false
- publicArtifactApprovedNow=false
- signedUrlApprovedNow=false
- runtimeReadyNow=false
- internalBetaReadyNow=false
- productionReadyNow=false
