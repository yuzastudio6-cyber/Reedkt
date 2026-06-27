# AI Graphics External Beta Service-Role Queue Smoke Harness

Decision: `ai_graphics_external_beta_service_role_queue_smoke_harness_prepared_with_runtime_blocks`

This harness is the future-runnable external-beta service-role queue/claim smoke for all 21 AI graphics tools. The committed default is `external_beta_service_role_queue_smoke_prepared_not_executed`; it does not write to Supabase, claim workers, dispatch workers, execute tools, start GPU runtime, create artifacts, unlock external beta, or unlock production.

## Future Live Command Shape

```bash
SUPABASE_URL=<non-production-url> \
SUPABASE_SERVICE_ROLE_KEY=<server-only-service-role-key> \
E2E_RUNTIME_MODE=local \
WORKER_RUNTIME_MODE=mock \
REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE=true \
REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_ENV=non_production \
npm run --silent ai-graphics:external-beta-service-role-queue-smoke -- \
  --execute-external-beta-service-role-queue-smoke \
  --workspace-id <workspace-id> \
  --project-id <project-id> \
  --approved-plan-snapshot-id <approved-plan-snapshot-id> \
  --credit-reservation-id <credit-reservation-id> \
  --idempotency-prefix ai-graphics-external-beta-service-role-queue-smoke
```

Do not use production credentials. Service-role credentials stay server-only.

## What The Live Smoke Will Prove

The later live smoke will submit all 21 canonical `ai_graphics_tool_runtime` jobs through `enqueue_ai_graphics_tool_runtime_jobs`, claim returned jobs through `claim_ai_graphics_tool_runtime_job`, record worker-event and audit-event smoke rows, and clean up smoke-created job events, worker claims, jobs, job batch, and audit rows. The server queue service uses the current Supabase JavaScript RPC shape `supabase.rpc(fn, args)`.

## Current Result

- Tools covered: 21
- Product-facing capabilities covered: 12
- GPU/model tools covered: 8
- Heavy/model tools incorrectly targeting CPU: 0
- Live service-role queue smoke executions now: 0
- Live Supabase queue writes now: 0
- Live worker claim rows now: 0
- Worker dispatches now: 0
- Tool executions now: 0
- GPU runtime starts now: 0
- External beta ready now: 0
- Production ready now: 0

## GPU Cost Boundary

GPU remains on-demand only. The eight GPU/model tools are targeted to future GPU worker runtimes, but `gpuRuntimeShouldStartNow=false` and `gpuRuntimePerformed=false` remain enforced by the default harness and diagnostics. GPU should only start in a later accepted worker/tool-call job path.

## Current Block

External beta remains blocked until the harness is run in non-production, cleanup is verified, telemetry is recorded, and the proof is attached to the external-beta readiness chain. Passing this smoke still will not approve worker dispatch or tool execution by itself.
