# Canonical Professional Long-Form Started-Attempt Recovery — 2026-07-21

Status: `local_private_attempt_failure_recovery_and_attempt_two_verified`

## Outcome

The professional long-form child queue can now recover an exact started
operation after a known failed attempt or an expired worker lease. Previously,
`job_execution_started` permanently blocked that queue item because no
canonical failure record could clear the consumed attempt while retaining its
cost and one-use lineage.

The server-owned recovery boundary accepts only workspace and approved
snapshot identity. It scans the canonical queue, selects the exact started
attempt, reopens or finalizes its private internal-cost evidence, and commits
one immutable failed-attempt record before releasing the lease. Callers cannot
select the job, attempt, lease, operation, cost, retry, or failure outcome.

## Authority And Retry Rules

- The failed record binds the exact approved work item, authorization, queue
  claim, initial and terminal heartbeat claim hashes, delivery attempt,
  operation/profile, internal-cost evidence, and terminal time.
- An unexpired attempt without terminal failed-cost evidence is not recovered.
- A timeout is accepted only after the exact queue lease expires.
- Failed-attempt cost is retained even when the operation is eligible for its
  one approved retry.
- The old attempt loses artifact and completion authority before the queue is
  released.
- Retry availability is derived only from immutable `maxAttempts`; recovery
  never starts a retry automatically.
- Cancellation, validation, or unknown failures require review even when one
  package attempt remains; remaining attempt allowance is not retry authority.
- Attempt 2 requires a fresh queue claim and remains bound to the same approved
  snapshot, work item, authorization, operation, and cost profile.
- Exhausted attempts remain non-completable and require user review or a new
  approval path.
- Customer price, credits, service fee, wallet, billing, and a second export
  estimate are not part of this transaction.

## Retained Proof

`npm run smoke:canonical-professional-long-form-post-approval` passes 111
checks on the six-hour, 512-range, 124-chunk, 255-job fixture. The proof:

1. authorizes and starts object-chunk 2 render attempt 1;
2. rejects caller-selected recovery fields;
3. persists one heartbeat and proves both initial and terminal claim hashes;
4. refuses recovery while the heartbeated lease is still active;
5. proves a cancelled/nonretryable failure cannot consume the remaining
   attempt without review;
6. expires the lease and records bounded timeout cost;
7. terminally fences attempt 1 and releases no artifact/completion authority;
8. exactly replays a lost failure-reconciliation response;
9. clears process caches and reopens the same failed history from disk; and
10. acquires a fresh claim and completes render attempt 2 plus its independent
   QA job through the existing generic executor.

Before the paired QA starts, the retained proof now also simulates a process
crash after attempt 2 has committed its real render, terminal, and completed
internal-cost evidence but before queue completion. The separate canonical
completed-attempt reconciler reopens the immutable credential-free proposal,
completes the original claim without rerendering, and leaves only the QA job
pending. See
`docs/canonical-professional-long-form-completed-attempt-reconciliation-2026-07-21.md`.

The final retained state is intentionally 8/255 completed jobs, 247 queued
jobs, nine delivery attempts, and one expired-claim recovery. The failed
attempt therefore adds evidence without being miscounted as a completed job.

## Readiness Boundary

Verified:

- cooperative single-host private persistence and restart readback;
- immutable failure/cost lineage and exact reconciliation replay;
- one-use attempt fencing and fresh-claim attempt-2 execution;
- unchanged approved snapshot and original 4K estimate/reservation; and
- no automatic retry or customer-commercial mutation.

Still false:

- distributed database transaction and multi-replica queue ownership;
- deployed worker-death observation and termination of a stale process;
- GCS private-object recovery and Google Cloud worker dispatch;
- full retained execution of the remaining 247 jobs/122 chunk pairs;
- representative professional many-angle codec/HDR/VFR/audio coverage; and
- provider, billing, deployment, public delivery, external beta, product, or
  production readiness.
