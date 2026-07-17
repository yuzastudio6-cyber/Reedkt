# Canonical Accepted-Worker Timeout Reconciliation Verification — 2026-07-17

Status: `single_host_crash_consistent_timeout_reconciliation_verified_distributed_worker_death_detection_blocked`

## Outcome

ReEditPro now fails closed when a Cloud-dispatch queue lease expires after the
exact worker identity has already been accepted. A later package attempt is not
allocated while that accepted worker still has unresolved execution authority.
The enqueue boundary instead returns
`stale_attempt_reconciliation_required` with the exact required gate
`canonical_cloud_dispatch_accepted_worker_timeout_reconciliation` and leaves
both queue and outbox projections unchanged.

The server-owned controller can then reconcile the exact expired attempt. One
package-scoped cooperative lock and one checksum-protected write-ahead record
atomically commit both results:

- the queue claim is released as `expired_claim_recovered` with server-derived
  `retry_available` or `attempts_exhausted` authority; and
- the accepted-worker outbox entry becomes the mutually exclusive terminal
  state `worker_timeout_reconciled` with one versioned timeout receipt.

No automatic retry starts. When an approved attempt remains, only a later
explicit server enqueue can allocate it. When the attempt ceiling is exhausted,
no additional queue claim or outbox entry is created.

This closes the private single-host race where an accepted worker could outlive
its lease while another delivery attempt advanced. It does not detect a dead
worker in deployed Google Cloud, run a distributed sweeper, create a Cloud Task,
invoke a Cloud Run Job, execute a tool, activate a provider, mutate a wallet,
charge a customer, write remote Supabase, deploy, render publicly, or authorize
production delivery.

## Exact Authority Flow

```text
immutable approved package attempt
  -> queue claim and opaque outbox entry share one WAL commit
  -> exact controller identity accepted
  -> exact worker identity accepted
  -> queue lease reaches its immutable/heartbeat-bounded expiry
  -> later-attempt enqueue returns stale_attempt_reconciliation_required
  -> same accepted controller service principal authenticates reconciliation
  -> server derives timeout evidence from the exact expired queue claim
  -> server derives retry/exhaustion from immutable maxAttempts
  -> one timeout WAL commits queue release + terminal outbox receipt
  -> identical reconciliation returns exact_replay
  -> optional later attempt requires a separate explicit server enqueue
```

The timeout service boundary accepts only the opaque dispatch intent, one attempt-level
internal production-cost evidence hash, and a process-branded verified
controller identity. It does not accept a caller-selected attempt number,
retry count, queue disposition, release reason, worker state, timeout timestamp,
projection path, raw failure message, log, stack, media path, prompt, signed URL,
claim credential, bearer token, price, credit amount, service fee, wallet
operation, or billing instruction.

## Versioned Evidence And Receipt

`canonical-cloud-dispatch-worker-timeout-evidence-v1` is derived by the server
from the exact accepted outbox attempt and current queue claim. It binds:

- the immutable initial queue-claim hash and expiry;
- the exact expired claim hash, expiry, heartbeat timestamp/count, and attempt
  deadline;
- controller and worker receipt authority through the later timeout receipt;
- `execution_timeout`, `WORKER_LEASE_EXPIRED`, and
  `failed_before_commit` semantics;
- one attempt-level internal production-cost evidence hash; and
- the explicit absence of customer price, credits, service fee, wallet,
  billing, raw failure, path, or credential authority.

`canonical-cloud-dispatch-worker-timeout-receipt-v1` additionally binds the
dispatch intent, job, approved delivery attempt, queue claim, controller and
worker receipts, derived timeout evidence, queue release, remaining attempt
allowance, and the exact accepted controller service principal. A changed
identity, cost-evidence hash, timeout evidence, release, or projection cannot
replay as the same result.

The controller identity is intentionally the same service principal that
accepted the original task. The verifier mode, verifier ID, Google issuer,
service-account subject, principal email, and audience must match; a newly
verified token for that same principal may differ in issuance/expiry evidence.
The expired worker is not trusted to declare its own timeout.

## Atomic Commit And Recovery

`canonical-private-package-timeout-transaction-v1` uses the same package lock
and recovery record as claim/outbox, completion, and failure reconciliation.
Before the WAL is published, semantic validation proves:

1. one exact leased queue claim is expired and still matches the accepted
   outbox attempt;
