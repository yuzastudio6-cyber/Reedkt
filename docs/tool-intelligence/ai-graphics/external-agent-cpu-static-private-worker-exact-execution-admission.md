# AI Graphics External Agent CPU Static Private Worker Exact Execution Admission

Decision: `ai_graphics_external_agent_cpu_static_private_worker_exact_execution_admission_prepared_with_runtime_blocks`

Status: `external_agent_cpu_static_private_worker_exact_execution_admission_prepared_five_with_runtime_blocks`

This packet admits exact request envelopes for the first five CPU/static tools only when they already have accepted controlled private-worker proof. With the checked-in blocked source packet, it remains fail-closed. It is a request-admission gate only: it does not write queues, invoke adapters, enqueue workers, dispatch workers, execute tools, create artifacts, create signed URLs, start GPU runtime, or unlock external beta/production traffic.

## Source Evidence

- Controlled proof packet: `docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-controlled-tool-execution-proof.json`
- Source controlled proof decision: `ai_graphics_external_agent_cpu_static_private_worker_controlled_tool_execution_proof_prepared_with_runtime_blocks`
- Private worker queue: `ai_graphics_external_agent_cpu_static_private_worker_queue`
- Builder: `server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-exact-execution-admission.ts`
- CLI: `server/cli/ai-graphics-external-agent-cpu-static-private-worker-exact-execution-admission.ts`

## Exact Admission Result

- Total AI graphics tools covered: `21`
- Exact execution admissions ready: `5` tools: `d3`, `vega_lite`, `vega`, `svgdotjs_svg_js`, `viz_js`
- Source controlled proofs accepted: `0`
- Exact request envelopes accepted: `5`
- Approved plan snapshots accepted: `5`
- Credit reservations accepted: `5`
- Private artifact manifests accepted: `5`
- Worker accepted request schemas accepted: `5`
- Tool-specific QA gates accepted: `5`
- Satori blocked pending approved font fixture: `1`
- Non-CPU/static tools deferred by runtime boundary: `15`
- External-agent adapter invocations approved now: `0`
- External-agent executable tools now: `0`
- Tool execution approved tools now: `0`
- GPU runtime starts now: `0`

## Exact Admission Evidence Refs

- `d3`: exactRequest=`exact-request-envelope://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/d3/request`, admission=`exact-execution-admission://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/d3/decision`, workerSchema=`worker-accepted-request-schema://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/d3/schema`, sourceControlled=`controlled-tool-execution-proof://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/d3/pending-controlled-proof`, manifest=`private://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/d3/manifest`, unlockCondition=`execution-unlock-condition://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/d3/adapter-worker-enqueue`
- `vega_lite`: exactRequest=`exact-request-envelope://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/vega_lite/request`, admission=`exact-execution-admission://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/vega_lite/decision`, workerSchema=`worker-accepted-request-schema://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/vega_lite/schema`, sourceControlled=`controlled-tool-execution-proof://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/vega_lite/pending-controlled-proof`, manifest=`private://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/vega_lite/manifest`, unlockCondition=`execution-unlock-condition://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/vega_lite/adapter-worker-enqueue`
- `vega`: exactRequest=`exact-request-envelope://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/vega/request`, admission=`exact-execution-admission://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/vega/decision`, workerSchema=`worker-accepted-request-schema://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/vega/schema`, sourceControlled=`controlled-tool-execution-proof://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/vega/pending-controlled-proof`, manifest=`private://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/vega/manifest`, unlockCondition=`execution-unlock-condition://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/vega/adapter-worker-enqueue`
- `svgdotjs_svg_js`: exactRequest=`exact-request-envelope://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/svgdotjs_svg_js/request`, admission=`exact-execution-admission://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/svgdotjs_svg_js/decision`, workerSchema=`worker-accepted-request-schema://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/svgdotjs_svg_js/schema`, sourceControlled=`controlled-tool-execution-proof://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/svgdotjs_svg_js/pending-controlled-proof`, manifest=`private://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/svgdotjs_svg_js/manifest`, unlockCondition=`execution-unlock-condition://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/svgdotjs_svg_js/adapter-worker-enqueue`
- `viz_js`: exactRequest=`exact-request-envelope://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/viz_js/request`, admission=`exact-execution-admission://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/viz_js/decision`, workerSchema=`worker-accepted-request-schema://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/viz_js/schema`, sourceControlled=`controlled-tool-execution-proof://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/viz_js/pending-controlled-proof`, manifest=`private://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/viz_js/manifest`, unlockCondition=`execution-unlock-condition://ai-graphics/external-agent/cpu-static-private-worker-exact-execution-admission/viz_js/adapter-worker-enqueue`

## Tool Rows

