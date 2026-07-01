# AI Graphics External Agent CPU Static Private Worker Queue Dry Admission

Decision: `ai_graphics_external_agent_cpu_static_private_worker_queue_dry_admission_prepared_with_runtime_blocks`

Status: `external_agent_cpu_static_private_worker_queue_dry_admission_prepared_five_dry_admitted_one_blocked_execution_blocked`

This packet advances the five CPU/static private worker-handoff-admitted tools into deterministic private worker queue dry-admission payload contracts. It does not submit any live queue job, enqueue a worker, dispatch a worker, invoke an adapter, execute a tool, or start GPU/runtime resources.

## Source Evidence

- Private worker-handoff admission packet: `docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-handoff-admission.json`
- Source handoff decision: `ai_graphics_external_agent_cpu_static_private_worker_handoff_admission_prepared_with_runtime_blocks`
- Builder: `server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-queue-dry-admission.ts`
- CLI: `server/cli/ai-graphics-external-agent-cpu-static-private-worker-queue-dry-admission.ts`

## Queue Dry Admission Result

- Total AI graphics tools covered: `21`
- Private worker queue dry admissions prepared: `5` tools: `d3`, `vega_lite`, `vega`, `svgdotjs_svg_js`, `viz_js`
- Dry queue payload contracts prepared: `5`
- CPU/static blocked tools: `1`
- Satori blocked pending approved font fixture: `1`
- Non-CPU/static tools deferred by runtime boundary: `15`
- External-agent private queue submissions approved now: `0`
- Backend queue submissions approved now: `0`
- Live queue writes approved now: `0`
- Worker enqueue approved tools now: `0`
- Worker dispatch approved tools now: `0`
- Tool execution approved tools now: `0`
- GPU runtime starts now: `0`

## Dry Queue Payloads

- `d3`: queue=`ai_graphics_external_agent_cpu_static_private_worker_queue`, snapshot=`approved-plan-snapshot://ai-graphics/external-agent/cpu-static-private-worker-queue-dry-admission/d3/snapshot-fixture`, reservation=`credit-reservation://ai-graphics/external-agent/cpu-static-private-worker-queue-dry-admission/d3/reservation-fixture`, manifest=`private://ai-graphics/external-agent/cpu-static-private-worker-handoff-admission/d3/artifact-manifest`, idempotency=`ai-graphics:external-agent:cpu-static-private-worker-queue-dry-admission:d3:approved-plan-snapshot-fixture:credit-reservation-fixture`
- `vega_lite`: queue=`ai_graphics_external_agent_cpu_static_private_worker_queue`, snapshot=`approved-plan-snapshot://ai-graphics/external-agent/cpu-static-private-worker-queue-dry-admission/vega_lite/snapshot-fixture`, reservation=`credit-reservation://ai-graphics/external-agent/cpu-static-private-worker-queue-dry-admission/vega_lite/reservation-fixture`, manifest=`private://ai-graphics/external-agent/cpu-static-private-worker-handoff-admission/vega_lite/artifact-manifest`, idempotency=`ai-graphics:external-agent:cpu-static-private-worker-queue-dry-admission:vega_lite:approved-plan-snapshot-fixture:credit-reservation-fixture`
- `vega`: queue=`ai_graphics_external_agent_cpu_static_private_worker_queue`, snapshot=`approved-plan-snapshot://ai-graphics/external-agent/cpu-static-private-worker-queue-dry-admission/vega/snapshot-fixture`, reservation=`credit-reservation://ai-graphics/external-agent/cpu-static-private-worker-queue-dry-admission/vega/reservation-fixture`, manifest=`private://ai-graphics/external-agent/cpu-static-private-worker-handoff-admission/vega/artifact-manifest`, idempotency=`ai-graphics:external-agent:cpu-static-private-worker-queue-dry-admission:vega:approved-plan-snapshot-fixture:credit-reservation-fixture`
- `svgdotjs_svg_js`: queue=`ai_graphics_external_agent_cpu_static_private_worker_queue`, snapshot=`approved-plan-snapshot://ai-graphics/external-agent/cpu-static-private-worker-queue-dry-admission/svgdotjs_svg_js/snapshot-fixture`, reservation=`credit-reservation://ai-graphics/external-agent/cpu-static-private-worker-queue-dry-admission/svgdotjs_svg_js/reservation-fixture`, manifest=`private://ai-graphics/external-agent/cpu-static-private-worker-handoff-admission/svgdotjs_svg_js/artifact-manifest`, idempotency=`ai-graphics:external-agent:cpu-static-private-worker-queue-dry-admission:svgdotjs_svg_js:approved-plan-snapshot-fixture:credit-reservation-fixture`
- `viz_js`: queue=`ai_graphics_external_agent_cpu_static_private_worker_queue`, snapshot=`approved-plan-snapshot://ai-graphics/external-agent/cpu-static-private-worker-queue-dry-admission/viz_js/snapshot-fixture`, reservation=`credit-reservation://ai-graphics/external-agent/cpu-static-private-worker-queue-dry-admission/viz_js/reservation-fixture`, manifest=`private://ai-graphics/external-agent/cpu-static-private-worker-handoff-admission/viz_js/artifact-manifest`, idempotency=`ai-graphics:external-agent:cpu-static-private-worker-queue-dry-admission:viz_js:approved-plan-snapshot-fixture:credit-reservation-fixture`

