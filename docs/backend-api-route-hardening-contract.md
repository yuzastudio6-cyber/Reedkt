# Backend API Route Hardening Contract

Every backend route should be documented or reported with these fields:

| Field | Meaning |
| --- | --- |
| `routeId` | Stable route identifier. |
| `method` | HTTP method or metadata method. |
| `path` | Public route path. |
| `routeGroup` | Functional group such as `auth`, `storage`, `snapshots`, `credits`, `jobs`, `workers`, `providers`, or `render`. |
| `status` | `implemented`, `mock_only`, `backend_required`, `blocked`, or `future`. |
| `authRequired` | Whether an authenticated user is required. |
| `workspaceRequired` | Whether workspace scope is required. |
| `projectRequired` | Whether project scope is required. |
| `idempotencyRequired` | Whether `Idempotency-Key` is required. |
| `serviceRoleRequired` | Whether a future service-role runtime is required. |
| `allowedCaller` | Frontend, backend service, worker, webhook, or admin-only boundary. |
| `inputSchema` | Request validation schema name or summary. |
| `outputSchema` | Response schema name or summary. |
| `tablesTouched` | Canonical tables read/written, if any. |
| `forbiddenSideEffects` | Work the route must not start. |
| `auditEvent` | Future sanitized audit event name, if applicable. |
| `failClosedBehavior` | Exact blocked/backend-required response behavior. |
| `validationLevel` | `none`, `schema`, `guarded`, `diagnostic_only`, or `future`. |
| `productionReadiness` | Derived production readiness for route capability reporting. |

## Allowed Response Status Labels

- `ok`
- `blocked`
- `backend_required`
- `unauthorized`
- `forbidden`
- `validation_failed`
- `idempotency_conflict`
- `dependency_missing`
- `not_implemented`
- `environment_blocked`
- `error`

## Prompt 7 Route Defaults

- GET/read routes can be implemented only for limited Prompt 3-6 foundations or safe health/capability reporting.
- Mutation routes require idempotency unless they are reporting-only blocked routes.
- Execution-capable route groups return `backend_required` and must not call execution services.
- Route capability reporting must be accurate even when legacy mock metadata still exists for demos.
