# Worker Runtime Service-Role Boundary

Status: `ready_with_warnings_for_worker_1`.

The worker runtime source includes server admin-client paths. WORKER-0 records the boundary but does not approve service-role use.

## Server-Only Surfaces

- `server/services/worker-claim-service.ts` uses `context.clients.admin` for `worker_job_claims` and `tool_runtime_checks`.
- `server/workers/worker-job-loader.ts` uses `context.clients.admin` to read `jobs`.
- `server/workers/worker-events.ts` uses `context.clients.admin` to insert `job_events`.
- `server/routes/worker-routes.ts` obtains the service context through route helpers and must remain backend-only.

## Boundary Rules

- Service-role material must never be browser-visible.
- Worker routes must not be treated as product-runtime enabled by WORKER-0.
- Supabase mutation remains `docs/status only` and `docs_only`.
- Supabase environment touched: `none`.
- SQL executed: `none`.
- Migration deployed: `no`.
- Any future Supabase-backed worker path requires a separate approved prompt and accepted evidence.

## Approval Booleans

```json
{
  "supabaseMutationApproved": false,
  "workerExecutionApproved": false,
  "routeExecutionApproved": false,
  "internalBetaApproved": false,
  "productionApproved": false
}
```
