# AI Graphics Internal Beta Runtime-Enqueue Approval Contract

Decision: `ai_graphics_internal_beta_runtime_enqueue_approval_contract_prepared_with_runtime_blocks`

This contract consumes the internal beta go/no-go owner approval and defines the exact all-21 AI graphics worker enqueue scope for a future internal beta runtime lane. It names the tool-call surface that a future queue authorization must use, while still blocking live queue enqueue and runtime execution.

The evaluator can consume either low-level source evidence flags or a source
go/no-go owner-approval packet via
`--internal-beta-go-no-go-owner-approval-packet`. A source packet must already
report `internal_beta_go_no_go_owner_approved_runtime_still_blocked`; this
runtime-enqueue gate still requires a separate
`--internal-beta-runtime-enqueue-approval-granted` record and
`--internal-beta-runtime-enqueue-approval-ref` before the enqueue scope is
approved with runtime still blocked.

## Current Status

- Status: `internal_beta_runtime_enqueue_scope_approved_runtime_still_blocked`
- Source gate: `ai_graphics_internal_beta_go_no_go_owner_approved_with_runtime_blocks`
- AI graphics tools covered: 21
- Product-facing capabilities covered: 12
- Runtime enqueue scope candidates with provided evidence: 21
- Runtime enqueue scopes approved with provided evidence: 21
- GPU runtime targeted tools: 8
- Heavy tools incorrectly targeting CPU: 0
- GPU runtime activation: on-demand only
- Idle or always-on GPU runtime approved: false
- GPU starts only for approved worker/tool call: true
- CPU fallback for heavy/model tools: false
- Live worker queue approved now: 0
- Live worker execution approved now: 0
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

## Runtime Enqueue Approval Record

- Accepted: true
- Approver role: `AI_TOOLS_CREATIVE_GRAPHICS_OWNER`
- Approval ref: `AI_GRAPHICS_INTERNAL_BETA_RUNTIME_ENQUEUE_APPROVAL_PACKET`
- Approves live queue now: false
- Approves runtime now: false

## GPU Runtime Activation Policy

- `onDemandOnly=true`
- `noIdleGpuRuntimeApproved=true`
- `startsOnlyForApprovedWorkerOrToolCall=true`
- `cpuFallbackAllowedForHeavyTools=false`

The eight GPU/model tools carry this policy in the runtime-enqueue scope. GPU
startup is allowed only after a later approved worker or tool-call handoff for
that specific job. This packet does not approve a standing GPU service.

## Tool Scope

- `torch_torchvision`: runtime lane `gpu_model_worker`, on-demand GPU activation policy, enqueue scope approved with provided evidence, live queue false, live execution false.
- `transformers`: runtime lane `gpu_model_worker`, on-demand GPU activation policy, enqueue scope approved with provided evidence, live queue false, live execution false.
- `sam2`: runtime lane `gpu_model_worker`, on-demand GPU activation policy, enqueue scope approved with provided evidence, live queue false, live execution false.
- `birefnet`: runtime lane `gpu_model_worker`, on-demand GPU activation policy, enqueue scope approved with provided evidence, live queue false, live execution false.
- `real_esrgan`: runtime lane `gpu_model_worker`, on-demand GPU activation policy, enqueue scope approved with provided evidence, live queue false, live execution false.
- `kornia`: runtime lane `gpu_model_worker`, on-demand GPU activation policy, enqueue scope approved with provided evidence, live queue false, live execution false.
- `rembg`: runtime lane `gpu_model_worker`, on-demand GPU activation policy, enqueue scope approved with provided evidence, live queue false, live execution false.
- `transparent_background`: runtime lane `gpu_model_worker`, on-demand GPU activation policy, enqueue scope approved with provided evidence, live queue false, live execution false.
- `d3`: runtime lane `node_worker_cpu_static_or_browser_chart_worker`, enqueue scope approved with provided evidence, live queue false, live execution false.
- `echarts`: runtime lane `browser_chart_worker`, enqueue scope approved with provided evidence, live queue false, live execution false.
- `vega_lite`: runtime lane `node_worker_cpu_static_chart_spec`, enqueue scope approved with provided evidence, live queue false, live execution false.
- `vega`: runtime lane `node_worker_cpu_static_chart_spec`, enqueue scope approved with provided evidence, live queue false, live execution false.
- `satori`: runtime lane `node_worker_svg_font_runtime`, enqueue scope approved with provided evidence, live queue false, live execution false.
- `svgdotjs_svg_js`: runtime lane `node_worker_svg_dom_adapter`, enqueue scope approved with provided evidence, live queue false, live execution false.
- `viz_js`: runtime lane `node_worker_dot_graph_runtime`, enqueue scope approved with provided evidence, live queue false, live execution false.
- `lottie_web`: runtime lane `browser_animation_worker`, enqueue scope approved with provided evidence, live queue false, live execution false.
- `animejs`: runtime lane `browser_animation_worker`, enqueue scope approved with provided evidence, live queue false, live execution false.
- `three_js`: runtime lane `browser_webgl_worker`, enqueue scope approved with provided evidence, live queue false, live execution false.
- `pixi_js`: runtime lane `browser_canvas_webgl_worker`, enqueue scope approved with provided evidence, live queue false, live execution false.
- `konva`: runtime lane `browser_canvas_worker`, enqueue scope approved with provided evidence, live queue false, live execution false.
- `babylonjs`: runtime lane `browser_webgl_worker`, enqueue scope approved with provided evidence, live queue false, live execution false.

## Allowed Scope Actions

- name productionToolId, workerType, runtimeTarget, and capability ids for each AI graphics tool
- confirm internal beta enqueue scope candidates for all 21 tools with provided evidence
- confirm eight heavy/model tools target GPU worker runtime lanes
- bind GPU runtime activation to on-demand approved worker or tool calls only
- record a future runtime-enqueue approval reference without enqueueing work
- return live queue, execution, artifact, external beta, and production blockers

## Still Blocked

- live worker queue enqueue
- idle or always-on GPU runtime
- worker execution
- tool execution
- Tool Route execution
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
- internal beta runtime unlock
- external beta unlock
- production unlock

## Next Milestones

1. Create a live internal beta worker queue authorization that supplies approved snapshot, credit reservation, private artifact manifest, and owner runtime approval references.
2. Require reviewed private model-weight manifests and native NVIDIA runtime proof before any GPU/model tool can be queued.
3. Carry the on-demand GPU activation policy into every future queue and worker job candidate before live enqueue can be considered.
4. Require browser/canvas/WebGL sandbox proof before browser-rendered graphics tools can be queued.
5. Keep external beta and production launch gates separate until internal beta runtime evidence exists.

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
