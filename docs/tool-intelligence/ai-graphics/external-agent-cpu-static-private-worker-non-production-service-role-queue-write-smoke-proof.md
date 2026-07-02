# AI Graphics External Agent CPU Static Private Worker Non-Production Service-Role Queue-Write Smoke Proof

Decision: `ai_graphics_external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_proof_validator_prepared_with_runtime_blocks`

Status: `blocked_pending_saved_non_production_service_role_queue_write_smoke_result`

This packet validates a saved non-production service-role queue-write smoke result for the five CPU/static external-agent private-worker tools. The validator does not run the smoke, write to Supabase, claim or dispatch workers, execute tools, start GPU runtime, create signed URLs, or create public artifacts.

## Source Evidence

- Source preflight packet: `docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.json`
- Source preflight decision: `ai_graphics_external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_preflight_prepared_with_runtime_blocks`
- Builder: `server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.ts`
- CLI: `server/cli/ai-graphics-external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.ts`

## Proof State

- Source preflight ready tools: `5`
- Saved smoke result accepted tools with provided evidence: `0`
- Saved smoke result rejected tools: `0`
- Service-role queue writes accepted with provided evidence: `0`
- Queue rows persisted after cleanup: `0`
- Worker claims created now: `0`
- Worker dispatches performed now: `0`
- Tool executions performed now: `0`
- External-agent executable now tools: `0`
- GPU runtime starts now: `0`

## Rejection Reasons

- saved non-production service-role queue-write smoke result is missing

## Operator Result Template

- Template mode: `operator_must_execute_non_production_queue_write_then_fill_saved_result`
- Source preflight accepted: `true`
- Tools submitted: `5`
- Expected queue rows written: `5`
- Expected queue rows cleaned up: `5`
- Expected queue rows persisted after cleanup: `0`
- Local-only suggested result path: `.local-artifacts/ai-graphics/external-agent/cpu-static-private-worker/non-production-service-role-queue-write-smoke-result.json`
- Operator preflight command: `npm run ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke -- --operator-preflight --execute-ai-graphics-external-agent-cpu-static-service-role-queue-write-smoke --source-non-production-service-role-queue-write-smoke-preflight-packet docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.json --workspace-id <non-production-workspace-id> --project-id <non-production-project-id> --approved-plan-snapshot-id <approved-plan-snapshot-id> --credit-reservation-id <credit-reservation-id> --idempotency-prefix <unique-smoke-prefix> --service-role-boundary-ref <service-role-boundary-ref> --private-evidence-ref <private-evidence-ref> --telemetry-ref <telemetry-ref> --cleanup-proof-ref <cleanup-proof-ref> --rollback-ref <rollback-ref> --output-result .local-artifacts/ai-graphics/external-agent/cpu-static-private-worker/non-production-service-role-queue-write-smoke-result.json`
- Runner command: `npm run ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke -- --execute-ai-graphics-external-agent-cpu-static-service-role-queue-write-smoke --source-non-production-service-role-queue-write-smoke-preflight-packet docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight.json --workspace-id <non-production-workspace-id> --project-id <non-production-project-id> --approved-plan-snapshot-id <approved-plan-snapshot-id> --credit-reservation-id <credit-reservation-id> --idempotency-prefix <unique-smoke-prefix> --service-role-boundary-ref <service-role-boundary-ref> --private-evidence-ref <private-evidence-ref> --telemetry-ref <telemetry-ref> --cleanup-proof-ref <cleanup-proof-ref> --rollback-ref <rollback-ref> --output-result .local-artifacts/ai-graphics/external-agent/cpu-static-private-worker/non-production-service-role-queue-write-smoke-result.json`
- Validator command: `npm run ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof -- --external-agent-cpu-static-service-role-queue-write-smoke-result <local-result.json> --print-only`
- Can be used as accepted result without live smoke: `false`

