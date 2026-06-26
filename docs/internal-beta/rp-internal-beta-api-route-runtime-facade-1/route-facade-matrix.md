# Internal Beta API Route Runtime Facade Matrix

Packet: `RP-INTERNAL-BETA-API-ROUTE-RUNTIME-FACADE-1`

Facade status: `blocked_pending_supabase_target_validation_and_runtime_enablement`

| Route id | Method | Path | Contract status | Facade status | Handler registered | Route execution |
| --- | --- | --- | --- | --- | --- | --- |
| `internalBeta.session.create` | `POST` | `/api/internal-beta/sessions` | `backend_required` | `blocked_pending_supabase_target_validation_and_runtime_enablement` | `false` | `false` |
| `internalBeta.approvedPlan.commit` | `POST` | `/api/internal-beta/approved-plans` | `backend_required` | `blocked_pending_supabase_target_validation_and_runtime_enablement` | `false` | `false` |
| `internalBeta.creditReservation.create` | `POST` | `/api/internal-beta/credit-reservations` | `backend_required` | `blocked_pending_supabase_target_validation_and_runtime_enablement` | `false` | `false` |
| `internalBeta.job.enqueue` | `POST` | `/api/internal-beta/jobs` | `backend_required` | `blocked_pending_supabase_target_validation_and_runtime_enablement` | `false` | `false` |
| `internalBeta.job.status.get` | `GET` | `/api/internal-beta/jobs/:jobId/status` | `backend_required` | `blocked_pending_supabase_target_validation_and_runtime_enablement` | `false` | `false` |
| `internalBeta.artifactManifest.write` | `POST` | `/api/internal-beta/artifact-manifests` | `backend_required` | `blocked_pending_supabase_target_validation_and_runtime_enablement` | `false` | `false` |
| `internalBeta.privateArtifactAccess.create` | `POST` | `/api/internal-beta/artifacts/private-access` | `disabled` | `blocked_pending_supabase_target_validation_and_runtime_enablement` | `false` | `false` |
| `internalBeta.qaReport.read` | `GET` | `/api/internal-beta/qa-reports/:qaReportId` | `backend_required` | `blocked_pending_supabase_target_validation_and_runtime_enablement` | `false` | `false` |

Facade route count: `8`

Backend-required route count: `7`

Disabled route count: `1`

Mock handler registration: `false`

Service-role route execution: `false`

Internal beta end-to-end ready: `false`

Product-ready end-to-end local OSS tools: `0`
