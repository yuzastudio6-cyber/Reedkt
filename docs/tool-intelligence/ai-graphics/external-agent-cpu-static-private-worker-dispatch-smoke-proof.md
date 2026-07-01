# AI Graphics External Agent CPU Static Private Worker Dispatch Smoke Proof

Decision: `ai_graphics_external_agent_cpu_static_private_worker_dispatch_smoke_proof_prepared_with_runtime_blocks`

Status: `external_agent_cpu_static_private_worker_dispatch_smoke_proof_accepted_five_with_runtime_blocks`

This packet validates saved/provided private worker dispatch smoke evidence for the five CPU/static tools that already passed dispatch dry proof. It does not create a live worker lease, submit a backend queue write, dispatch a worker, invoke an adapter, execute a tool, create an artifact, create a signed URL, or start browser/GPU/runtime resources.

## Source Evidence

- Private worker dispatch dry-proof packet: `docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-dispatch-dry-proof.json`
- Source dispatch dry-proof decision: `ai_graphics_external_agent_cpu_static_private_worker_dispatch_dry_proof_prepared_with_runtime_blocks`
- Private worker queue: `ai_graphics_external_agent_cpu_static_private_worker_queue`
- Builder: `server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-dispatch-smoke-proof.ts`
- CLI: `server/cli/ai-graphics-external-agent-cpu-static-private-worker-dispatch-smoke-proof.ts`

## Smoke Proof Result

- Total AI graphics tools covered: `21`
- Dispatch smoke proof accepted tools: `5` tools: `d3`, `vega_lite`, `vega`, `svgdotjs_svg_js`, `viz_js`
- Dispatch smoke proof accepted with provided evidence: `5`
- Source dispatch dry-proof prepared tools: `5`
- Satori blocked pending approved font fixture: `1`
- Non-CPU/static tools deferred by runtime boundary: `15`
- External-agent private worker dispatches approved now: `0`
- External-agent private queue submissions approved now: `0`
- Backend queue submissions approved now: `0`
- Live queue writes approved now: `0`
- Worker claim approved tools now: `0`
- Worker dispatch approved tools now: `0`
- Tool execution approved tools now: `0`
- GPU runtime starts now: `0`

## Provided Smoke Evidence Refs

