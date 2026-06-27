# AI Graphics External Beta Runtime Queue Service Bridge

Decision: `ai_graphics_external_beta_runtime_queue_service_bridge_prepared_with_runtime_blocks`

This bridge connects the external-beta local queue storage proof to ReeditPro's existing `createAiGraphicsToolRuntimeQueueService` boundary. That matters because this service owns the production service-role RPC names:

- `enqueue_ai_graphics_tool_runtime_jobs`
- `claim_ai_graphics_tool_runtime_job`
- `record_ai_graphics_worker_event`
- `record_ai_graphics_audit_event`

The bridge runs in forced mock mode. It validates that all 21 AI graphics tools can be shaped as canonical `ai_graphics_tool_runtime` queue payloads through the real runtime queue service without writing to Supabase, claiming a worker, creating a lease, dispatching a worker, executing a tool, or starting GPU runtime.

## External-Beta Result

- Tools covered: 21
- Product-facing capabilities covered: 12
- GPU/model tools covered: 8
- Canonical runtime queue service validations: 21
- Heavy/model tools incorrectly targeting CPU: 0
- Live Supabase queue writes now: 0
- Live worker claim rows now: 0
- Worker leases created now: 0
- Worker dispatches now: 0
- Tool executions now: 0
- External beta ready now: 0
- Production ready now: 0

## GPU Cost Boundary

GPU remains on-demand only. The eight GPU/model tools can carry `gpuRuntimeStartAllowedForAcceptedExternalBetaJob=true` for future accepted worker/tool-call jobs, but `gpuRuntimeShouldStartNow=false`, `gpuRuntimePerformed=false`, `workerLeaseCreated=false`, and `workerDispatchPerformed=false` remain enforced. No idle GPU runtime is approved.

## Runtime Queue Service Controls

The bridge requires:

1. Accepted source external-beta local queue storage packet.
2. External-beta runtime queue service reference.
3. Runtime queue RPC schema reference.
4. Worker claim readiness reference.
5. Queue telemetry reference.

Without those controls, the bridge remains blocked. With those controls, it produces mock-only runtime queue service records and still does not approve live queue writes.

## Current Block

External beta remains blocked until a separate environment-scoped service-role queue write and worker-claim smoke proves the live path in a non-production external-beta environment. That later proof must still keep actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, media processing, public artifacts, signed URLs, beta unlock, and production unlock gated until separately approved.