| Tool | Production tool | Runtime target | Source enqueue payload | Backend queue adapter | Private manifest |
| --- | --- | --- | --- | --- | --- |
| `d3` | `d3` | `node_cpu_static` | `worker-enqueue-payload://ai-graphics/external-agent/cpu-static-private-worker-adapter-invocation-enqueue-admission/d3/payload` | `backend-queue-adapter://ai-graphics/external-agent/cpu-static-private-worker-adapter-invocation-enqueue-admission/d3/adapter` | `private://ai-graphics/external-agent/cpu-static-private-worker-handoff-admission/d3/artifact-manifest` |
| `vega_lite` | `vega_lite` | `node_cpu_static` | `worker-enqueue-payload://ai-graphics/external-agent/cpu-static-private-worker-adapter-invocation-enqueue-admission/vega_lite/payload` | `backend-queue-adapter://ai-graphics/external-agent/cpu-static-private-worker-adapter-invocation-enqueue-admission/vega_lite/adapter` | `private://ai-graphics/external-agent/cpu-static-private-worker-handoff-admission/vega_lite/artifact-manifest` |
| `vega` | `vega` | `node_cpu_static` | `worker-enqueue-payload://ai-graphics/external-agent/cpu-static-private-worker-adapter-invocation-enqueue-admission/vega/payload` | `backend-queue-adapter://ai-graphics/external-agent/cpu-static-private-worker-adapter-invocation-enqueue-admission/vega/adapter` | `private://ai-graphics/external-agent/cpu-static-private-worker-handoff-admission/vega/artifact-manifest` |
| `svgdotjs_svg_js` | `svgdotjs_svg_js` | `node_cpu_static` | `worker-enqueue-payload://ai-graphics/external-agent/cpu-static-private-worker-adapter-invocation-enqueue-admission/svgdotjs_svg_js/payload` | `backend-queue-adapter://ai-graphics/external-agent/cpu-static-private-worker-adapter-invocation-enqueue-admission/svgdotjs_svg_js/adapter` | `private://ai-graphics/external-agent/cpu-static-private-worker-handoff-admission/svgdotjs_svg_js/artifact-manifest` |
| `viz_js` | `viz_js` | `node_cpu_static` | `worker-enqueue-payload://ai-graphics/external-agent/cpu-static-private-worker-adapter-invocation-enqueue-admission/viz_js/payload` | `backend-queue-adapter://ai-graphics/external-agent/cpu-static-private-worker-adapter-invocation-enqueue-admission/viz_js/adapter` | `private://ai-graphics/external-agent/cpu-static-private-worker-handoff-admission/viz_js/artifact-manifest` |

Required saved-result fields:

- `ok`
- `decision`
- `status`
- `queueName`
- `toolsSubmitted`
- `toolsSubmittedIds`
- `queueRowsWritten`
- `queueRowsCleanedUp`
- `queueRowsPersistedAfterCleanup`
- `workerClaimsCreated`
- `workerDispatchesPerformed`
- `workerExecutionsPerformed`
- `toolExecutionsPerformed`
- `serviceRoleBoundaryRef`
- `privateEvidenceRef`
- `telemetryRef`
- `cleanupProofRef`
- `rollbackRef`
- `sourcePreflightDecision`
- `sourcePreflightAccepted`
- `liveServiceRoleQueueWriteSmokeExecutedNow`
- `liveSupabaseQueueWritesNow`
- `publicArtifactCreated`
- `signedUrlCreated`
- `gpuRuntimeShouldStartNow`
- `externalAgentExecutableNowTools`
- `runtimeReadyNow`
- `externalBetaReadyNow`
- `productionReadyNow`

## Tool Rows

