# AI Graphics External Agent CPU Static Adapter Smoke

Decision: `ai_graphics_external_agent_cpu_static_adapter_smoke_prepared_with_runtime_blocks`

Status: `external_agent_cpu_static_adapter_smoke_prepared_five_ready_one_blocked_execution_blocked`

This packet takes the next small execution-readiness step after adapter authorization. It consumes the accepted CPU/static Phase 0 proof and marks the five passed CPU/static tools as adapter-smoke ready with private output contracts. It still keeps actual external-agent adapter invocation and tool execution blocked.

## Source Evidence

- CPU/static Phase 0 proof: `docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0.json`
- Phase 0 decision: `ai_graphics_cpu_static_execution_proof_phase_0_completed_with_warnings`
- Adapter authorization proof: `docs/tool-intelligence/ai-graphics/external-agent-tool-adapter-authorization-proof.json`
- Adapter authorization decision: `ai_graphics_external_agent_tool_adapter_authorization_prepared_with_runtime_blocks`
- Builder: `server/tool-registry/ai-graphics-external-agent-cpu-static-adapter-smoke.ts`
- CLI: `server/cli/ai-graphics-external-agent-cpu-static-adapter-smoke.ts`

## CPU/Static Adapter Smoke Result

- CPU/static cohort tools: `6`
- Adapter-smoke ready with private output contracts: `5` tools: `d3`, `vega_lite`, `vega`, `svgdotjs_svg_js`, `viz_js`
- Blocked CPU/static tools: `1`
- Satori blocked pending approved font fixture: `1`
- Non-CPU/static tools deferred by runtime boundary: `15`
- External-agent invokable adapter tools now: `0`
- Tool execution approved tools now: `0`
- GPU runtime starts now: `0`

Blocked CPU/static rows:

- `satori`: Satori remains blocked pending approved font fixture evidence for text SVG layout

## Tool Rows

| Tool | Runtime target | Adapter smoke status | Phase 0 status | Invokable now | Blocker |
| --- | --- | --- | --- | --- | --- |
| `torch_torchvision` | `native_linux_amd64_nvidia_l4_gpu_worker` | `deferred_non_cpu_static_runtime_boundary` | `n/a` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |
| `transformers` | `native_linux_amd64_nvidia_l4_gpu_worker` | `deferred_non_cpu_static_runtime_boundary` | `n/a` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |
| `sam2` | `native_linux_amd64_nvidia_l4_sam2_runtime` | `deferred_non_cpu_static_runtime_boundary` | `n/a` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |
| `birefnet` | `native_linux_amd64_nvidia_l4_birefnet_runtime` | `deferred_non_cpu_static_runtime_boundary` | `n/a` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |
| `real_esrgan` | `native_linux_amd64_nvidia_l4_real_esrgan_runtime` | `deferred_non_cpu_static_runtime_boundary` | `n/a` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |
| `kornia` | `native_linux_amd64_nvidia_l4_gpu_worker` | `deferred_non_cpu_static_runtime_boundary` | `n/a` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |
| `rembg` | `native_linux_amd64_nvidia_l4_gpu_worker` | `deferred_non_cpu_static_runtime_boundary` | `n/a` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |
| `transparent_background` | `native_linux_amd64_nvidia_l4_gpu_worker` | `deferred_non_cpu_static_runtime_boundary` | `n/a` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |
| `d3` | `node_cpu_static` | `cpu_static_adapter_smoke_ready_private_output_contract_execution_blocked` | `proof_passed` | `false` | adapter smoke contract is ready, but external-agent execution remains blocked until Tool Route, Worker, private artifact, QA, fallback, and checkback gates authorize a real tool call |
| `echarts` | `browser_chart_runtime_later` | `deferred_non_cpu_static_runtime_boundary` | `n/a` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |
| `vega_lite` | `node_cpu_static` | `cpu_static_adapter_smoke_ready_private_output_contract_execution_blocked` | `proof_passed` | `false` | adapter smoke contract is ready, but external-agent execution remains blocked until Tool Route, Worker, private artifact, QA, fallback, and checkback gates authorize a real tool call |
| `vega` | `node_cpu_static` | `cpu_static_adapter_smoke_ready_private_output_contract_execution_blocked` | `proof_passed` | `false` | adapter smoke contract is ready, but external-agent execution remains blocked until Tool Route, Worker, private artifact, QA, fallback, and checkback gates authorize a real tool call |
| `satori` | `node_cpu_static` | `cpu_static_adapter_smoke_blocked_pending_approved_font_fixture` | `proof_blocked_missing_runtime` | `false` | Satori remains blocked pending approved font fixture evidence for text SVG layout |
| `svgdotjs_svg_js` | `node_cpu_static` | `cpu_static_adapter_smoke_ready_private_output_contract_execution_blocked` | `proof_passed` | `false` | adapter smoke contract is ready, but external-agent execution remains blocked until Tool Route, Worker, private artifact, QA, fallback, and checkback gates authorize a real tool call |
| `viz_js` | `node_cpu_static` | `cpu_static_adapter_smoke_ready_private_output_contract_execution_blocked` | `proof_passed` | `false` | adapter smoke contract is ready, but external-agent execution remains blocked until Tool Route, Worker, private artifact, QA, fallback, and checkback gates authorize a real tool call |
| `lottie_web` | `browser_animation_runtime_later` | `deferred_non_cpu_static_runtime_boundary` | `n/a` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |
| `animejs` | `browser_animation_runtime_later` | `deferred_non_cpu_static_runtime_boundary` | `n/a` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |
| `three_js` | `browser_canvas_webgl_runtime_later` | `deferred_non_cpu_static_runtime_boundary` | `n/a` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |
| `pixi_js` | `browser_canvas_webgl_runtime_later` | `deferred_non_cpu_static_runtime_boundary` | `n/a` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |
| `konva` | `browser_canvas_webgl_runtime_later` | `deferred_non_cpu_static_runtime_boundary` | `n/a` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |
| `babylonjs` | `browser_canvas_webgl_runtime_later` | `deferred_non_cpu_static_runtime_boundary` | `n/a` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes |

## Runtime Boundary

- `agentCanSelectForPlanning=true`
- `externalAgentCanInvokeAdapterNow=false`
- `agentCanExecuteToolsNow=false`
- `routeExecutionApprovedNow=false`
- `workerExecutionApprovedNow=false`
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

external-agent CPU/static private worker-handoff admission for the five ready adapter-smoke tools, while Satori waits for approved font fixture proof and browser/GPU tools remain deferred