- `d3`: evidence=`evidence://ai-graphics/external-agent/cpu-static-private-worker-dispatch-smoke-proof/d3/provided-worker-dispatch-smoke`, telemetry=`telemetry://ai-graphics/external-agent/cpu-static-private-worker-dispatch-smoke-proof/d3/provided-worker-dispatch-smoke`, leaseAudit=`lease-audit://ai-graphics/external-agent/cpu-static-private-worker-dispatch-smoke-proof/d3/provided-worker-dispatch-smoke`, cleanup=`cleanup://ai-graphics/external-agent/cpu-static-private-worker-dispatch-smoke-proof/d3/provided-worker-dispatch-smoke`, sourceDispatchAttempt=`dispatch://ai-graphics/external-agent/cpu-static-private-worker-dispatch-dry-proof/d3/dispatch-attempt-fixture`, manifest=`private://ai-graphics/external-agent/cpu-static-private-worker-handoff-admission/d3/artifact-manifest`
- `vega_lite`: evidence=`evidence://ai-graphics/external-agent/cpu-static-private-worker-dispatch-smoke-proof/vega_lite/provided-worker-dispatch-smoke`, telemetry=`telemetry://ai-graphics/external-agent/cpu-static-private-worker-dispatch-smoke-proof/vega_lite/provided-worker-dispatch-smoke`, leaseAudit=`lease-audit://ai-graphics/external-agent/cpu-static-private-worker-dispatch-smoke-proof/vega_lite/provided-worker-dispatch-smoke`, cleanup=`cleanup://ai-graphics/external-agent/cpu-static-private-worker-dispatch-smoke-proof/vega_lite/provided-worker-dispatch-smoke`, sourceDispatchAttempt=`dispatch://ai-graphics/external-agent/cpu-static-private-worker-dispatch-dry-proof/vega_lite/dispatch-attempt-fixture`, manifest=`private://ai-graphics/external-agent/cpu-static-private-worker-handoff-admission/vega_lite/artifact-manifest`
- `vega`: evidence=`evidence://ai-graphics/external-agent/cpu-static-private-worker-dispatch-smoke-proof/vega/provided-worker-dispatch-smoke`, telemetry=`telemetry://ai-graphics/external-agent/cpu-static-private-worker-dispatch-smoke-proof/vega/provided-worker-dispatch-smoke`, leaseAudit=`lease-audit://ai-graphics/external-agent/cpu-static-private-worker-dispatch-smoke-proof/vega/provided-worker-dispatch-smoke`, cleanup=`cleanup://ai-graphics/external-agent/cpu-static-private-worker-dispatch-smoke-proof/vega/provided-worker-dispatch-smoke`, sourceDispatchAttempt=`dispatch://ai-graphics/external-agent/cpu-static-private-worker-dispatch-dry-proof/vega/dispatch-attempt-fixture`, manifest=`private://ai-graphics/external-agent/cpu-static-private-worker-handoff-admission/vega/artifact-manifest`
- `svgdotjs_svg_js`: evidence=`evidence://ai-graphics/external-agent/cpu-static-private-worker-dispatch-smoke-proof/svgdotjs_svg_js/provided-worker-dispatch-smoke`, telemetry=`telemetry://ai-graphics/external-agent/cpu-static-private-worker-dispatch-smoke-proof/svgdotjs_svg_js/provided-worker-dispatch-smoke`, leaseAudit=`lease-audit://ai-graphics/external-agent/cpu-static-private-worker-dispatch-smoke-proof/svgdotjs_svg_js/provided-worker-dispatch-smoke`, cleanup=`cleanup://ai-graphics/external-agent/cpu-static-private-worker-dispatch-smoke-proof/svgdotjs_svg_js/provided-worker-dispatch-smoke`, sourceDispatchAttempt=`dispatch://ai-graphics/external-agent/cpu-static-private-worker-dispatch-dry-proof/svgdotjs_svg_js/dispatch-attempt-fixture`, manifest=`private://ai-graphics/external-agent/cpu-static-private-worker-handoff-admission/svgdotjs_svg_js/artifact-manifest`
- `viz_js`: evidence=`evidence://ai-graphics/external-agent/cpu-static-private-worker-dispatch-smoke-proof/viz_js/provided-worker-dispatch-smoke`, telemetry=`telemetry://ai-graphics/external-agent/cpu-static-private-worker-dispatch-smoke-proof/viz_js/provided-worker-dispatch-smoke`, leaseAudit=`lease-audit://ai-graphics/external-agent/cpu-static-private-worker-dispatch-smoke-proof/viz_js/provided-worker-dispatch-smoke`, cleanup=`cleanup://ai-graphics/external-agent/cpu-static-private-worker-dispatch-smoke-proof/viz_js/provided-worker-dispatch-smoke`, sourceDispatchAttempt=`dispatch://ai-graphics/external-agent/cpu-static-private-worker-dispatch-dry-proof/viz_js/dispatch-attempt-fixture`, manifest=`private://ai-graphics/external-agent/cpu-static-private-worker-handoff-admission/viz_js/artifact-manifest`

## Tool Rows

