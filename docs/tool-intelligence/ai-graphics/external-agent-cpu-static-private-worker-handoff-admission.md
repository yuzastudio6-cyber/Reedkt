# AI Graphics External Agent CPU Static Private Worker Handoff Admission

Decision: `ai_graphics_external_agent_cpu_static_private_worker_handoff_admission_prepared_with_runtime_blocks`

Status: `external_agent_cpu_static_private_worker_handoff_admission_prepared_five_admitted_one_blocked_execution_blocked`

This packet advances the five CPU/static adapter-smoke-ready tools into a private worker-handoff admission contract. It does not make the tools executable by the external agent yet. The runtime block is temporary and must be lifted tool-by-tool only after the required execution gates below pass.

## Source Evidence

- CPU/static adapter-smoke proof: `docs/tool-intelligence/ai-graphics/external-agent-cpu-static-adapter-smoke.json`
- Source adapter-smoke decision: `ai_graphics_external_agent_cpu_static_adapter_smoke_prepared_with_runtime_blocks`
- Builder: `server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-handoff-admission.ts`
- CLI: `server/cli/ai-graphics-external-agent-cpu-static-private-worker-handoff-admission.ts`

## Admission Result

- Total AI graphics tools covered: `21`
- Private worker-handoff admissions prepared: `5` tools: `d3`, `vega_lite`, `vega`, `svgdotjs_svg_js`, `viz_js`
- CPU/static blocked tools: `1`
- Satori blocked pending approved font fixture: `1`
- Non-CPU/static tools deferred by runtime boundary: `15`
- External-agent private handoff request tools now: `0`
- Worker enqueue approved tools now: `0`
- Worker dispatch approved tools now: `0`
- Tool execution approved tools now: `0`
- GPU runtime starts now: `0`

## Temporary Runtime Block And Unblock Policy

The actual executable-by-agent gate remains blocked in this packet. It is not permanently blocked; it is intentionally fail-closed until a later gate proves the following items for the exact tool request:

- approved plan snapshot reference
- approved credit reservation reference
- Tool Route admission approval for the exact tool
- Worker admission approval for the exact tool
- private artifact manifest writer and retention policy
- worker queue transport proof
- worker claim and lease proof
- idempotency and retry policy
- checkback policy
- fallback policy
- tool-specific QA gate
- per-tool runtime proof for browser/GPU/model targets when applicable

## Tool Rows

| Tool | Runtime target | Admission status | Handoff admission prepared | Agent handoff request now | Tool execution now | Blocker |
| --- | --- | --- | --- | --- | --- | --- |
| `torch_torchvision` | `native_linux_amd64_nvidia_l4_gpu_worker` | `private_worker_handoff_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |
| `transformers` | `native_linux_amd64_nvidia_l4_gpu_worker` | `private_worker_handoff_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |
| `sam2` | `native_linux_amd64_nvidia_l4_sam2_runtime` | `private_worker_handoff_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |
| `birefnet` | `native_linux_amd64_nvidia_l4_birefnet_runtime` | `private_worker_handoff_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |
| `real_esrgan` | `native_linux_amd64_nvidia_l4_real_esrgan_runtime` | `private_worker_handoff_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |
| `kornia` | `native_linux_amd64_nvidia_l4_gpu_worker` | `private_worker_handoff_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |
| `rembg` | `native_linux_amd64_nvidia_l4_gpu_worker` | `private_worker_handoff_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |
| `transparent_background` | `native_linux_amd64_nvidia_l4_gpu_worker` | `private_worker_handoff_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |
| `d3` | `node_cpu_static` | `private_worker_handoff_admission_prepared_execution_blocked` | `true` | `false` | `false` | private worker-handoff admission contract is prepared, but external-agent adapter invocation, live queue write, worker dispatch, and tool execution remain blocked until the exact execution gates pass |
| `echarts` | `browser_chart_runtime_later` | `private_worker_handoff_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |
| `vega_lite` | `node_cpu_static` | `private_worker_handoff_admission_prepared_execution_blocked` | `true` | `false` | `false` | private worker-handoff admission contract is prepared, but external-agent adapter invocation, live queue write, worker dispatch, and tool execution remain blocked until the exact execution gates pass |
| `vega` | `node_cpu_static` | `private_worker_handoff_admission_prepared_execution_blocked` | `true` | `false` | `false` | private worker-handoff admission contract is prepared, but external-agent adapter invocation, live queue write, worker dispatch, and tool execution remain blocked until the exact execution gates pass |
| `satori` | `node_cpu_static` | `private_worker_handoff_blocked_pending_satori_font_fixture` | `false` | `false` | `false` | Satori remains blocked pending approved font fixture proof for text SVG layout before private worker handoff admission |
| `svgdotjs_svg_js` | `node_cpu_static` | `private_worker_handoff_admission_prepared_execution_blocked` | `true` | `false` | `false` | private worker-handoff admission contract is prepared, but external-agent adapter invocation, live queue write, worker dispatch, and tool execution remain blocked until the exact execution gates pass |
| `viz_js` | `node_cpu_static` | `private_worker_handoff_admission_prepared_execution_blocked` | `true` | `false` | `false` | private worker-handoff admission contract is prepared, but external-agent adapter invocation, live queue write, worker dispatch, and tool execution remain blocked until the exact execution gates pass |
| `lottie_web` | `browser_animation_runtime_later` | `private_worker_handoff_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |
| `animejs` | `browser_animation_runtime_later` | `private_worker_handoff_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |
| `three_js` | `browser_canvas_webgl_runtime_later` | `private_worker_handoff_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |
| `pixi_js` | `browser_canvas_webgl_runtime_later` | `private_worker_handoff_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |
| `konva` | `browser_canvas_webgl_runtime_later` | `private_worker_handoff_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |
| `babylonjs` | `browser_canvas_webgl_runtime_later` | `private_worker_handoff_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |

## Blocked Or Deferred Rows

- `torch_torchvision`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes
- `transformers`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes
- `sam2`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes
- `birefnet`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes
- `real_esrgan`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes
- `kornia`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes
- `rembg`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes
- `transparent_background`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes
- `echarts`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes
- `satori`: Satori remains blocked pending approved font fixture proof for text SVG layout before private worker handoff admission
- `lottie_web`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes
- `animejs`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes
- `three_js`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes
- `pixi_js`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes
- `konva`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes
- `babylonjs`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes

## Runtime Boundary

- `agentCanSelectForPlanning=true`
- `externalAgentCanRequestPrivateWorkerHandoffNow=false`
- `externalAgentCanInvokeAdapterNow=false`
- `agentCanExecuteToolsNow=false`
- `routeExecutionApprovedNow=false`
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

controlled private worker queue dry admission for the five admitted CPU/static tools, while Satori waits for approved font fixture proof and browser/GPU tools remain deferred
