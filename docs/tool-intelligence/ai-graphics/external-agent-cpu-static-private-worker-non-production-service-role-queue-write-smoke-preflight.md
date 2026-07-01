# AI Graphics External Agent CPU Static Private Worker Non-Production Service-Role Queue-Write Smoke Preflight

Decision: `ai_graphics_external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_preflight_prepared_with_runtime_blocks`

Status: `external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_preflight_prepared_five_execution_blocked`

This packet prepares the exact non-production service-role queue-write smoke requirements for the five CPU/static private-worker tools. It does not run the smoke, write to Supabase, claim a worker row, dispatch a worker, execute a tool, create a signed URL, create a public artifact, or start GPU/runtime resources.

## Source Evidence

- CPU/static live-adapter queue-service proof: `docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof.json`
- Source decision: `ai_graphics_external_agent_cpu_static_private_worker_live_adapter_invocation_queue_write_proof_passed_with_runtime_blocks`
- Builder: `server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.ts`
- CLI: `server/cli/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.ts`

## Preflight Result

- Total AI graphics tools covered: `21`
- CPU/static service-role queue-write smoke preflights ready: `5` tools: `d3`, `vega_lite`, `vega`, `svgdotjs_svg_js`, `viz_js`
- Ready with provided evidence: `5`
- Source live-adapter queue-service proof accepted tools: `5`
- Satori blocked pending approved font fixture: `1`
- Non-CPU/static tools deferred by runtime boundary: `15`
- Service-role queue-write smoke approved now: `0`
- Live queue writes approved now: `0`
- Live queue writes performed now: `0`
- Worker claims performed now: `0`
- Worker dispatches approved now: `0`
- Tool executions approved now: `0`
- GPU runtime starts now: `0`

## Required Future Smoke Environment

- `REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE=true`
- `REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE_ENV=non_production`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `E2E_RUNTIME_MODE=local`
- `WORKER_RUNTIME_MODE=mock`

## Required Future Smoke Flags

- `--execute-ai-graphics-external-agent-cpu-static-service-role-queue-write-smoke`
- `--workspace-id`
- `--project-id`
- `--approved-plan-snapshot-id`
- `--credit-reservation-id`
- `--idempotency-prefix`
- `--source-live-adapter-queue-write-proof-packet`
- `--service-role-boundary-ref`
- `--telemetry-ref`
- `--cleanup-proof-ref`
- `--rollback-ref`

## Per-Tool Preflight Evidence

- `d3`: queue=`ai_graphics_external_agent_cpu_static_private_worker_queue`, sourceProof=`private://ai-graphics/external-agent/cpu-static-private-worker-live-adapter-invocation-queue-write-proof/d3/report.json`, boundary=`service-role-boundary://ai-graphics/external-agent/cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight/d3/non-production-boundary`, telemetry=`private://ai-graphics/external-agent/cpu-static-service-role-queue-write-smoke/d3/telemetry.json`, cleanup=`private://ai-graphics/external-agent/cpu-static-service-role-queue-write-smoke/d3/cleanup.json`
- `vega_lite`: queue=`ai_graphics_external_agent_cpu_static_private_worker_queue`, sourceProof=`private://ai-graphics/external-agent/cpu-static-private-worker-live-adapter-invocation-queue-write-proof/vega_lite/report.json`, boundary=`service-role-boundary://ai-graphics/external-agent/cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight/vega_lite/non-production-boundary`, telemetry=`private://ai-graphics/external-agent/cpu-static-service-role-queue-write-smoke/vega_lite/telemetry.json`, cleanup=`private://ai-graphics/external-agent/cpu-static-service-role-queue-write-smoke/vega_lite/cleanup.json`
- `vega`: queue=`ai_graphics_external_agent_cpu_static_private_worker_queue`, sourceProof=`private://ai-graphics/external-agent/cpu-static-private-worker-live-adapter-invocation-queue-write-proof/vega/report.json`, boundary=`service-role-boundary://ai-graphics/external-agent/cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight/vega/non-production-boundary`, telemetry=`private://ai-graphics/external-agent/cpu-static-service-role-queue-write-smoke/vega/telemetry.json`, cleanup=`private://ai-graphics/external-agent/cpu-static-service-role-queue-write-smoke/vega/cleanup.json`
- `svgdotjs_svg_js`: queue=`ai_graphics_external_agent_cpu_static_private_worker_queue`, sourceProof=`private://ai-graphics/external-agent/cpu-static-private-worker-live-adapter-invocation-queue-write-proof/svgdotjs_svg_js/report.json`, boundary=`service-role-boundary://ai-graphics/external-agent/cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight/svgdotjs_svg_js/non-production-boundary`, telemetry=`private://ai-graphics/external-agent/cpu-static-service-role-queue-write-smoke/svgdotjs_svg_js/telemetry.json`, cleanup=`private://ai-graphics/external-agent/cpu-static-service-role-queue-write-smoke/svgdotjs_svg_js/cleanup.json`
- `viz_js`: queue=`ai_graphics_external_agent_cpu_static_private_worker_queue`, sourceProof=`private://ai-graphics/external-agent/cpu-static-private-worker-live-adapter-invocation-queue-write-proof/viz_js/report.json`, boundary=`service-role-boundary://ai-graphics/external-agent/cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight/viz_js/non-production-boundary`, telemetry=`private://ai-graphics/external-agent/cpu-static-service-role-queue-write-smoke/viz_js/telemetry.json`, cleanup=`private://ai-graphics/external-agent/cpu-static-service-role-queue-write-smoke/viz_js/cleanup.json`

## Tool Rows

