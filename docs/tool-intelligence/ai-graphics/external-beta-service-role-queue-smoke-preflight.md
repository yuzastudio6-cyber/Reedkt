# AI Graphics External Beta Service-Role Queue Smoke Preflight

Decision: `ai_graphics_external_beta_service_role_queue_smoke_preflight_prepared_with_environment_blocks`

This is a side-effect-free preflight for the external-beta service-role queue smoke. It checks whether the current server environment and required command flags are ready to attempt the live non-production queue/claim smoke. It also validates that all 21 AI graphics tool job payload previews can be built before any Supabase write is attempted.

The preflight does not write to Supabase, enqueue jobs, claim jobs, dispatch workers, execute tools, call providers/models, start GPU runtime, create artifacts, unlock external beta, or unlock production.

## Command

```bash
npm run --silent ai-graphics:external-beta-service-role-queue-smoke-preflight -- \
  --workspace-id <non-production-workspace-id> \
  --project-id <non-production-project-id> \
  --approved-plan-snapshot-id <approved-plan-snapshot-id> \
  --credit-reservation-id <credit-reservation-id> \
  --idempotency-prefix <unique-smoke-prefix> \
  --service-role-queue-smoke-readiness-ref <readiness-ref> \
  --runtime-queue-service-proof-bridge-ref <bridge-ref> \
  --source-runtime-queue-service-proof-bridge-accepted
```

For a ready preflight, the server environment must also provide:

- `REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE=true`
- `REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_ENV=non_production`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `E2E_RUNTIME_MODE=local`
- `WORKER_RUNTIME_MODE=mock`

Secret values are reported only as present/missing and are always redacted from output.

## Acceptance

- Tools covered: 21
- Product-facing capabilities covered: 12
- GPU/model tools targeted for GPU runtime: 8
- Heavy tools incorrectly targeting CPU: 0
- Payload previews prepared: 21
- Runtime queue service proof bridge required: true
- Service-role credentials remain server-only: true
- GPU runtime policy remains on-demand only: true
- GPU runtime starts now: false
- Live queue writes now: 0
- Worker dispatches now: 0
- Tool executions now: 0
- External beta ready now: 0
- Production ready now: 0

## Current Local State

In a normal developer shell without non-production service-role credentials, this preflight should return `missing_required_environment_or_flags`. That is expected. The result is still useful because it proves the 21 payload previews are ready and lists exactly which env vars or flags must be supplied before the guarded live smoke can be run.

## Next Gate

After the preflight is ready, run the guarded non-production smoke with `ai-graphics:external-beta-service-role-queue-smoke`. Save its sanitized result and validate it with `ai-graphics:external-beta-service-role-queue-smoke-proof`. Only that future proof can move the queue/claim path beyond preflight.
