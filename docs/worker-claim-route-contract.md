# Worker Claim Route Contract

## Route Contract Matrix

| Route ID | Path | Purpose | Caller | Auth | Idempotency | Tables touched | Service role | Forbidden side effects | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `workers.executionEnvelope.readiness` | `POST /v1/workers/execution-envelope/readiness` | Check envelope gates. | Backend/future worker | Required | Required | Read/reference only | Future required | Worker execution, records writes | `backend_required` |
| `workers.executionEnvelope.preview` | `POST /v1/workers/execution-envelope/preview` | Build sanitized envelope preview. | Backend/future worker | Required | Required | Read/reference only | Future required | Claim/execute/write outputs | `backend_required` |
| `workers.claim.preflight` | `POST /v1/jobs/:jobId/claim/preflight` | Preflight claim envelope. | Backend/future worker | Required | Required | `jobs`, claim/lease refs | Future required | Create claim/lease | `backend_required` |
| `workers.claim.create` | `POST /v1/jobs/:jobId/claim` | Existing Prompt 8 claim boundary. | Backend/future worker | Required | Required | `worker_job_claims`, `worker_leases` refs | Required | Claim production job | `backend_required` |
| `workers.claim.get` | `GET /v1/workers/claims/:workerClaimId` | Read sanitized claim metadata. | Backend/future worker | Required | No | `worker_job_claims` | Required | Expose claim tokens | `backend_required` |
| `workers.lease.renew` | `POST /v1/workers/leases/:leaseId/renew` | Renew boundary. | Backend/future worker | Required | Required | `worker_leases` refs | Required | Renew lease | `backend_required` |
| `workers.heartbeat.record` | `POST /v1/workers/claims/:workerClaimId/heartbeat` | Heartbeat boundary. | Backend/future worker | Required | Required | `worker_job_claims`, `worker_leases` refs | Required | Write heartbeat | `backend_required` |
| `workers.lease.release` | `POST /v1/workers/leases/:leaseId/release` | Release boundary. | Backend/future worker | Required | Required | `worker_leases` refs | Required | Release lease | `backend_required` |
| `workers.complete.boundary` | `POST /v1/workers/leases/:leaseId/complete` | Complete boundary. | Backend/future worker | Required | Required | `jobs`, `job_events` refs | Required | Complete job/write outputs | `backend_required` |
| `workers.fail.boundary` | `POST /v1/workers/leases/:leaseId/fail` | Failure boundary. | Backend/future worker | Required | Required | `jobs`, `job_events` refs | Required | Fail job/write events | `backend_required` |
| `workers.cancel.boundary` | `POST /v1/workers/claims/:workerClaimId/cancel` | Cancellation boundary. | Backend/future worker | Required | Required | claim/lease refs | Future required | Cancel job/claim | `backend_required` |
| `workers.staleRecovery.preview` | `POST /v1/workers/claims/stale-recovery/preview` | Stale recovery preview. | Backend operator | Required | Required | claim/lease refs | Future required | Recover claims/retry jobs | `backend_required` |
| `workers.runtime.capabilities` | `GET /v1/workers/runtime/capabilities` | Static runtime capability blockers. | Authenticated backend/UI | Required | No | None | No | Runtime checks/execution | `backend_required` |
| `workers.runtime.toolRequirements` | `POST /v1/workers/runtime/tool-requirements` | Static Prompt 13 tool readiness summary. | Backend/future worker | Required | Required | None | No | Tool checks/execution | `backend_required` |
| `workers.execution.blocked` | `POST /v1/workers/execution/blocked` | Explicit blocked execution result. | Backend/future worker | Required | Required | Read/reference only | Future required | Worker execution | `backend_required` |

All worker-only routes must fail closed when worker/backend runtime, project access, approved snapshot, credit reservation, storage/media readiness, QA, tool readiness, idempotency, or claim/lease gates are missing.