| Tool | Runtime target | Exact admission status | Admission ready | Request envelope accepted | Source controlled evidence accepted | Adapter invocation now | Worker enqueue now | Tool execution now | GPU runtime now | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `torch_torchvision` | `native_linux_amd64_nvidia_l4_gpu_worker` | `exact_external_agent_execution_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `transformers` | `native_linux_amd64_nvidia_l4_gpu_worker` | `exact_external_agent_execution_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `sam2` | `native_linux_amd64_nvidia_l4_sam2_runtime` | `exact_external_agent_execution_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `birefnet` | `native_linux_amd64_nvidia_l4_birefnet_runtime` | `exact_external_agent_execution_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `real_esrgan` | `native_linux_amd64_nvidia_l4_real_esrgan_runtime` | `exact_external_agent_execution_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `kornia` | `native_linux_amd64_nvidia_l4_gpu_worker` | `exact_external_agent_execution_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `rembg` | `native_linux_amd64_nvidia_l4_gpu_worker` | `exact_external_agent_execution_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `transparent_background` | `native_linux_amd64_nvidia_l4_gpu_worker` | `exact_external_agent_execution_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `d3` | `node_cpu_static` | `exact_external_agent_execution_admission_ready_for_private_worker_request_execution_still_blocked` | `true` | `true` | `false` | `false` | `false` | `false` | `false` | exact request admitted with provided evidence; adapter invocation, live queue write, worker enqueue, worker dispatch, and tool execution remain blocked until the next gate |
| `echarts` | `browser_chart_runtime_later` | `exact_external_agent_execution_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `vega_lite` | `node_cpu_static` | `exact_external_agent_execution_admission_ready_for_private_worker_request_execution_still_blocked` | `true` | `true` | `false` | `false` | `false` | `false` | `false` | exact request admitted with provided evidence; adapter invocation, live queue write, worker enqueue, worker dispatch, and tool execution remain blocked until the next gate |
| `vega` | `node_cpu_static` | `exact_external_agent_execution_admission_ready_for_private_worker_request_execution_still_blocked` | `true` | `true` | `false` | `false` | `false` | `false` | `false` | exact request admitted with provided evidence; adapter invocation, live queue write, worker enqueue, worker dispatch, and tool execution remain blocked until the next gate |
| `satori` | `node_cpu_static` | `exact_external_agent_execution_admission_blocked_pending_satori_font_fixture` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | blocked pending approved Satori font fixture evidence bridge |
| `svgdotjs_svg_js` | `node_cpu_static` | `exact_external_agent_execution_admission_ready_for_private_worker_request_execution_still_blocked` | `true` | `true` | `false` | `false` | `false` | `false` | `false` | exact request admitted with provided evidence; adapter invocation, live queue write, worker enqueue, worker dispatch, and tool execution remain blocked until the next gate |
| `viz_js` | `node_cpu_static` | `exact_external_agent_execution_admission_ready_for_private_worker_request_execution_still_blocked` | `true` | `true` | `false` | `false` | `false` | `false` | `false` | exact request admitted with provided evidence; adapter invocation, live queue write, worker enqueue, worker dispatch, and tool execution remain blocked until the next gate |
| `lottie_web` | `browser_animation_runtime_later` | `exact_external_agent_execution_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `animejs` | `browser_animation_runtime_later` | `exact_external_agent_execution_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `three_js` | `browser_canvas_webgl_runtime_later` | `exact_external_agent_execution_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `pixi_js` | `browser_canvas_webgl_runtime_later` | `exact_external_agent_execution_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `konva` | `browser_canvas_webgl_runtime_later` | `exact_external_agent_execution_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `babylonjs` | `browser_canvas_webgl_runtime_later` | `exact_external_agent_execution_admission_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |

## Runtime Boundary

- `agentCanSelectForPlanning=true`
- `externalAgentCanDispatchPrivateWorkerJobNow=false`
- `externalAgentCanSubmitPrivateWorkerQueueNow=false`
- `externalAgentCanRequestPrivateWorkerHandoffNow=false`
- `externalAgentCanInvokeAdapterNow=false`
- `agentCanExecuteToolsNow=false`
- `routeExecutionApprovedNow=false`
- `backendQueueSubmissionApprovedNow=false`
- `liveQueueWriteApprovedNow=false`
- `workerClaimApprovedNow=false`
- `workerDispatchApprovedNow=false`
- `workerExecutionApprovedNow=false`
- `workerEnqueueApprovedNow=false`
- `toolExecutionApprovedNow=false`
- `providerRuntimeApprovedNow=false`
- `browserWebglCanvasRuntimeApprovedNow=false`
- `gpuRuntimeApprovedNow=false`
- `gpuRuntimeShouldStartNow=false`
- `runtimeReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

The block is temporary and intentional. It can be lifted per tool only after the next adapter-invocation and worker-enqueue admission proves the real private worker path for an approved snapshot, credit reservation, private artifact manifest, idempotency key, checkback policy, fallback policy, and tool-specific QA gate.

## Next Milestone

`AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_ADAPTER_INVOCATION_AND_ENQUEUE_ADMISSION`
