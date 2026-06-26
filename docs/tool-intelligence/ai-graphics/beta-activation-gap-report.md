# AI Graphics Beta Activation Gap Report

Decision: `ai_graphics_beta_activation_gap_report_prepared_with_remaining_blocks`

This report is the bridge between "properly installed for the intended
ReeditPro surface" and "safe to call in beta." It confirms the install/mapping
state for all 21 AI graphics tools, then lists the exact activation gaps that
still block runtime execution.

## Current Result

- Tools covered: 21
- Properly installed or represented for planned surface: 21
- Production registry mappings: 21
- Duplicate production mappings: 0
- GPU-heavy tools targeting GPU runtime: 8
- Heavy tools incorrectly targeting CPU: 0
- Beta activation ready now: 0
- Blocked tools: 21

## GPU-Only Heavy Tools

These tools must stay on native NVIDIA L4 GPU targets and must not silently
fall back to CPU runtime:

- `torch_torchvision`
- `transformers`
- `sam2`
- `birefnet`
- `real_esrgan`
- `kornia`
- `rembg`
- `transparent_background`

## Shared Missing Gates

- approved plan snapshot
- credit reservation
- artifact boundary approval
- Tool Route execution approval
- Worker execution approval
- worker queue/transport readiness
- worker idempotency key readiness
- internal beta owner approval

## Runtime-Specific Missing Gates

- Native GPU proof results for the four GPU runtime profiles.
- Reviewed private model-weight manifests for `sam2`, `birefnet`, `real_esrgan`, `rembg`, and `transparent_background`.
- Browser/canvas/WebGL sandbox proof for chart, animation, canvas, and WebGL tools.
- Owner-approved migration remains for any profile still marked `planning_only`, `future`, or `evaluation_only`; the proven 13 JavaScript graphics tools now have executable worker-surface profile mappings, while runtime execution remains blocked by the shared beta gates.
- License/model-weight policy approval where profiles still require review.

## Activation Sequence

1. Keep package/package-lock and GPU Docker install surfaces unchanged unless an explicit dependency milestone approves changes.
2. Review private model-weight manifests for `sam2`, `birefnet`, `real_esrgan`, `rembg`, and `transparent_background`.
3. Run native linux/amd64 NVIDIA L4 proof for `gpu_worker_ai_graphics`, `sam2`, `birefnet`, and `real_esrgan`, then validate with `ai-graphics:gpu-runtime-proof-result:validate`.
4. Finish remaining profile, license, and model-weight policy reviews for the GPU/model group; JavaScript graphics profile promotion is recorded but still gated by Tool Route, Worker, artifact, snapshot, credit, and beta owner evidence.
5. Run browser/canvas/WebGL sandbox proof for chart, animation, canvas, and WebGL scene tools before runtime execution.
6. Pass approved plan snapshot, credit reservation, artifact boundary, Tool Route, Worker, and beta owner approval gates before any beta tool execution.

## No Runtime Unlock

- `agentCanSelectForPlanning=true`
- `agentCanExecuteToolsNow=false`
- `routeExecutionApprovedNow=false`
- `workerExecutionApprovedNow=false`
- `toolExecutionApprovedNow=false`
- `gpuRuntimeApprovedNow=false`
- `runtimeReadyNow=false`
- `internalBetaReadyNow=false`
- `productionReadyNow=false`
