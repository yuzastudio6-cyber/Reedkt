# AI Graphics External-Beta API Route Queue Smoke Proof

Decision: `ai_graphics_external_beta_api_route_queue_smoke_proof_prepared_with_runtime_blocks`

This packet validates a saved private non-production API-route-to-queue smoke result. It accepts one authorized route-to-queue smoke result only when the saved evidence matches the accepted authorization candidate on route, queue, tool, capability, approved snapshot, credit reservation, idempotency key, runtime target, and worker type.

The validator itself does not mount or execute an API route, write queue rows, run a service-role transaction, enqueue or dispatch workers, execute tools, start browser/WebGL/canvas runtime, start GPU runtime, download model weights, process media, create signed URLs, create public artifacts, unlock external beta traffic, or unlock production.

## Accepted Scope

- All 21 AI graphics tools remain covered by the source lane.
- All 12 product-facing capabilities remain covered by the source lane.
- The saved route-to-queue smoke result covers one authorized request at a time.
- CPU tools such as `d3` keep `gpuRuntimeStartAllowedForAcceptedExternalBetaJob=false`.
- GPU/model tools such as `sam2` may preserve `gpuRuntimeStartAllowedForAcceptedExternalBetaJob=true`, but `gpuRuntimeShouldStartNow=false` remains enforced.

## Required Saved Evidence

- Accepted `external-beta-api-route-queue-smoke-authorization` packet.
- Accepted source service-role queue smoke preflight evidence carried by the authorization packet.
- Private non-production saved smoke result.
- Private evidence, telemetry, and cleanup proof refs.
- Exactly one API route invocation represented in the saved result.
- Exactly one queue row inserted during the saved smoke.
- Zero queue rows persisted after cleanup.
- Zero worker claims, worker dispatches, and tool executions.
- No public artifact or signed URL.

## Runtime Blocks

- API route queue smoke execution by this validator
- Mounted API route creation
- API route execution by this validator
- Live queue write by this validator
- Backend queue submission
- Service-role transaction by this validator
- Worker claim row insert by this validator
- Worker lease creation
- Worker dispatch
- Tool execution
- Tool Route execution
- Provider/model execution
- Browser/WebGL/canvas runtime execution
- GPU/model runtime execution now
- Idle or always-on GPU runtime
- Model weight download or load
- Media processing
- Supabase/GCS mutation by this validator
- Signed URL creation
- Public artifact creation
- External beta traffic enablement
- Production unlock

## Booleans

- `agentCanSelectForPlanning=true`
- `agentCanExecuteToolsNow=false`
- `apiRouteQueueSmokeApprovedNow=false`
- `apiRouteExecutionApprovedNow=false`
- `liveQueueWriteApprovedNow=false`
- `workerDispatchApprovedNow=false`
- `toolExecutionApprovedNow=false`
- `gpuRuntimeApprovedNow=false`
- `gpuRuntimeShouldStartNow=false`
- `runtimeReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

Next gap: use this saved proof as input to a private worker lease and dispatch proof. GPU stays cold until an accepted worker/tool job actually needs it.
