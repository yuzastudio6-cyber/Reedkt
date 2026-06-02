# Observability Gate Contract

Future production paths must pass these gates before runtime execution or user-visible progression.

| Gate | Checked by | Required records | Pass condition | Fail status | Audit event |
| --- | --- | --- | --- | --- | --- |
| AuthGate | route middleware | auth session | Authenticated user present. | `blocked` | `auth.blocked` |
| WorkspaceGate | backend service | `workspace_members` | User belongs to workspace. | `blocked` | `workspace.access_blocked` |
| ProjectAccessGate | project service | `projects`, `workspace_members` | User can access project. | `blocked` | `project.access_blocked` |
| RequestIdGate | request middleware | request context | Request ID exists and is returned. | `blocked` | `observability.request_id_missing` |
| IdempotencyGate | idempotency middleware | `api_idempotency_keys` | POST boundary has idempotency key. | `blocked` | `idempotency.required` |
| AuditEventGate | observability service | `audit_events` future | Append-only persistence exists and metadata is sanitized. | `backend_required` | `audit.event_blocked` |
| SafeLoggingGate | observability schema/service | sanitized metadata | No secrets, signed URLs, raw payloads, raw media, or credentials. | `blocked` | `observability.redaction_failed` |
| RateLimitGate | observability service | `rate_limit_events` future | Reviewed limits and persistence exist. | `backend_required` | `rate_limit.blocked` |
| AbusePreventionGate | observability service | `abuse_prevention_events` future | Reviewed policy and escalation path exist. | `backend_required` | `abuse.blocked` |
| CostControlGate | observability service | `usage_metering_records`, `cost_control_records` future | Usage/cost persistence and ceiling policy exist. | `backend_required` | `cost_control.blocked` |
| UsageCeilingGate | cost-control service | usage records future | Request remains under reviewed ceiling. | `blocked` | `usage.ceiling_blocked` |
| StorageExposureGate | storage/cost service | storage records | Storage exposure is within policy. | `backend_required` | `storage.exposure_blocked` |
| ProviderCostExposureGate | provider/cost service | provider attempts future | Provider exposure is within policy. | `backend_required` | `provider.exposure_blocked` |
| RenderCostExposureGate | render/cost service | render records future | Render exposure is within policy. | `backend_required` | `render.exposure_blocked` |
| ToolRuntimeExposureGate | tool readiness service | tool readiness records | Tool runtime remains approved and isolated. | `backend_required` | `tool.exposure_blocked` |
| WorkerRuntimeExposureGate | worker runtime service | worker lease/claim records | Worker runtime is reviewed and available. | `backend_required` | `worker.exposure_blocked` |
| ComplianceGate | compliance service | compliance review records future | Required human reviews are approved. | `backend_required` | `compliance.blocked` |
| DataRetentionGate | observability service | retention policy future | Retention class is valid and approved. | `backend_required` | `retention.blocked` |
| AlertingGate | observability service | operational alert records future | Alert persistence/transport are reviewed. | `backend_required` | `alerting.blocked` |
| AdminOverrideGate | admin service | admin override records future | Human-approved override exists. | `backend_required` | `admin.override_blocked` |
| ProductionUnlockGate | production readiness owner | production approval records future | All gates pass with human approval. | `blocked` | `production.unlock_blocked` |

User-facing messages should be short, non-technical, and avoid exposing internal security signals. Internal audit events should use sanitized metadata only.
