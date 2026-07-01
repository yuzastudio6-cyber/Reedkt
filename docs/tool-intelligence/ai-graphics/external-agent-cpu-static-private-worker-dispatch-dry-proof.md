# AI Graphics External Agent CPU Static Private Worker Dispatch Dry Proof

Decision: `ai_graphics_external_agent_cpu_static_private_worker_dispatch_dry_proof_prepared_with_runtime_blocks`

Status: `external_agent_cpu_static_private_worker_dispatch_dry_proof_prepared_five_dispatchable_one_blocked_execution_blocked`

This packet advances the five CPU/static private worker queue dry-admitted tools into deterministic private worker dispatch envelopes. It does not claim a live worker job, enqueue a worker, dispatch a worker, invoke an adapter, execute a tool, or start GPU/runtime resources.

## Source Evidence

- Private worker claim dry-proof packet: `docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-claim-dry-proof.json`
- Source claim dry-proof decision: `ai_graphics_external_agent_cpu_static_private_worker_claim_dry_proof_prepared_with_runtime_blocks`
- Builder: `server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-dispatch-dry-proof.ts`
- CLI: `server/cli/ai-graphics-external-agent-cpu-static-private-worker-dispatch-dry-proof.ts`

## Dispatch Dry Proof Result

- Total AI graphics tools covered: `21`
- Private worker dispatch dry proofs prepared: `5` tools: `d3`, `vega_lite`, `vega`, `svgdotjs_svg_js`, `viz_js`
- Dry worker dispatch envelopes prepared: `5`
- CPU/static blocked tools: `1`
- Satori blocked pending approved font fixture: `1`
- Non-CPU/static tools deferred by runtime boundary: `15`
- External-agent private worker dispatches approved now: `0`
- External-agent private queue submissions approved now: `0`
- Backend queue submissions approved now: `0`
- Live queue writes approved now: `0`
- Worker claim approved tools now: `0`
- Worker enqueue approved tools now: `0`
- Worker dispatch approved tools now: `0`
- Tool execution approved tools now: `0`
- GPU runtime starts now: `0`

## Dry Dispatch Envelopes

