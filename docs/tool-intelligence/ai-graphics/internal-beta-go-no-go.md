# AI Graphics Internal Beta Go/No-Go Contract

Decision: `ai_graphics_internal_beta_go_no_go_contract_prepared_with_runtime_blocks`

This contract is the next gate after the AI graphics beta/production readiness
rollup. It converts the all-21 technical evidence bundle into an explicit
internal beta go/no-go question without unlocking runtime.

## Current Status

- Status: `awaiting_internal_beta_go_no_go_approval`
- Source rollup: `ai_graphics_beta_production_readiness_rollup_prepared_with_runtime_blocks`
- AI graphics tools covered: 21
- Product-facing capabilities covered: 12
- Go/no-go candidate tools with provided technical evidence: 21
- Go/no-go candidate capabilities with provided technical evidence: 12
- Internal beta go/no-go approved tools with provided evidence: 0
- Internal beta ready now: 0
- External beta ready now: 0
- Production ready now: 0

## Covered Tools

- `torch_torchvision`
- `transformers`
- `sam2`
- `birefnet`
- `real_esrgan`
- `kornia`
- `rembg`
- `transparent_background`
- `d3`
- `echarts`
- `vega_lite`
- `vega`
- `satori`
- `svgdotjs_svg_js`
- `viz_js`
- `lottie_web`
- `animejs`
- `three_js`
- `pixi_js`
- `konva`
- `babylonjs`

## Covered Capabilities

- `chart_overlay`
- `data_visualization`
- `svg_graphics`
- `diagram_graphics`
- `animation_overlay`
- `canvas_scene`
- `webgl_3d_scene`
- `background_removal`
- `subject_segmentation`
- `upscaling`
- `tensor_image_ops`
- `model_runtime_foundation`

## Required Approval Record

- Required: true
- Approver role: `AI_TOOLS_CREATIVE_GRAPHICS_OWNER`
- Go/no-go reference required: true
- Approves runtime now: false

The approval record can accept the current all-21 technical evidence for a
future internal beta runtime lane, but it still does not enqueue workers, run
Tool Routes, call providers/models, run browser/canvas/WebGL, run GPU/model
runtime, download or load model weights, process media, create signed URLs, or
create public artifacts.

## Allowed Go/No-Go Actions

- accept all-21 install, ranking, GPU targeting, and cross-owner coordination evidence
- accept all-21 production worker gate checks with provided evidence and zero hard failures
- record owner go/no-go approval metadata for the future internal beta runtime lane
- return explicit runtime, Tool Route, Worker, artifact, external beta, and production blockers

## Still Blocked

- agent/tool execution
- Tool Route execution
- Worker queue enqueue
- Worker execution
- production worker dispatch
- production worker route execution
- provider/model execution
- browser/WebGL/canvas runtime execution
- GPU/model runtime execution
- model weight download or load
- media processing
- Supabase/GCS mutation
- signed URL creation
- public artifact creation
- external beta unlock
- production unlock

## Next Milestones

1. Create a narrow internal beta go/no-go owner packet with `AI_TOOLS_CREATIVE_GRAPHICS_OWNER` approval metadata.
2. Create a later runtime-enqueue approval lane that consumes the go/no-go record and names exact allowed internal beta scope.
3. Run real native GPU proof and model-weight manifest validation with private evidence before any runtime enqueue approval.
4. Add external beta and production launch approvals only after internal beta runtime evidence exists.

## No Runtime Unlock

- `agentCanSelectForPlanning=true`
- `agentCanExecuteToolsNow=false`
- `routeExecutionApprovedNow=false`
- `workerExecutionApprovedNow=false`
- `workerQueueApprovedNow=false`
- `productionWorkerJobEnqueueApprovedNow=false`
- `productionWorkerDispatchApprovedNow=false`
- `productionWorkerRouteExecutionApprovedNow=false`
- `toolExecutionApprovedNow=false`
- `runtimeReadyNow=false`
- `internalBetaReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`
