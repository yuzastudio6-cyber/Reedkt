# AI Graphics External Agent Route-To-Queue Blocked Admission

Decision: `ai_graphics_external_agent_route_to_queue_blocked_admission_prepared_with_runtime_blocks`

Status: `mounted_route_to_queue_blocked_admission_ready_runtime_still_blocked`

This packet connects two already accepted external-agent readiness layers without approving execution:

- `docs/tool-intelligence/ai-graphics/external-agent-mounted-blocked-route-smoke.json`
- `docs/tool-intelligence/ai-graphics/external-beta-route-to-queue-authorization-bridge.json`

The mounted route returns structured `409 TOOL_NOT_READY` for all 21 per-tool requests and all 12 per-capability requests. This packet maps each of the 21 per-tool blocked route responses to the matching route-to-queue authorization candidate and confirms the queue envelope remains `prepared_not_submitted`.

## Counts

- `totalAiGraphicsTools`: 21
- `totalProductFacingCapabilities`: 12
- `mountedBlockedRouteSmokeCases`: 33
- `flagEnabledToolNotReadyResponses`: 33
- `routeToQueueAuthorizationCandidates`: 21
- `routeToQueueBlockedAdmissionMappedTools`: 21
- `queuePreparedNotSubmittedTools`: 21
- `gpuRuntimeTargetedTools`: 8
- `gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools`: 8
- `gpuRuntimeShouldStartNowTools`: 0
- `routeExecutionApprovedNowTools`: 0
- `routeToQueueAuthorizationApprovedNowTools`: 0
- `backendQueueSubmissionApprovedNowTools`: 0
- `liveQueueWriteApprovedNowTools`: 0
- `workerEnqueueApprovedNowTools`: 0
- `workerDispatchPerformedTools`: 0
- `toolExecutionPerformedTools`: 0
- `externalAgentExecutableNowTools`: 0
- `externalBetaReadyNowTools`: 0
- `productionReadyNowTools`: 0

## Tool Coverage

| Tool | Capability | Route result | Queue status | Runtime target | Worker | GPU target |
| --- | --- | --- | --- | --- | --- | --- |
| `torch_torchvision` | `model_runtime_foundation` | `409 TOOL_NOT_READY` | `prepared_not_submitted` | `native_linux_amd64_nvidia_l4_gpu_worker` | `gpu_ai_worker` | yes |
| `transformers` | `model_runtime_foundation` | `409 TOOL_NOT_READY` | `prepared_not_submitted` | `native_linux_amd64_nvidia_l4_gpu_worker` | `gpu_ai_worker` | yes |
| `sam2` | `subject_segmentation` | `409 TOOL_NOT_READY` | `prepared_not_submitted` | `native_linux_amd64_nvidia_l4_sam2_runtime` | `gpu_ai_worker` | yes |
| `birefnet` | `background_removal` | `409 TOOL_NOT_READY` | `prepared_not_submitted` | `native_linux_amd64_nvidia_l4_birefnet_runtime` | `gpu_ai_worker` | yes |
| `real_esrgan` | `upscaling` | `409 TOOL_NOT_READY` | `prepared_not_submitted` | `native_linux_amd64_nvidia_l4_real_esrgan_runtime` | `gpu_ai_worker` | yes |
| `kornia` | `tensor_image_ops` | `409 TOOL_NOT_READY` | `prepared_not_submitted` | `native_linux_amd64_nvidia_l4_gpu_worker` | `gpu_ai_worker` | yes |
| `rembg` | `background_removal` | `409 TOOL_NOT_READY` | `prepared_not_submitted` | `native_linux_amd64_nvidia_l4_gpu_worker` | `gpu_ai_worker` | yes |
| `transparent_background` | `background_removal` | `409 TOOL_NOT_READY` | `prepared_not_submitted` | `native_linux_amd64_nvidia_l4_gpu_worker` | `gpu_ai_worker` | yes |
| `d3` | `chart_overlay` | `409 TOOL_NOT_READY` | `prepared_not_submitted` | `node_cpu_static` | `render_worker` | no |
| `echarts` | `chart_overlay` | `409 TOOL_NOT_READY` | `prepared_not_submitted` | `browser_chart_runtime_later` | `render_worker` | no |
| `vega_lite` | `chart_overlay` | `409 TOOL_NOT_READY` | `prepared_not_submitted` | `node_cpu_static` | `cpu_analysis_worker` | no |
| `vega` | `chart_overlay` | `409 TOOL_NOT_READY` | `prepared_not_submitted` | `node_cpu_static` | `cpu_analysis_worker` | no |
| `satori` | `svg_graphics` | `409 TOOL_NOT_READY` | `prepared_not_submitted` | `node_cpu_static` | `render_worker` | no |
| `svgdotjs_svg_js` | `svg_graphics` | `409 TOOL_NOT_READY` | `prepared_not_submitted` | `node_cpu_static` | `render_worker` | no |
| `viz_js` | `diagram_graphics` | `409 TOOL_NOT_READY` | `prepared_not_submitted` | `node_cpu_static` | `render_worker` | no |
| `lottie_web` | `animation_overlay` | `409 TOOL_NOT_READY` | `prepared_not_submitted` | `browser_animation_runtime_later` | `render_worker` | no |
| `animejs` | `animation_overlay` | `409 TOOL_NOT_READY` | `prepared_not_submitted` | `browser_animation_runtime_later` | `render_worker` | no |
| `three_js` | `webgl_3d_scene` | `409 TOOL_NOT_READY` | `prepared_not_submitted` | `browser_canvas_webgl_runtime_later` | `render_worker` | no |
| `pixi_js` | `canvas_scene` | `409 TOOL_NOT_READY` | `prepared_not_submitted` | `browser_canvas_webgl_runtime_later` | `render_worker` | no |
| `konva` | `canvas_scene` | `409 TOOL_NOT_READY` | `prepared_not_submitted` | `browser_canvas_webgl_runtime_later` | `render_worker` | no |
| `babylonjs` | `webgl_3d_scene` | `409 TOOL_NOT_READY` | `prepared_not_submitted` | `browser_canvas_webgl_runtime_later` | `render_worker` | no |

## Runtime Boundary

Allowed now:

- read mounted blocked-route smoke evidence
- read route-to-queue authorization candidate evidence
- map each route response to a prepared queue candidate
- keep agent planning/study metadata selection available

Blocked now:

- agent/tool execution
- route execution approval
- route-to-queue authorization approval
- backend queue submission
- live queue write
- worker enqueue or dispatch
- provider/model calls
- browser/WebGL/canvas runtime
- GPU/model runtime startup
- model weight download or load
- media processing
- Supabase/GCS mutation
- signed URLs
- public artifacts
- external beta runtime unlock
- production unlock

GPU remains on-demand only for a later accepted worker/tool job. `gpuRuntimeShouldStartNow=false`.

## Validation

Run:

1. `npm run --silent ai-graphics:external-agent-route-to-queue-blocked-admission`
2. `npm run --silent ai-graphics:external-agent-route-to-queue-blocked-admission:diagnostics`
3. `npm run --silent ai-graphics:external-agent-mounted-blocked-route-smoke:diagnostics`
4. `npm run --silent ai-graphics:external-beta-route-to-queue-authorization-bridge:diagnostics`
