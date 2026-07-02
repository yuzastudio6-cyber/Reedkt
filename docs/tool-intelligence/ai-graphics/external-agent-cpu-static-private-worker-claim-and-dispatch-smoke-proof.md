# AI Graphics External Agent CPU Static Private Worker Claim And Dispatch Smoke Proof

Decision: `ai_graphics_external_agent_cpu_static_private_worker_claim_and_dispatch_smoke_proof_validator_prepared_with_runtime_blocks`

Status: `blocked_pending_source_non_production_service_role_queue_write_smoke_proof`

This packet validates a saved non-production worker claim and dispatch handoff smoke result for the five CPU/static external-agent private-worker tools. The validator does not run the smoke, mutate Supabase, claim workers, dispatch workers, execute workers, execute tools, start GPU runtime, create signed URLs, or create public artifacts.

## Source Evidence

- Source queue-write smoke proof packet: `docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.json`
- Source exact execution admission packet: `docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-exact-execution-admission.json`
- Source queue-write smoke proof decision: `ai_graphics_external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_proof_validator_prepared_with_runtime_blocks`
- Source exact execution admission decision: `ai_graphics_external_agent_cpu_static_private_worker_exact_execution_admission_prepared_with_runtime_blocks`
- Builder: `server/tool-registry/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.ts`
- CLI: `server/cli/ai-graphics-external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof.ts`

## Proof State

- Source queue-write smoke proof accepted tools: `0`
- Saved worker claim and dispatch smoke accepted tools with provided evidence: `0`
- Exact request lineages preserved with provided evidence: `0`
- Saved worker claim and dispatch smoke rejected tools: `0`
- Queue rows read accepted with provided evidence: `0`
- Worker claims accepted with provided evidence: `0`
- Worker dispatch handoffs accepted with provided evidence: `0`
- Worker dispatch leases released with provided evidence: `0`
- Queue rows persisted after cleanup: `0`
- Worker executions performed now: `0`
- Tool executions performed now: `0`
- External-agent executable now tools: `0`
- GPU runtime starts now: `0`

## Operator Runner

- Operator preflight command: `npm run ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke -- --operator-preflight --source-service-role-queue-write-smoke-proof-packet docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.json --source-exact-execution-admission-packet docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-exact-execution-admission.json`
- Runner command: `npm run ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke -- --execute-ai-graphics-external-agent-cpu-static-worker-claim-and-dispatch-smoke --source-service-role-queue-write-smoke-proof-packet docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-proof.json --source-exact-execution-admission-packet docs/tool-intelligence/ai-graphics/external-agent-cpu-static-private-worker-exact-execution-admission.json --workspace-id <non-production-workspace-id> --project-id <non-production-project-id> --approved-plan-snapshot-id <approved-plan-snapshot-id> --credit-reservation-id <credit-reservation-id> --idempotency-prefix <unique-smoke-prefix> --service-role-boundary-ref <service-role-boundary-ref> --private-evidence-ref <private-evidence-ref> --telemetry-ref <telemetry-ref> --lease-audit-ref <lease-audit-ref> --cleanup-proof-ref <cleanup-proof-ref> --rollback-ref <rollback-ref> --output-result .local-artifacts/ai-graphics/external-agent/cpu-static-private-worker/claim-and-dispatch-smoke-result.json`
- Local-only suggested result path: `.local-artifacts/ai-graphics/external-agent/cpu-static-private-worker/claim-and-dispatch-smoke-result.json`
- Validator command: `npm run ai-graphics:external-agent-cpu-static-private-worker-claim-and-dispatch-smoke-proof -- --external-agent-cpu-static-worker-claim-and-dispatch-smoke-result <local-result.json> --print-only`
- Can be used as accepted result without live smoke: `false`
- Required environment: `REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_WORKER_CLAIM_AND_DISPATCH_SMOKE=true, REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_WORKER_CLAIM_AND_DISPATCH_SMOKE_ENV=non_production, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, E2E_RUNTIME_MODE=local, WORKER_RUNTIME_MODE=mock`

## Rejection Reasons

- source non-production service-role queue-write smoke proof is missing or not accepted
- saved worker claim and dispatch smoke result is missing

## Tool Rows

