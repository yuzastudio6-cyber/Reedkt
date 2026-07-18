# Canonical Accepted-Worker Timeout Reconciliation Verification — 2026-07-17

Status: `single_host_timeout_attempt_start_and_controller_finalizer_verified_distributed_worker_death_detection_blocked`

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

Before that commit, the server loads the exact create-only attempt-cost record
by the immutable dispatch intent while it still owns the package lock. It
verifies the complete tenant, snapshot, work-item, job, retry, tool, operation,
failed-timeout outcome, accepted-worker time window, and (on replay) receipt
hash. The timeout API no longer accepts a cost-evidence hash from its caller.

No automatic retry starts. When an approved attempt remains, only a later
explicit server enqueue can allocate it. When the attempt ceiling is exhausted,
no additional queue claim or outbox entry is created.

This closes the private single-host race where an accepted worker could outlive
its lease while another delivery attempt advanced. It does not detect a dead
worker in deployed Google Cloud, run a distributed sweeper, create a Cloud Task,
invoke a Cloud Run Job, execute a tool, activate a provider, mutate a wallet,
charge a customer, write remote Supabase, deploy, render publicly, or authorize
production delivery.

## Durable Attempt-Start And Controller Finalizer Follow-Up

The previously named pre-finalization crash gap is now closed for the three
currently metered private workload profiles. DeepFilterNet, Remotion 4K source
slice chunks, and FFmpeg 4K mezzanine finalization must persist one exact,
create-only runtime-cost start before execution. A controller-authenticated
package scanner selects expired accepted-worker attempts without accepting a
caller-supplied dispatch ID, reconstructs bounded internal cost through the
immutable lease expiry, and invokes this existing timeout transaction. Missing,
tampered, mismatched, expired-at-start, wrong-principal, and unsupported-profile
cases fail closed. See
`docs/canonical-private-worker-timeout-finalizer-verification-2026-07-17.md`.

This follow-up does not imply a distributed death observer or production
authority. The remaining distributed requirements below still apply.

## Exact Authority Flow

```text
immutable approved package attempt
  -> queue claim and opaque outbox entry share one WAL commit
  -> exact controller identity accepted
  -> exact worker identity accepted
  -> queue lease reaches its immutable/heartbeat-bounded expiry
  -> later-attempt enqueue returns stale_attempt_reconciliation_required
  -> same accepted controller service principal authenticates reconciliation
  -> server loads and verifies exact persisted failed-timeout cost evidence
  -> server derives timeout evidence from the exact expired queue claim
  -> server derives retry/exhaustion from immutable maxAttempts
  -> one timeout WAL commits queue release + terminal outbox receipt
  -> identical reconciliation returns exact_replay
  -> optional later attempt requires a separate explicit server enqueue
```

The timeout service boundary accepts only the opaque dispatch intent and a
process-branded verified controller identity. It explicitly rejects a
caller-supplied attempt-cost hash. It does not accept a caller-selected attempt number,
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
evidence hash into the timeout receipt. The transaction resolved that hash from
the exact private record; the controller did not provide it.

Missing evidence returns `JOB_DEPENDENCY_NOT_READY`. Invalid checksums are
refused, and a validly checksummed record with the wrong work-item identity
returns `IDEMPOTENCY_CONFLICT`. All three cases leave the queue and outbox
projections byte-identical. Exact timeout replay re-reads the private record and
requires its hash to match the already committed receipt.

This is INTERNAL production-cost evidence only. It is not a future customer
price, customer credit amount, ReEditPro service fee, margin, wallet mutation,
invoice, settlement, charge, or refund. All of those authorities remain false.

## Focused Verification

`npm run smoke:canonical-private-package-state-transaction` passes `51` checks,
including:

- deterministic crashes after timeout WAL commit and after queue projection;
- real child-process exits with code `80` at both commit stages;
- exact recovery with one timeout reconciliation and one replay;
- separate-process timeout races converging on `reconciled` plus
  `exact_replay`;
