# Observability Route Contract

All Prompt 17 routes require authenticated backend API access. POST boundary routes require idempotency. No route sends external telemetry, writes production audit/rate-limit/abuse/cost-control records, charges users, or unlocks execution.

| Route ID | Method/Path | Purpose | Tables touched | Service role | Idempotency | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `observability.readiness.check` | `POST /v1/observability/readiness` | Report observability blockers. | Future audit/rate/abuse/cost records by reference only. | Future | Yes | `backend_required` |
| `observability.runtime.status` | `GET /v1/observability/runtime-status` | Return safe runtime and route summary. | None | No | No | `implemented` static summary |
| `observability.requestTrace.get` | `GET /v1/observability/request-traces/:requestId` | Return current trace or block historical lookup. | Future trace records by reference only. | Future | No | `backend_required` |
| `observability.routeRisk.summary` | `GET /v1/observability/route-risk-summary` | Summarize static route risk metadata. | None | No | No | `implemented` static summary |
| `audit.event.preview` | `POST /v1/audit/event/preview` | Preview sanitized audit payload. | `audit_events` reference only. | Future | Yes | `backend_required` |
| `audit.event.createBoundary` | `POST /v1/audit/event/create-boundary` | Fail-closed audit creation boundary. | `audit_events` future. | Future | Yes | `backend_required` |
| `audit.event.listForProject` | `GET /v1/projects/:projectId/audit-events` | Future project audit listing. | `audit_events` future. | Future | No | `backend_required` |
| `audit.event.listForWorkspace` | `GET /v1/workspaces/:workspaceId/audit-events` | Future workspace audit listing. | `audit_events` future. | Future | No | `backend_required` |
| `audit.summary.get` | `GET /v1/audit/summary` | Future audit aggregate summary. | `audit_event_summaries` future. | Future | No | `backend_required` |
| `rateLimit.readiness.check` | `POST /v1/rate-limit/readiness` | Report rate-limit persistence blockers. | `rate_limit_events` future. | Future | Yes | `backend_required` |
| `rateLimit.policy.preview` | `POST /v1/rate-limit/policy/preview` | Preview rate-limit policy. | None | No | Yes | `backend_required` |
| `rateLimit.checkBoundary` | `POST /v1/rate-limit/check-boundary` | Fail-closed enforcement boundary. | `rate_limit_events` future. | Future | Yes | `backend_required` |
| `abuse.readiness.check` | `POST /v1/abuse/readiness` | Report abuse-prevention blockers. | `abuse_prevention_events` future. | Future | Yes | `backend_required` |
| `abuse.policy.preview` | `POST /v1/abuse/policy/preview` | Preview abuse policy. | None | No | Yes | `backend_required` |
| `abuse.checkBoundary` | `POST /v1/abuse/check-boundary` | Fail-closed abuse check boundary. | `abuse_prevention_events` future. | Future | Yes | `backend_required` |
| `costControl.readiness.check` | `POST /v1/cost-control/readiness` | Report cost-control blockers. | `usage_metering_records`, `cost_control_records` future. | Future | Yes | `backend_required` |
| `costControl.policy.preview` | `POST /v1/cost-control/policy/preview` | Preview cost policy. | None | No | Yes | `backend_required` |
| `costControl.usageSummary.preview` | `POST /v1/cost-control/usage-summary/preview` | Preview usage summary from request metadata. | None | No | Yes | `backend_required` |
| `costControl.executionBlocked` | `POST /v1/cost-control/execution-blocked` | Explicitly block execution. | `cost_control_records` future. | Future | Yes | `blocked` |
| `operationalAlert.readiness.check` | `POST /v1/operational-alert/readiness` | Report alerting blockers. | `operational_alert_records` future. | Future | Yes | `backend_required` |
| `operationalAlert.preview` | `POST /v1/operational-alert/preview` | Preview alert payload locally. | None | No | Yes | `backend_required` |

Forbidden side effects for every route: external telemetry, audit persistence, production rate-limit enforcement, billing/Stripe, provider calls, tool/worker/render/media execution, remote Supabase, deployment, and production/beta unlock.