- `d3`: queue=`ai_graphics_external_agent_cpu_static_private_worker_queue`, snapshot=`approved-plan-snapshot://ai-graphics/external-agent/cpu-static-private-worker-queue-dry-admission/d3/snapshot-fixture`, reservation=`credit-reservation://ai-graphics/external-agent/cpu-static-private-worker-queue-dry-admission/d3/reservation-fixture`, manifest=`private://ai-graphics/external-agent/cpu-static-private-worker-handoff-admission/d3/artifact-manifest`, queueIdempotency=`ai-graphics:external-agent:cpu-static-private-worker-queue-dry-admission:d3:approved-plan-snapshot-fixture:credit-reservation-fixture`, dispatchIdempotency=`ai-graphics:external-agent:cpu-static-private-worker-dispatch-dry-proof:d3:lease-900:dry-only`, dispatchAttempt=`dispatch://ai-graphics/external-agent/cpu-static-private-worker-dispatch-dry-proof/d3/dispatch-attempt-fixture`
- `vega_lite`: queue=`ai_graphics_external_agent_cpu_static_private_worker_queue`, snapshot=`approved-plan-snapshot://ai-graphics/external-agent/cpu-static-private-worker-queue-dry-admission/vega_lite/snapshot-fixture`, reservation=`credit-reservation://ai-graphics/external-agent/cpu-static-private-worker-queue-dry-admission/vega_lite/reservation-fixture`, manifest=`private://ai-graphics/external-agent/cpu-static-private-worker-handoff-admission/vega_lite/artifact-manifest`, queueIdempotency=`ai-graphics:external-agent:cpu-static-private-worker-queue-dry-admission:vega_lite:approved-plan-snapshot-fixture:credit-reservation-fixture`, dispatchIdempotency=`ai-graphics:external-agent:cpu-static-private-worker-dispatch-dry-proof:vega_lite:lease-900:dry-only`, dispatchAttempt=`dispatch://ai-graphics/external-agent/cpu-static-private-worker-dispatch-dry-proof/vega_lite/dispatch-attempt-fixture`
- `vega`: queue=`ai_graphics_external_agent_cpu_static_private_worker_queue`, snapshot=`approved-plan-snapshot://ai-graphics/external-agent/cpu-static-private-worker-queue-dry-admission/vega/snapshot-fixture`, reservation=`credit-reservation://ai-graphics/external-agent/cpu-static-private-worker-queue-dry-admission/vega/reservation-fixture`, manifest=`private://ai-graphics/external-agent/cpu-static-private-worker-handoff-admission/vega/artifact-manifest`, queueIdempotency=`ai-graphics:external-agent:cpu-static-private-worker-queue-dry-admission:vega:approved-plan-snapshot-fixture:credit-reservation-fixture`, dispatchIdempotency=`ai-graphics:external-agent:cpu-static-private-worker-dispatch-dry-proof:vega:lease-900:dry-only`, dispatchAttempt=`dispatch://ai-graphics/external-agent/cpu-static-private-worker-dispatch-dry-proof/vega/dispatch-attempt-fixture`
- `svgdotjs_svg_js`: queue=`ai_graphics_external_agent_cpu_static_private_worker_queue`, snapshot=`approved-plan-snapshot://ai-graphics/external-agent/cpu-static-private-worker-queue-dry-admission/svgdotjs_svg_js/snapshot-fixture`, reservation=`credit-reservation://ai-graphics/external-agent/cpu-static-private-worker-queue-dry-admission/svgdotjs_svg_js/reservation-fixture`, manifest=`private://ai-graphics/external-agent/cpu-static-private-worker-handoff-admission/svgdotjs_svg_js/artifact-manifest`, queueIdempotency=`ai-graphics:external-agent:cpu-static-private-worker-queue-dry-admission:svgdotjs_svg_js:approved-plan-snapshot-fixture:credit-reservation-fixture`, dispatchIdempotency=`ai-graphics:external-agent:cpu-static-private-worker-dispatch-dry-proof:svgdotjs_svg_js:lease-900:dry-only`, dispatchAttempt=`dispatch://ai-graphics/external-agent/cpu-static-private-worker-dispatch-dry-proof/svgdotjs_svg_js/dispatch-attempt-fixture`
- `viz_js`: queue=`ai_graphics_external_agent_cpu_static_private_worker_queue`, snapshot=`approved-plan-snapshot://ai-graphics/external-agent/cpu-static-private-worker-queue-dry-admission/viz_js/snapshot-fixture`, reservation=`credit-reservation://ai-graphics/external-agent/cpu-static-private-worker-queue-dry-admission/viz_js/reservation-fixture`, manifest=`private://ai-graphics/external-agent/cpu-static-private-worker-handoff-admission/viz_js/artifact-manifest`, queueIdempotency=`ai-graphics:external-agent:cpu-static-private-worker-queue-dry-admission:viz_js:approved-plan-snapshot-fixture:credit-reservation-fixture`, dispatchIdempotency=`ai-graphics:external-agent:cpu-static-private-worker-dispatch-dry-proof:viz_js:lease-900:dry-only`, dispatchAttempt=`dispatch://ai-graphics/external-agent/cpu-static-private-worker-dispatch-dry-proof/viz_js/dispatch-attempt-fixture`

## Temporary Runtime Block And Live Worker Dispatch Policy

The actual executable-by-agent, live queue submission, live worker dispatch, and tool execution gates remain blocked in this packet. This block is intentional and temporary. It can be lifted tool-by-tool only after the exact request has accepted evidence for:

- approved plan snapshot record persisted by backend
- approved credit reservation record persisted by backend
- Tool Route admission approval for the exact tool request
- Worker admission approval for the exact tool request
- private artifact manifest writer and retention policy
- backend queue transport proof
- live queue write proof
- worker claim lease proof
- worker dispatch authorization proof
- worker dispatch smoke proof
- idempotency and retry policy
- checkback policy
- fallback policy
- tool-specific QA gate
- per-tool runtime proof for browser/GPU/model targets when applicable

## Tool Rows