| Tool | Runtime target | Proof status | Accepted evidence | Queue rows | Persisted after cleanup | Worker dispatch now | Tool execution now | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `torch_torchvision` | `native_linux_amd64_nvidia_l4_gpu_worker` | `blocked_pending_source_non_production_service_role_queue_write_smoke_preflight` | `false` | `0` | `0` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `transformers` | `native_linux_amd64_nvidia_l4_gpu_worker` | `blocked_pending_source_non_production_service_role_queue_write_smoke_preflight` | `false` | `0` | `0` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `sam2` | `native_linux_amd64_nvidia_l4_sam2_runtime` | `blocked_pending_source_non_production_service_role_queue_write_smoke_preflight` | `false` | `0` | `0` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `birefnet` | `native_linux_amd64_nvidia_l4_birefnet_runtime` | `blocked_pending_source_non_production_service_role_queue_write_smoke_preflight` | `false` | `0` | `0` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `real_esrgan` | `native_linux_amd64_nvidia_l4_real_esrgan_runtime` | `blocked_pending_source_non_production_service_role_queue_write_smoke_preflight` | `false` | `0` | `0` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `kornia` | `native_linux_amd64_nvidia_l4_gpu_worker` | `blocked_pending_source_non_production_service_role_queue_write_smoke_preflight` | `false` | `0` | `0` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `rembg` | `native_linux_amd64_nvidia_l4_gpu_worker` | `blocked_pending_source_non_production_service_role_queue_write_smoke_preflight` | `false` | `0` | `0` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `transparent_background` | `native_linux_amd64_nvidia_l4_gpu_worker` | `blocked_pending_source_non_production_service_role_queue_write_smoke_preflight` | `false` | `0` | `0` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `d3` | `node_cpu_static` | `blocked_pending_saved_non_production_service_role_queue_write_smoke_result` | `false` | `0` | `0` | `false` | `false` | waiting for saved non-production service-role queue-write smoke result with cleanup proof |
| `echarts` | `browser_chart_runtime_later` | `blocked_pending_source_non_production_service_role_queue_write_smoke_preflight` | `false` | `0` | `0` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `vega_lite` | `node_cpu_static` | `blocked_pending_saved_non_production_service_role_queue_write_smoke_result` | `false` | `0` | `0` | `false` | `false` | waiting for saved non-production service-role queue-write smoke result with cleanup proof |
| `vega` | `node_cpu_static` | `blocked_pending_saved_non_production_service_role_queue_write_smoke_result` | `false` | `0` | `0` | `false` | `false` | waiting for saved non-production service-role queue-write smoke result with cleanup proof |
| `satori` | `node_cpu_static` | `blocked_pending_source_non_production_service_role_queue_write_smoke_preflight` | `false` | `0` | `0` | `false` | `false` | blocked pending approved Satori font fixture proof before CPU/static service-role smoke proof |
| `svgdotjs_svg_js` | `node_cpu_static` | `blocked_pending_saved_non_production_service_role_queue_write_smoke_result` | `false` | `0` | `0` | `false` | `false` | waiting for saved non-production service-role queue-write smoke result with cleanup proof |
| `viz_js` | `node_cpu_static` | `blocked_pending_saved_non_production_service_role_queue_write_smoke_result` | `false` | `0` | `0` | `false` | `false` | waiting for saved non-production service-role queue-write smoke result with cleanup proof |
| `lottie_web` | `browser_animation_runtime_later` | `blocked_pending_source_non_production_service_role_queue_write_smoke_preflight` | `false` | `0` | `0` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `animejs` | `browser_animation_runtime_later` | `blocked_pending_source_non_production_service_role_queue_write_smoke_preflight` | `false` | `0` | `0` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `three_js` | `browser_canvas_webgl_runtime_later` | `blocked_pending_source_non_production_service_role_queue_write_smoke_preflight` | `false` | `0` | `0` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `pixi_js` | `browser_canvas_webgl_runtime_later` | `blocked_pending_source_non_production_service_role_queue_write_smoke_preflight` | `false` | `0` | `0` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `konva` | `browser_canvas_webgl_runtime_later` | `blocked_pending_source_non_production_service_role_queue_write_smoke_preflight` | `false` | `0` | `0` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `babylonjs` | `browser_canvas_webgl_runtime_later` | `blocked_pending_source_non_production_service_role_queue_write_smoke_preflight` | `false` | `0` | `0` | `false` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |

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

No dependency install, package-lock mutation, service-role queue write by this validator, backend queue submission by this validator, worker enqueue, worker claim, worker dispatch, tool execution, route execution, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, model download/load, media processing, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is approved.

## Next Milestone

`AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PROOF`
