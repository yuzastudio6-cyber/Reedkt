# Worker Job Claim And Lease Audit

Status: `ready_with_warnings_for_worker_1`.

## Observed Surfaces

- `server/services/worker-claim-service.ts` creates mock claims when no admin client exists or mock mode is enabled.
- The same service can call `can_claim_worker_job` and insert/update `worker_job_claims` through the server admin client path.
- `server/workers/worker-claim-runner.ts` only claims after gate checks pass unless input is dry-run.
- `server/routes/worker-routes.ts` exposes claim, heartbeat, release, and run route handlers behind auth/schema boundaries.

## Warnings

- The claim service contains an explicit TODO to replace the Supabase insert flow with a transaction/RPC to avoid claim race windows.
- Heartbeat and release paths are server admin-client paths and need later staging/database gate evidence before use.
- Existing smoke tests can exercise mock/local claim behavior, but WORKER-0 does not run them.

## Required WORKER-1 Treatment

WORKER-1 should require:

- atomic claim semantics or documented mock-only dry-run constraints;
- lease expiry and stale claim behavior;
- idempotency protection;
- no raw prompt payloads;
- approved plan snapshot refs before expensive jobs;
- credit reservation refs before expensive jobs;
- explicit proof that any Supabase path is server-only and approved.

No worker execution or Supabase mutation was enabled by this audit.