- completion/failure/timeout terminal exclusivity;
- rejection before lease expiry and for the wrong controller principal;
- rejection of missing, checksum-tampered, and validly checksummed but
  attempt-mismatched private cost records without queue/outbox mutation;
- tampered timeout WAL and projection-drift refusal;
- later-attempt fencing before reconciliation;
- first timeout exposing only one remaining approved attempt;
- a second accepted-worker timeout persisting `attempts_exhausted` without a
  third outbox entry; and
- versioned timeout attempt-cost evidence with no customer commercial fields.

`npm run smoke:canonical-cloud-dispatch-outbox-receivers` passes `31` checks.
Its representative private dispatch proves the service boundary returns the
stale-attempt gate, rejects an unexpired timeout and wrong controller, commits
one exact timeout, replays it, and creates attempt two only after a separate
explicit enqueue. It also proves one durable start plus concurrent/restart
replay, all three supported metered profiles, checksum tamper and missing-start
refusal, controller-selected timeout finalization, and rejection of a
caller-supplied cost hash. Unmetered profiles remain fail-closed.

`npm run typecheck:server`, targeted ESLint, and `git diff --check` also pass.

## Historical Aggregate Verification

Before the durable-start follow-up, the full internal pipeline passed all
`32/32` stages with exit code
`0` under `canonical-private-pipeline-verification-v13`. It started at
`2026-07-17T21:17:11.077Z`, finished at `2026-07-17T21:47:27.541Z`, and
completed in `1,816,464 ms`. The report includes
explicit verified claims for:

- crash-consistent worker completion reconciliation;
- crash-consistent worker failure reconciliation;
- crash-consistent accepted-worker timeout reconciliation;
- later-attempt fencing until accepted-worker timeout reconciliation; and
- versioned internal production-cost evidence for the timed-out attempt.

Observed v13 stage durations included `10,073 ms` for package-state
transactions, `1,571 ms` for the timeout-aware outbox receiver, `695,974 ms`
for three-source composition, `615,010 ms` for the professional-color
lifecycle, `96,703 ms` for the separate UHD Remotion stream, `13,967 ms` for
all `11/11` named-edit browser tests, and `357,508 ms` for the
signed-in maximum-eight-source private-review regression.

The run preserved exactly `50` canonical E2E and `50` job-adapter identities,
completed the bounded `27`-job signed-in private workflow, and kept distributed
queue/outbox authority, live Google Cloud execution, provider activation,
customer billing/wallet mutation, remote Supabase, deployment, public delivery,
external beta, and paid production false.

That v13 report is historical evidence for the preceding timeout transaction
and Docker transport hardening, not exact-code aggregate evidence for the new
attempt-start/finalizer source. The focused 31-check receiver smoke and the
related cost/transaction smokes are current; a full aggregate rerun remains a
separate long-running verification step.

The preceding exact-code v12 pipeline also passed all `32/32` stages. Its
timeout-aware receiver completed in `1,577 ms`, and its maximum-eight-source
signed-in review completed in `382,429 ms`. It remains historical pre-Docker-
transport-hardening evidence.

## Remaining Gate

Production timeout handling still requires a reviewed distributed database
transaction/RPC, authoritative worker heartbeat/death observation, a deployed
controller/sweeper, live Google token/key rotation and IAM, multi-replica race
tests, Cloud Tasks retry/dead-letter reconciliation, Cloud Run termination and
late-completion fencing, regional private object transport, telemetry, alerts,
incident recovery, and controlled staging fault injection. Those actions remain
gated and were not performed in this slice.

The private prerequisite for a pre-finalization crash is now present for the
three explicitly metered DeepFilterNet, Remotion, and FFmpeg workload profiles.
Every other tool remains blocked at durable attempt start until it has an exact
reviewed runtime-cost profile. Production still needs the distributed
transaction and deployed observer/controller evidence listed above; this local
scanner is not a deployed sweeper.