| Tool | Runtime target | Smoke proof status | Evidence accepted | Smoke completed with evidence | Agent worker dispatch now | Worker dispatch now | Tool execution now | GPU runtime now | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `torch_torchvision` | `native_linux_amd64_nvidia_l4_gpu_worker` | `private_worker_dispatch_smoke_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch smoke proof |
| `transformers` | `native_linux_amd64_nvidia_l4_gpu_worker` | `private_worker_dispatch_smoke_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch smoke proof |
| `sam2` | `native_linux_amd64_nvidia_l4_sam2_runtime` | `private_worker_dispatch_smoke_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch smoke proof |
| `birefnet` | `native_linux_amd64_nvidia_l4_birefnet_runtime` | `private_worker_dispatch_smoke_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch smoke proof |
| `real_esrgan` | `native_linux_amd64_nvidia_l4_real_esrgan_runtime` | `private_worker_dispatch_smoke_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch smoke proof |
| `kornia` | `native_linux_amd64_nvidia_l4_gpu_worker` | `private_worker_dispatch_smoke_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch smoke proof |
| `rembg` | `native_linux_amd64_nvidia_l4_gpu_worker` | `private_worker_dispatch_smoke_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch smoke proof |
| `transparent_background` | `native_linux_amd64_nvidia_l4_gpu_worker` | `private_worker_dispatch_smoke_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch smoke proof |
| `d3` | `node_cpu_static` | `private_worker_dispatch_smoke_proof_accepted_with_provided_evidence_execution_blocked` | `true` | `true` | `false` | `false` | `false` | `false` | provided private worker dispatch smoke evidence is accepted, but live worker dispatch, worker execution, and tool execution remain blocked until the tool execution dry-run proof and exact request gates pass |
| `echarts` | `browser_chart_runtime_later` | `private_worker_dispatch_smoke_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch smoke proof |
| `vega_lite` | `node_cpu_static` | `private_worker_dispatch_smoke_proof_accepted_with_provided_evidence_execution_blocked` | `true` | `true` | `false` | `false` | `false` | `false` | provided private worker dispatch smoke evidence is accepted, but live worker dispatch, worker execution, and tool execution remain blocked until the tool execution dry-run proof and exact request gates pass |
| `vega` | `node_cpu_static` | `private_worker_dispatch_smoke_proof_accepted_with_provided_evidence_execution_blocked` | `true` | `true` | `false` | `false` | `false` | `false` | provided private worker dispatch smoke evidence is accepted, but live worker dispatch, worker execution, and tool execution remain blocked until the tool execution dry-run proof and exact request gates pass |
| `satori` | `node_cpu_static` | `private_worker_dispatch_smoke_proof_blocked_pending_satori_font_fixture` | `false` | `false` | `false` | `false` | `false` | `false` | Satori remains blocked pending approved font fixture proof before private worker dispatch smoke proof |
| `svgdotjs_svg_js` | `node_cpu_static` | `private_worker_dispatch_smoke_proof_accepted_with_provided_evidence_execution_blocked` | `true` | `true` | `false` | `false` | `false` | `false` | provided private worker dispatch smoke evidence is accepted, but live worker dispatch, worker execution, and tool execution remain blocked until the tool execution dry-run proof and exact request gates pass |
| `viz_js` | `node_cpu_static` | `private_worker_dispatch_smoke_proof_accepted_with_provided_evidence_execution_blocked` | `true` | `true` | `false` | `false` | `false` | `false` | provided private worker dispatch smoke evidence is accepted, but live worker dispatch, worker execution, and tool execution remain blocked until the tool execution dry-run proof and exact request gates pass |
| `lottie_web` | `browser_animation_runtime_later` | `private_worker_dispatch_smoke_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch smoke proof |
| `animejs` | `browser_animation_runtime_later` | `private_worker_dispatch_smoke_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch smoke proof |
| `three_js` | `browser_canvas_webgl_runtime_later` | `private_worker_dispatch_smoke_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch smoke proof |
| `pixi_js` | `browser_canvas_webgl_runtime_later` | `private_worker_dispatch_smoke_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch smoke proof |
| `konva` | `browser_canvas_webgl_runtime_later` | `private_worker_dispatch_smoke_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch smoke proof |
| `babylonjs` | `browser_canvas_webgl_runtime_later` | `private_worker_dispatch_smoke_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch smoke proof |

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

No dependency install, package-lock mutation, backend queue submission, live queue write, worker claim, worker enqueue, worker dispatch, tool execution, route execution, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, model download/load, media processing, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is approved by this packet.

## Next Milestone

tool execution dry-run proof for the five CPU/static private-worker dispatch smoke accepted tools, while Satori waits for approved font fixture proof and browser/GPU tools remain deferred