| Tool | Runtime target | Preflight status | Preflight ready | Smoke approved now | Live queue write now | Worker dispatch now | Tool execution now | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `torch_torchvision` | `native_linux_amd64_nvidia_l4_gpu_worker` | `non_production_service_role_queue_write_smoke_preflight_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `transformers` | `native_linux_amd64_nvidia_l4_gpu_worker` | `non_production_service_role_queue_write_smoke_preflight_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `sam2` | `native_linux_amd64_nvidia_l4_sam2_runtime` | `non_production_service_role_queue_write_smoke_preflight_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `birefnet` | `native_linux_amd64_nvidia_l4_birefnet_runtime` | `non_production_service_role_queue_write_smoke_preflight_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `real_esrgan` | `native_linux_amd64_nvidia_l4_real_esrgan_runtime` | `non_production_service_role_queue_write_smoke_preflight_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `kornia` | `native_linux_amd64_nvidia_l4_gpu_worker` | `non_production_service_role_queue_write_smoke_preflight_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `rembg` | `native_linux_amd64_nvidia_l4_gpu_worker` | `non_production_service_role_queue_write_smoke_preflight_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `transparent_background` | `native_linux_amd64_nvidia_l4_gpu_worker` | `non_production_service_role_queue_write_smoke_preflight_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `d3` | `node_cpu_static` | `non_production_service_role_queue_write_smoke_preflight_ready_execution_blocked` | `true` | `false` | `false` | `false` | `false` | non-production service-role queue-write smoke preflight is ready; actual smoke, worker claim, worker dispatch, and tool execution remain blocked until a saved smoke result is accepted |
| `echarts` | `browser_chart_runtime_later` | `non_production_service_role_queue_write_smoke_preflight_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `vega_lite` | `node_cpu_static` | `non_production_service_role_queue_write_smoke_preflight_ready_execution_blocked` | `true` | `false` | `false` | `false` | `false` | non-production service-role queue-write smoke preflight is ready; actual smoke, worker claim, worker dispatch, and tool execution remain blocked until a saved smoke result is accepted |
| `vega` | `node_cpu_static` | `non_production_service_role_queue_write_smoke_preflight_ready_execution_blocked` | `true` | `false` | `false` | `false` | `false` | non-production service-role queue-write smoke preflight is ready; actual smoke, worker claim, worker dispatch, and tool execution remain blocked until a saved smoke result is accepted |
| `satori` | `node_cpu_static` | `non_production_service_role_queue_write_smoke_preflight_blocked_pending_satori_font_fixture` | `false` | `false` | `false` | `false` | `false` | blocked pending approved Satori font fixture evidence bridge |
| `svgdotjs_svg_js` | `node_cpu_static` | `non_production_service_role_queue_write_smoke_preflight_ready_execution_blocked` | `true` | `false` | `false` | `false` | `false` | non-production service-role queue-write smoke preflight is ready; actual smoke, worker claim, worker dispatch, and tool execution remain blocked until a saved smoke result is accepted |
| `viz_js` | `node_cpu_static` | `non_production_service_role_queue_write_smoke_preflight_ready_execution_blocked` | `true` | `false` | `false` | `false` | `false` | non-production service-role queue-write smoke preflight is ready; actual smoke, worker claim, worker dispatch, and tool execution remain blocked until a saved smoke result is accepted |
| `lottie_web` | `browser_animation_runtime_later` | `non_production_service_role_queue_write_smoke_preflight_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `animejs` | `browser_animation_runtime_later` | `non_production_service_role_queue_write_smoke_preflight_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `three_js` | `browser_canvas_webgl_runtime_later` | `non_production_service_role_queue_write_smoke_preflight_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `pixi_js` | `browser_canvas_webgl_runtime_later` | `non_production_service_role_queue_write_smoke_preflight_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `konva` | `browser_canvas_webgl_runtime_later` | `non_production_service_role_queue_write_smoke_preflight_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `babylonjs` | `browser_canvas_webgl_runtime_later` | `non_production_service_role_queue_write_smoke_preflight_deferred_non_cpu_static_runtime_boundary` | `false` | `false` | `false` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |

## Future Saved Smoke Result Requirements

- explicit non-production operator confirmation
- server-only Supabase service-role credentials
- exact five CPU/static queue rows written for the accepted private-worker queue payloads
- zero persisted fixture rows after cleanup
- no worker dispatch, tool execution, provider/model execution, browser/WebGL/canvas runtime, GPU runtime, signed URL, or public artifact
- saved private evidence, telemetry, cleanup, and rollback refs

## Runtime Boundary

- `agentCanSelectForPlanning=true`
- `externalAgentCanInvokeAdapterNow=false`
- `externalAgentCanSubmitPrivateWorkerQueueNow=false`
- `agentCanExecuteToolsNow=false`
- `routeExecutionApprovedNow=false`
- `backendQueueSubmissionApprovedNow=false`
- `serviceRoleQueueWriteSmokeApprovedNow=false`
- `liveQueueWriteApprovedNow=false`
- `workerClaimApprovedNow=false`
- `workerDispatchApprovedNow=false`
- `workerExecutionApprovedNow=false`
- `toolExecutionApprovedNow=false`
- `providerRuntimeApprovedNow=false`
- `browserWebglCanvasRuntimeApprovedNow=false`
- `gpuRuntimeApprovedNow=false`
- `gpuRuntimeShouldStartNow=false`
- `runtimeReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

No dependency install, package-lock mutation, service-role queue-write smoke, backend queue submission, live queue write, worker enqueue, worker claim, worker dispatch, tool execution, route execution, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, model download/load, media processing, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is approved by this packet.

## Next Milestone

`AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PROOF`
