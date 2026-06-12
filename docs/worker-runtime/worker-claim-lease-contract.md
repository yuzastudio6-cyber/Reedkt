# Worker Claim Lease Contract

Status: `ready_for_worker_2_dry_run_fixture_plan`.

WORKER-1 documents claim and lease requirements only. It does not claim jobs or mutate `worker_job_claims`.

## Future Claim Eligibility

- Job must reference a valid `jobId`.
- Job must reference an approved `planSnapshotId` or a future synthetic fixture snapshot explicitly approved by WORKER-2.
- `approvalState` must allow the specific dry-run or execution class.
- Workspace, project, and user placeholders must match the approved snapshot scope.
- Idempotency key must be present and deterministic.
- Required artifact scope, QA hooks, observability hooks, and cleanup hooks must be present.
- Blocked uses must not be requested.

## Lease Contract

- Lease duration must be bounded by a worker-type policy placeholder.
- Lock ownership must include job ID, worker type, worker instance ID, attempt number, and correlation ID.
- Heartbeats must be bounded and observable.
- Stale lease handling must prefer fail-closed release/retry evidence over duplicate work.
- Duplicate prevention must rely on idempotency and atomic claim semantics.

## Retry And Failure States

Future states should include:

- `claim_pending`
- `claim_active`
- `lease_heartbeat_due`
- `lease_stale`
- `claim_released`
- `claim_completed`
- `claim_failed`
- `claim_cancelled`
- `blocked_by_contract`

## WORKER-1 Warning

`server/services/worker-claim-service.ts` currently records a TODO to replace the Supabase insert path with a transaction/RPC to avoid claim race windows. WORKER-2 must not treat that path as live-ready without a later owner-approved hardening step.

No broad service-role handler is approved.