| Tool | Runtime target | Proof status | Accepted evidence | Worker claims | Dispatch handoffs | Leases released | Tool execution now | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `torch_torchvision` | `native_linux_amd64_nvidia_l4_gpu_worker` | `blocked_pending_source_non_production_service_role_queue_write_smoke_proof` | `false` | `0` | `0` | `0` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `transformers` | `native_linux_amd64_nvidia_l4_gpu_worker` | `blocked_pending_source_non_production_service_role_queue_write_smoke_proof` | `false` | `0` | `0` | `0` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `sam2` | `native_linux_amd64_nvidia_l4_sam2_runtime` | `blocked_pending_source_non_production_service_role_queue_write_smoke_proof` | `false` | `0` | `0` | `0` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `birefnet` | `native_linux_amd64_nvidia_l4_birefnet_runtime` | `blocked_pending_source_non_production_service_role_queue_write_smoke_proof` | `false` | `0` | `0` | `0` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `real_esrgan` | `native_linux_amd64_nvidia_l4_real_esrgan_runtime` | `blocked_pending_source_non_production_service_role_queue_write_smoke_proof` | `false` | `0` | `0` | `0` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `kornia` | `native_linux_amd64_nvidia_l4_gpu_worker` | `blocked_pending_source_non_production_service_role_queue_write_smoke_proof` | `false` | `0` | `0` | `0` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `rembg` | `native_linux_amd64_nvidia_l4_gpu_worker` | `blocked_pending_source_non_production_service_role_queue_write_smoke_proof` | `false` | `0` | `0` | `0` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `transparent_background` | `native_linux_amd64_nvidia_l4_gpu_worker` | `blocked_pending_source_non_production_service_role_queue_write_smoke_proof` | `false` | `0` | `0` | `0` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `d3` | `node_cpu_static` | `blocked_pending_source_non_production_service_role_queue_write_smoke_proof` | `false` | `0` | `0` | `0` | `false` | waiting for saved worker claim and dispatch smoke result with lease release and cleanup proof |
| `echarts` | `browser_chart_runtime_later` | `blocked_pending_source_non_production_service_role_queue_write_smoke_proof` | `false` | `0` | `0` | `0` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `vega_lite` | `node_cpu_static` | `blocked_pending_source_non_production_service_role_queue_write_smoke_proof` | `false` | `0` | `0` | `0` | `false` | waiting for saved worker claim and dispatch smoke result with lease release and cleanup proof |
| `vega` | `node_cpu_static` | `blocked_pending_source_non_production_service_role_queue_write_smoke_proof` | `false` | `0` | `0` | `0` | `false` | waiting for saved worker claim and dispatch smoke result with lease release and cleanup proof |
| `satori` | `node_cpu_static` | `blocked_pending_source_non_production_service_role_queue_write_smoke_proof` | `false` | `0` | `0` | `0` | `false` | blocked pending approved Satori font fixture proof before worker claim and dispatch smoke proof |
| `svgdotjs_svg_js` | `node_cpu_static` | `blocked_pending_source_non_production_service_role_queue_write_smoke_proof` | `false` | `0` | `0` | `0` | `false` | waiting for saved worker claim and dispatch smoke result with lease release and cleanup proof |
| `viz_js` | `node_cpu_static` | `blocked_pending_source_non_production_service_role_queue_write_smoke_proof` | `false` | `0` | `0` | `0` | `false` | waiting for saved worker claim and dispatch smoke result with lease release and cleanup proof |
| `lottie_web` | `browser_animation_runtime_later` | `blocked_pending_source_non_production_service_role_queue_write_smoke_proof` | `false` | `0` | `0` | `0` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `animejs` | `browser_animation_runtime_later` | `blocked_pending_source_non_production_service_role_queue_write_smoke_proof` | `false` | `0` | `0` | `0` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `three_js` | `browser_canvas_webgl_runtime_later` | `blocked_pending_source_non_production_service_role_queue_write_smoke_proof` | `false` | `0` | `0` | `0` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `pixi_js` | `browser_canvas_webgl_runtime_later` | `blocked_pending_source_non_production_service_role_queue_write_smoke_proof` | `false` | `0` | `0` | `0` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `konva` | `browser_canvas_webgl_runtime_later` | `blocked_pending_source_non_production_service_role_queue_write_smoke_proof` | `false` | `0` | `0` | `0` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |
| `babylonjs` | `browser_canvas_webgl_runtime_later` | `blocked_pending_source_non_production_service_role_queue_write_smoke_proof` | `false` | `0` | `0` | `0` | `false` | deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes |

## Runtime Boundary

- `agentCanSelectForPlanning=true`
- `externalAgentCanInvokeAdapterNow=false`
- `externalAgentCanSubmitPrivateWorkerQueueNow=false`
- `agentCanExecuteToolsNow=false`
- `routeExecutionApprovedNow=false`
- `backendQueueSubmissionApprovedNow=false`
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

No dependency install, package-lock mutation, worker claim/dispatch smoke by this validator, backend queue submission, worker enqueue, live worker claim by this validator, live worker dispatch by this validator, worker execution, tool execution, route execution, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, model download/load, media processing, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is approved.

## Next Milestone

`AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CLAIM_AND_DISPATCH_SMOKE_PROOF`
