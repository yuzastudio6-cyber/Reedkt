# Job Orchestration Route Contract

Prompt 8 routes expose job/worker boundaries only. Mutation routes require auth and idempotency, then fail closed with backend-required results unless a future transactional backend runtime exists.

| Route ID | Purpose | Caller | Auth | Access | Tables touched | Service role | Idempotency | Forbidden side effects | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `jobs.readiness.check` | Check job creation/execution blockers. | Frontend/backend | Required | Workspace/project | `projects`, `workspace_members`, approved snapshot/credit refs | Required for full validation | No | Job creation, worker execution | `backend_required` |
| `jobs.batch.create` | Prepare job batch creation payload. | Backend API | Required | Workspace/project | `job_batches`, `api_idempotency_keys` | Required | Yes | Insert job batch in Prompt 8 | `backend_required` |
| `jobs.queue.create` | Prepare job queue payload. | Backend API | Required | Workspace/project | `jobs`, `api_idempotency_keys` | Required | Yes | Queue/dispatch/execute job | `backend_required` |
| `jobs.get` | Read sanitized job metadata. | Frontend/backend | Required | Project membership | `jobs` | Required | No | Expose secrets/raw logs | `backend_required` |
| `jobs.listForProject` | List sanitized project job summaries. | Frontend/backend | Required | Project membership | `jobs` | Required | No | Expose private backend payloads | `backend_required` |
| `jobs.dependencies.create` | Prepare dependency edge payload. | Backend API | Required | Workspace/project | `job_dependencies`, `api_idempotency_keys` | Required | Yes | Mutate dependency state | `backend_required` |
| `jobs.dependencies.get` | Read dependency metadata. | Frontend/backend | Required | Project membership | `job_dependencies` | Required | No | Expose secrets/raw payloads | `backend_required` |
| `jobs.events.append` | Prepare append-only job event payload. | Backend API | Required | Workspace/project | `job_events`, `api_idempotency_keys` | Required | Yes | Append event in Prompt 8 | `backend_required` |
| `jobs.events.list` | Read sanitized job events. | Frontend/backend | Required | Project membership | `job_events` | Required | No | Expose backend logs/secrets | `backend_required` |
| `jobs.status.get` | Read sanitized job progress/status. | Frontend/backend | Required | Project membership | `jobs` | Required | No | Mutate job progress | `backend_required` |
| `jobs.retry.schedule` | Prepare retry blocker/payload. | Backend API | Required | Workspace/project | `jobs`, `job_events`, `api_idempotency_keys` | Required | Yes | Schedule retry execution | `backend_required` |
| `jobs.cancel.request` | Prepare cancel blocker/payload. | Backend API | Required | Workspace/project | `jobs`, `job_events`, `api_idempotency_keys` | Required | Yes | Mutate job cancellation | `backend_required` |
| `workers.claim.readiness` | Check worker claim blockers. | Backend/future worker | Required | Job project | `jobs`, `worker_job_claims`, `worker_leases` | Required | No | Claim worker | `backend_required` |
| `workers.claim.create` | Prepare claim/lease payload. | Backend/future worker | Required | Job project | `worker_job_claims`, `worker_leases`, `job_claim_attempts`, `api_idempotency_keys` | Required | Yes | Claim job or execute worker | `backend_required` |
| `workers.claim.get` | Read sanitized claim metadata. | Backend/future worker | Required | Project membership | `worker_job_claims` | Required | No | Expose claim tokens | `backend_required` |
| `workers.heartbeat` | Prepare heartbeat payload. | Backend/future worker | Required | Job project | `worker_job_claims`, `worker_leases`, `api_idempotency_keys` | Required | Yes | Update heartbeat | `backend_required` |
| `workers.lease.renew` | Prepare lease renewal payload. | Backend/future worker | Required | Project membership | `worker_leases`, `api_idempotency_keys` | Required | Yes | Renew lease | `backend_required` |
| `workers.lease.release` | Prepare lease release payload. | Backend/future worker | Required | Project membership | `worker_leases`, `api_idempotency_keys` | Required | Yes | Release lease | `backend_required` |
| `workers.complete` | Prepare completion payload. | Backend/future worker | Required | Project membership | `jobs`, `worker_leases`, `job_events`, `api_idempotency_keys` | Required | Yes | Complete job | `backend_required` |
| `workers.fail` | Prepare failure payload. | Backend/future worker | Required | Project membership | `jobs`, `worker_leases`, `job_events`, `api_idempotency_keys` | Required | Yes | Fail job | `backend_required` |
| `workers.recoverStale` | Prepare stale claim recovery payload. | Backend operator | Required | Optional scoped project | `worker_job_claims`, `worker_leases`, `job_claim_attempts`, `api_idempotency_keys` | Required | Yes | Recover/retry job | `backend_required` |
| `workers.runtime.registry` | Read static worker lane metadata. | Frontend/backend | Required | None | None | No | No | Runtime checks/tool execution | `backend_required` |
| `idempotency.check` | Middleware/service contract for duplicate detection. | Backend API | Required | Workspace | `api_idempotency_keys` | Required when persistent | Header required by mutation route | Standalone HTTP route | `implemented` |
| `idempotency.record` | Middleware/service contract for request hash recording. | Backend API | Required | Workspace | `api_idempotency_keys` | Required when persistent | Header required by mutation route | Standalone HTTP route | `implemented` |

## Response Shape

Job/worker route data should include:

- `status`: `ready`, `blocked`, `backend_required`, or `mock_only`
- `canProceed`
- `canClaim`
- `canRun`
- `blockers`
- `warnings`
- `requiredRecords`
- `nextAction`
- optional sanitized summaries: `job`, `jobs`, `jobBatch`, `dependencies`, `events`, `workerClaim`, `lease`, `idempotencySummary`, `intendedPayload`, `auditEvent`
