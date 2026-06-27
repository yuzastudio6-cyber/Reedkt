# AI Graphics External Beta Service-Role Queue Smoke Readiness

Decision: `ai_graphics_external_beta_service_role_queue_smoke_readiness_prepared_with_runtime_blocks`

This packet defines the next external-beta step after the runtime queue service bridge: a guarded, non-production service-role queue/claim smoke. It is a readiness contract only. It does not perform a live Supabase write, worker claim, worker lease, dispatch, tool execution, GPU startup, signed URL creation, public artifact creation, beta unlock, or production unlock.

## External-Beta Result

- Tools covered: 21
- Product-facing capabilities covered: 12
- GPU/model tools covered: 8
- Service-role queue smoke readiness records prepared with provided evidence: 21
- Canonical runtime queue service validation accepted: 21
- Heavy/model tools incorrectly targeting CPU: 0
- Live service-role queue smoke executions now: 0
- Live Supabase queue writes now: 0
- Live worker claim rows now: 0
- Worker leases created now: 0
- Worker dispatches now: 0
- Tool executions now: 0
- External beta ready now: 0
- Production ready now: 0

## Required Non-Production Controls

The later live smoke must be explicitly environment-scoped and reversible. Required controls are:

1. Accepted external-beta runtime queue service bridge packet.
2. External beta service-role queue smoke reference.
3. Non-production external-beta environment reference.
4. Owner approval reference for live queue/claim smoke.
5. Rollback reference.
6. Cleanup reference.
7. Telemetry reference.

Required server-only environment values for that later smoke are:

- `REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE=true`
- `REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_ENV=non_production`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `E2E_RUNTIME_MODE=local`
- `WORKER_RUNTIME_MODE=mock`

Service-role credentials must remain server-only. The smoke uses the runtime queue service RPC boundary names `enqueue_ai_graphics_tool_runtime_jobs`, `claim_ai_graphics_tool_runtime_job`, `record_ai_graphics_worker_event`, and `record_ai_graphics_audit_event`.

## GPU Cost Boundary

GPU remains on-demand only. The eight GPU/model tools can carry `gpuRuntimeStartAllowedForAcceptedExternalBetaJob=true` for future accepted worker/tool-call jobs, but `gpuRuntimeShouldStartNow=false`, `gpuRuntimePerformed=false`, `workerLeaseCreated=false`, and `workerDispatchPerformed=false` remain enforced. No idle GPU runtime is approved.

## Runtime Buckets

- `planning_metadata_allowed_now`
- `cpu_static_execution_previously_validated_but_not_agent_executable_now`
- `browser_chart_runtime_later`
- `animation_runtime_later`
- `browser_canvas_webgl_runtime_later`
- `model_cpu_gpu_runtime_later`
- `tool_route_handoff_later`
- `worker_handoff_later`
- `public_artifact_and_signed_url_later`

## Current Block

External beta remains blocked until a separate explicitly confirmed service-role queue write and worker-claim smoke runs in a non-production external-beta environment, proves cleanup, and records telemetry. That later smoke must still keep tool execution, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, media processing, signed URLs, public artifacts, beta unlock, and production unlock gated until separately approved.
