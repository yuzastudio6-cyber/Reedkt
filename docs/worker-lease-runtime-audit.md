# Worker Lease Runtime Audit

Date: 2026-05-20

## Existing Support Found

- `job_batches`, `jobs`, `job_dependencies`, `job_events`, `agent_runs`, `agent_outputs`, `worker_runtime_configs`, and `worker_heartbeats` exist in `supabase/migrations/202605130005_job_orchestration_agent_runs.sql`.
- Job records include status, retry count, max attempts, priority, worker target/runtime metadata, payloads, scheduled time, started/completed/failed timestamps, and idempotency keys.
- Job dependencies and job events exist for dependency tracking and human-readable progress.
- Lyria and SFX worker skeletons exist and validate edit approval, generation request, and credit reservation before mock work.
- RP-FIX-10 added mock queue, gate, dependency, dispatch, retry, and status-summary services.

## Missing Before RP-FIX-11

- No dedicated `worker_leases` table.
- No dedicated `backend_runtime_messages` table.
- No dedicated `job_claim_attempts` table.
- No transactional one-worker-per-job claim helper.
- No lease token, lease renewal, release, completion, failure, cancellation, or stale lease recovery service.
- No runtime message envelope contract for Cloud Run, Supabase Edge, backend HTTP, Pub/Sub, or local mock transport.
- No shared idempotency helper for job dispatch, provider calls, render jobs, credit spend, or runtime messages.

## RP-FIX-11 Local Additions

- Added local-only migration `supabase/migrations/202605200002_worker_leases_runtime_transport.sql`.
- Added mock-safe runtime transport and worker lease types.
- Added mock lease claim, heartbeat, renew, release, complete, fail, cancel, stale recovery, and idempotency helpers.
- Added worker runtime registry metadata.

## Risks

Real lease mutation must be transactional and backend-only. Provider-like jobs need idempotency checks before retry because a stale lease does not prove whether an external provider started work. Frontend code may inspect mock status but must not claim real leases or mutate worker state.