## Temporary Runtime Block And Live Queue Submission Policy

The actual executable-by-agent and live queue submission gates remain blocked in this packet. This block is intentional and temporary. It can be lifted tool-by-tool only after the exact request has accepted evidence for:

- approved plan snapshot record persisted by backend
- approved credit reservation record persisted by backend
- Tool Route admission approval for the exact tool request
- Worker admission approval for the exact tool request
- private artifact manifest writer and retention policy
- backend queue transport proof
- worker claim and lease proof
- idempotency and retry policy
- checkback policy
- fallback policy
- tool-specific QA gate
- per-tool runtime proof for browser/GPU/model targets when applicable

## Tool Rows

| Tool | Runtime target | Dry admission status | Dry admitted | Payload prepared | Agent queue submit now | Live queue write now | Tool execution now | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `torch_torchvision` | `native_linux_amd64_nvidia_l4_gpu_worker` | `private_worker_queue_dry_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission |
| `transformers` | `native_linux_amd64_nvidia_l4_gpu_worker` | `private_worker_queue_dry_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission |
| `sam2` | `native_linux_amd64_nvidia_l4_sam2_runtime` | `private_worker_queue_dry_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission |
| `birefnet` | `native_linux_amd64_nvidia_l4_birefnet_runtime` | `private_worker_queue_dry_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission |
| `real_esrgan` | `native_linux_amd64_nvidia_l4_real_esrgan_runtime` | `private_worker_queue_dry_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission |
| `kornia` | `native_linux_amd64_nvidia_l4_gpu_worker` | `private_worker_queue_dry_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission |
| `rembg` | `native_linux_amd64_nvidia_l4_gpu_worker` | `private_worker_queue_dry_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission |
| `transparent_background` | `native_linux_amd64_nvidia_l4_gpu_worker` | `private_worker_queue_dry_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission |
| `d3` | `node_cpu_static` | `private_worker_queue_dry_admission_prepared_execution_blocked` | `true` | `true` | `false` | `false` | `false` | private worker queue dry-admission payload is prepared, but external-agent queue submission, backend queue write, worker enqueue, worker dispatch, and tool execution remain blocked until the exact execution gates pass |
| `echarts` | `browser_chart_runtime_later` | `private_worker_queue_dry_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission |
| `vega_lite` | `node_cpu_static` | `private_worker_queue_dry_admission_prepared_execution_blocked` | `true` | `true` | `false` | `false` | `false` | private worker queue dry-admission payload is prepared, but external-agent queue submission, backend queue write, worker enqueue, worker dispatch, and tool execution remain blocked until the exact execution gates pass |
| `vega` | `node_cpu_static` | `private_worker_queue_dry_admission_prepared_execution_blocked` | `true` | `true` | `false` | `false` | `false` | private worker queue dry-admission payload is prepared, but external-agent queue submission, backend queue write, worker enqueue, worker dispatch, and tool execution remain blocked until the exact execution gates pass |
| `satori` | `node_cpu_static` | `private_worker_queue_dry_admission_blocked_pending_satori_font_fixture` | `false` | `false` | `false` | `false` | `false` | Satori remains blocked pending approved font fixture proof for text SVG layout before private worker queue dry admission |
| `svgdotjs_svg_js` | `node_cpu_static` | `private_worker_queue_dry_admission_prepared_execution_blocked` | `true` | `true` | `false` | `false` | `false` | private worker queue dry-admission payload is prepared, but external-agent queue submission, backend queue write, worker enqueue, worker dispatch, and tool execution remain blocked until the exact execution gates pass |
| `viz_js` | `node_cpu_static` | `private_worker_queue_dry_admission_prepared_execution_blocked` | `true` | `true` | `false` | `false` | `false` | private worker queue dry-admission payload is prepared, but external-agent queue submission, backend queue write, worker enqueue, worker dispatch, and tool execution remain blocked until the exact execution gates pass |
| `lottie_web` | `browser_animation_runtime_later` | `private_worker_queue_dry_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission |
| `animejs` | `browser_animation_runtime_later` | `private_worker_queue_dry_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission |
| `three_js` | `browser_canvas_webgl_runtime_later` | `private_worker_queue_dry_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission |
| `pixi_js` | `browser_canvas_webgl_runtime_later` | `private_worker_queue_dry_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission |
| `konva` | `browser_canvas_webgl_runtime_later` | `private_worker_queue_dry_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission |
| `babylonjs` | `browser_canvas_webgl_runtime_later` | `private_worker_queue_dry_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission |

## Blocked Or Deferred Rows

- `torch_torchvision`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission
- `transformers`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission
- `sam2`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission
- `birefnet`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission
- `real_esrgan`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission
- `kornia`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission
- `rembg`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission
- `transparent_background`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission
- `echarts`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission
- `satori`: Satori remains blocked pending approved font fixture proof for text SVG layout before private worker queue dry admission
- `lottie_web`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission
- `animejs`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission
- `three_js`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission
- `pixi_js`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission
- `konva`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission
- `babylonjs`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission

## Runtime Boundary

- `agentCanSelectForPlanning=true`
- `externalAgentCanSubmitPrivateWorkerQueueNow=false`
- `externalAgentCanRequestPrivateWorkerHandoffNow=false`
- `externalAgentCanInvokeAdapterNow=false`
- `agentCanExecuteToolsNow=false`
- `routeExecutionApprovedNow=false`
- `backendQueueSubmissionApprovedNow=false`
- `liveQueueWriteApprovedNow=false`
- `workerExecutionApprovedNow=false`
- `workerEnqueueApprovedNow=false`
- `workerDispatchApprovedNow=false`
- `toolExecutionApprovedNow=false`
- `providerRuntimeApprovedNow=false`
- `browserWebglCanvasRuntimeApprovedNow=false`
- `gpuRuntimeApprovedNow=false`
- `gpuRuntimeShouldStartNow=false`
- `runtimeReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

No dependency install, package-lock mutation, backend queue submission, live queue write, worker enqueue, worker dispatch, tool execution, route execution, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, model download/load, media processing, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is approved by this packet.

## Next Milestone

controlled private worker claim dry proof for the five dry-admitted CPU/static queue payloads, while Satori waits for approved font fixture proof and browser/GPU tools remain deferred