2. no completion, failure, or earlier timeout terminal state exists;
3. that claim becomes one digest-only `expired_claim_recovered` release;
4. retry/exhaustion equals `maxAttempts - deliveryAttemptCount`;
5. the accepted outbox entry becomes one `worker_timeout_reconciled` entry;
6. controller and worker receipts plus immutable attempt bytes do not change;
7. exactly one queue event and one timeout outbox event are appended; and
8. every unrelated queue/outbox entry remains byte-equivalent.

The WAL is the commit point. A process exit after commit but before either
projection is complete is recovered by replaying only the missing exact
projection. Unknown projection drift or a tampered WAL fails closed rather than
being overwritten. This is cooperative same-host process-crash evidence, not a
distributed database transaction or proof against host-power/filesystem loss.

## Terminal Exclusivity

Completion, pre-commit failure, and accepted-worker timeout all serialize under
the same package lock. Exactly one may terminalize a claim:

- completion rejects a persisted failure or timeout;
- failure rejects a persisted completion or timeout; and
- timeout rejects a persisted completion or failure.

A three-way completion/failure/timeout race produced one terminal outcome and
the losing operations failed closed. A terminal timeout could not later be
converted into completion or failure.

## Attempt-Level Internal Cost Boundary

The focused DeepFilterNet timeout fixture uses the existing versioned private
attempt-cost meter and `rp-ratecard-01-mock-safe` rate card. It persisted a
failed `timeout` outcome with `1,296` internal-cost micros, then bound that exact
evidence hash into the timeout receipt.

This is INTERNAL production-cost evidence only. It is not a future customer
price, customer credit amount, ReEditPro service fee, margin, wallet mutation,
invoice, settlement, charge, or refund. All of those authorities remain false.

## Focused Verification

`npm run smoke:canonical-private-package-state-transaction` passes `49` checks,
including:

- deterministic crashes after timeout WAL commit and after queue projection;
- real child-process exits with code `80` at both commit stages;
- exact recovery with one timeout reconciliation and one replay;
- separate-process timeout races converging on `reconciled` plus
  `exact_replay`;
- completion/failure/timeout terminal exclusivity;
- rejection before lease expiry and for the wrong controller principal;
- tampered timeout WAL and projection-drift refusal;
- later-attempt fencing before reconciliation;
- first timeout exposing only one remaining approved attempt;
- a second accepted-worker timeout persisting `attempts_exhausted` without a
  third outbox entry; and
- versioned timeout attempt-cost evidence with no customer commercial fields.

`npm run smoke:canonical-cloud-dispatch-outbox-receivers` passes `21` checks.
Its representative CPU dispatch proves the public service boundary returns the
stale-attempt gate, rejects an unexpired timeout and wrong controller, commits
one exact timeout, replays it, and creates attempt two only after a separate
explicit enqueue.

`npm run typecheck:server`, targeted ESLint, and `git diff --check` also pass.

## Aggregate Verification

The exact-code full internal pipeline passed all `32/32` stages with exit code
`0` under `canonical-private-pipeline-verification-v12`. The report includes
explicit verified claims for:

- crash-consistent worker completion reconciliation;
- crash-consistent worker failure reconciliation;
- crash-consistent accepted-worker timeout reconciliation;
- later-attempt fencing until accepted-worker timeout reconciliation; and
- versioned internal production-cost evidence for the timed-out attempt.

Observed v12 stage durations included `1,577 ms` for the timeout-aware outbox
receiver, `647,129 ms` for three-source composition, `647,366 ms` for the
professional-color lifecycle, `109,293 ms` for the separate UHD Remotion stream,
`16,219 ms` for all `11/11` named-edit browser tests, and `382,429 ms` for the
signed-in maximum-eight-source private-review regression.

The run preserved exactly `50` canonical E2E and `50` job-adapter identities,
completed the bounded `27`-job signed-in private workflow, and kept distributed
queue/outbox authority, live Google Cloud execution, provider activation,
customer billing/wallet mutation, remote Supabase, deployment, public delivery,
external beta, and paid production false.

## Remaining Gate

Production timeout handling still requires a reviewed distributed database
transaction/RPC, authoritative worker heartbeat/death observation, a deployed
controller/sweeper, live Google token/key rotation and IAM, multi-replica race
tests, Cloud Tasks retry/dead-letter reconciliation, Cloud Run termination and
late-completion fencing, regional private object transport, telemetry, alerts,
incident recovery, and controlled staging fault injection. Those actions remain
gated and were not performed in this slice.