| Tool | Runtime target | Dispatch dry proof status | Dispatch dry proof prepared | Dispatch envelope prepared | Agent worker dispatch now | Worker claim now | Worker dispatch now | Tool execution now | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `torch_torchvision` | `native_linux_amd64_nvidia_l4_gpu_worker` | `private_worker_dispatch_dry_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof |
| `transformers` | `native_linux_amd64_nvidia_l4_gpu_worker` | `private_worker_dispatch_dry_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof |
| `sam2` | `native_linux_amd64_nvidia_l4_sam2_runtime` | `private_worker_dispatch_dry_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof |
| `birefnet` | `native_linux_amd64_nvidia_l4_birefnet_runtime` | `private_worker_dispatch_dry_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof |
| `real_esrgan` | `native_linux_amd64_nvidia_l4_real_esrgan_runtime` | `private_worker_dispatch_dry_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof |
| `kornia` | `native_linux_amd64_nvidia_l4_gpu_worker` | `private_worker_dispatch_dry_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof |
| `rembg` | `native_linux_amd64_nvidia_l4_gpu_worker` | `private_worker_dispatch_dry_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof |
| `transparent_background` | `native_linux_amd64_nvidia_l4_gpu_worker` | `private_worker_dispatch_dry_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof |
| `d3` | `node_cpu_static` | `private_worker_dispatch_dry_proof_prepared_execution_blocked` | `true` | `true` | `false` | `false` | `false` | `false` | private worker dispatch envelope is prepared in dry mode, but external-agent worker dispatch, worker enqueue, tool execution, and runtime remain blocked until live execution gates pass |
| `echarts` | `browser_chart_runtime_later` | `private_worker_dispatch_dry_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof |
| `vega_lite` | `node_cpu_static` | `private_worker_dispatch_dry_proof_prepared_execution_blocked` | `true` | `true` | `false` | `false` | `false` | `false` | private worker dispatch envelope is prepared in dry mode, but external-agent worker dispatch, worker enqueue, tool execution, and runtime remain blocked until live execution gates pass |
| `vega` | `node_cpu_static` | `private_worker_dispatch_dry_proof_prepared_execution_blocked` | `true` | `true` | `false` | `false` | `false` | `false` | private worker dispatch envelope is prepared in dry mode, but external-agent worker dispatch, worker enqueue, tool execution, and runtime remain blocked until live execution gates pass |
| `satori` | `node_cpu_static` | `private_worker_dispatch_dry_proof_blocked_pending_satori_font_fixture` | `false` | `false` | `false` | `false` | `false` | `false` | Satori remains blocked pending approved font fixture proof before private worker dispatch dry proof |
| `svgdotjs_svg_js` | `node_cpu_static` | `private_worker_dispatch_dry_proof_prepared_execution_blocked` | `true` | `true` | `false` | `false` | `false` | `false` | private worker dispatch envelope is prepared in dry mode, but external-agent worker dispatch, worker enqueue, tool execution, and runtime remain blocked until live execution gates pass |
| `viz_js` | `node_cpu_static` | `private_worker_dispatch_dry_proof_prepared_execution_blocked` | `true` | `true` | `false` | `false` | `false` | `false` | private worker dispatch envelope is prepared in dry mode, but external-agent worker dispatch, worker enqueue, tool execution, and runtime remain blocked until live execution gates pass |
| `lottie_web` | `browser_animation_runtime_later` | `private_worker_dispatch_dry_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof |
| `animejs` | `browser_animation_runtime_later` | `private_worker_dispatch_dry_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof |
| `three_js` | `browser_canvas_webgl_runtime_later` | `private_worker_dispatch_dry_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof |
| `pixi_js` | `browser_canvas_webgl_runtime_later` | `private_worker_dispatch_dry_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof |
| `konva` | `browser_canvas_webgl_runtime_later` | `private_worker_dispatch_dry_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof |
| `babylonjs` | `browser_canvas_webgl_runtime_later` | `private_worker_dispatch_dry_proof_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | `false` | non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof |

## Blocked Or Deferred Rows

- `torch_torchvision`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof
- `transformers`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof
- `sam2`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof
- `birefnet`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof
- `real_esrgan`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof
- `kornia`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof
- `rembg`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof
- `transparent_background`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof
- `echarts`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof
- `satori`: Satori remains blocked pending approved font fixture proof before private worker dispatch dry proof
- `lottie_web`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof
- `animejs`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof
- `three_js`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof
- `pixi_js`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof
- `konva`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof
- `babylonjs`: non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof

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

controlled private worker dispatch smoke proof with provided evidence for the five dispatchable CPU/static payloads, while Satori waits for approved font fixture proof and browser/GPU tools remain deferred
