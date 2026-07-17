# Canonical Private Worker Failure Reconciliation Verification — 2026-07-17

Status: `single_host_crash_consistent_failure_reconciliation_verified_live_cloud_blocked`

## Outcome

ReEditPro now has a bounded private failure boundary after one exact Cloud
dispatch worker identity has been accepted. A pre-commit worker failure
terminalizes that exact outbox attempt and releases the matching package claim
through one package-scoped write-ahead commit. Queue and outbox recovery cannot
split the failure receipt from its release, and exact replay cannot create
another release or another approved execution attempt.

This is local/private architecture and fault evidence. It does not call a
tool, provider, Cloud Task, Cloud Run Job, GCS, Supabase, billing system,
wallet, render service, or deployment API. It does not prove a distributed
transaction, live Google identity/IAM, a deployed worker callback, automatic
retry dispatch, public delivery, external beta, or production readiness.

## Exact Failure Flow

```text
server-selected package attempt
  -> crash-consistent queue claim + opaque dispatch outbox entry
  -> exact controller receipt
  -> exact accepted worker receipt
  -> bounded pre-commit failure evidence from that same worker principal
  -> server derives retry, exhaustion, or user-review disposition
  -> one failure WAL commits queue release + terminal outbox failure receipt
  -> restart recovery applies only a missing projection
  -> exact replay returns the immutable receipt without another release
```

The failure request binds:

- dispatch intent, job, package delivery attempt, claim ID, and claim hash;
- the exact accepted worker receipt and same verified service principal;
- a safe canonical failure category and API error code;
- `released_before_execution` or `failed_before_commit` execution state;
- a hash of bounded failure detail rather than raw error, log, stack, path, or
  credential bytes; and
- one attempt-level internal production-cost evidence hash under the literal
  `internal_production_cost_only` boundary.

The queue derives the release reason, remaining attempt allowance, retry
disposition, and queue disposition from immutable job authority. The worker
does not supply an attempt number, maximum-attempt value, remaining-attempt
value, or permission to start another execution.

## Retry And Review Policy

- `runtime_unavailable`, `execution_timeout`, and
  `output_validation_failed` may expose `retry_available` only while the
  immutable approved job still has an unused attempt.
- The final allowed attempt produces `attempts_exhausted` and cannot create
  another outbox entry.
- `authority_changed` and `unknown_internal` produce
  `user_review_required`; the queue refuses another claim until a future
  reviewed authority path resolves the state.
- `post_commit_reconciliation` must use completion reconciliation. Failure
  release and retry are rejected with `IDEMPOTENCY_ATOMICITY_REQUIRED`.
- No failure response starts an automatic retry loop. A subsequent approved
  attempt remains a separate server-selected queue operation.

Independent package jobs are not globally stopped by this boundary. The work
graph receives an explicit user-review or exhaustion blocker for the affected
job and its dependants while unrelated dependency-safe work can continue.

## Atomicity And Terminal Exclusivity

The versioned
`canonical-private-package-failure-transaction-v1` record contains exact
before/after queue and outbox checksums plus the job, attempt, claim, accepted
worker receipt, failure evidence, release, retry disposition, remaining
attempts, cost-evidence hash, and terminal receipt bindings.

Before commit, semantic validation proves:

- one exact leased queue claim becomes one queued release;
- only the stored claim-credential digest is carried forward;
- one `worker_identity_accepted` outbox attempt becomes
  `worker_failure_reconciled`;
- controller and worker receipts plus immutable attempt bytes do not change;
- exactly one `claim_released` queue event and one
  `worker_failure_reconciled` outbox event are appended;
- unrelated queue and outbox entries remain byte-identical; and
- completion and failure are mutually exclusive terminal outcomes.

The write-ahead publication is the commit point. Real child processes exit
with code `79` immediately after WAL commit and immediately after queue
projection. Restart recovery respectively replays both projections or only the
missing outbox projection. Separate Node processes racing the same failure
converge on one `reconciled` result and one `exact_replay` result.

Failure versus completion also races under the same package lock. Exactly one
terminal outcome wins; the other returns
`IDEMPOTENCY_ATOMICITY_REQUIRED`. A terminal failure can never later become a
completion, and a terminal completion can never be released as failed.

## Internal Cost Boundary

The failure receipt hash-binds the attempt-level internal production-cost
evidence and explicitly excludes customer commercial authority. Focused proof
uses the existing versioned cost boundary to create one failed DeepFilterNet
attempt record with:

- schema `private-internal-attempt-cost-evidence-v1`;
- rate card `rp-ratecard-01-mock-safe`;
- integer internal cost of `936` micros in the deterministic fixture;
- failed outcome with no canonical output claim;
- private-local create-only, checksum-protected persistence; and
- `databaseBacked`, `productionDurability`, and `invoiceReconciled` all false.

The persisted cost evidence and terminal failure receipt carry the same
evidence hash. This cost is ReEditPro's internal production cost evidence only.
It is not customer price, customer credits, ReEditPro service fee or margin,
wallet mutation, billing, charging, settlement, refund, or export-unlock
authority.

## Focused Evidence

`npm run smoke:canonical-private-package-state-transaction` now passes `49`
checks, including:

- deterministic and real process-crash recovery at both failure commit stages;
- one release and one terminal receipt under exact replay;
- separate-process failure convergence;
- completion/failure terminal-race exclusivity;
- failure-WAL tamper and projection-drift refusal without overwrite;
- expired-attempt fencing;
- user-review blocking without automatic retry;
- retry allowance followed by immutable exhaustion;
- versioned failed-attempt internal-cost persistence and receipt binding; and
- absence of plaintext claim credentials, bearer tokens, paths, signed URLs,
  raw failure data, or production authority.

`npm run smoke:canonical-cloud-dispatch-outbox-receivers` now passes `21` checks,
including concurrent failure replay, changed evidence and principal refusal,
post-commit retry refusal, one server-selected retry, final exhaustion, replay
of the first immutable failure after the later attempt, and cost/commercial
separation.

The package queue, service-identity verifier, cloud-handoff, internal-cost,
server typecheck, and diff-integrity focused checks also pass. Aggregate v12
pipeline evidence, including the later accepted-worker timeout follow-up, is recorded in
`docs/canonical-private-pipeline-verification.md` after the exact full command.

## Aggregate Verification

The current exact-code v12 full internal pipeline passed all `32/32` stages
with exit code `0`. It preserves this failure evidence while adding mutually
exclusive accepted-worker timeout reconciliation and later-attempt fencing.
See
`docs/canonical-private-worker-timeout-reconciliation-verification-2026-07-17.md`.

The preceding exact-code full internal pipeline passed all `32/32` stages with exit code
`0` under schema `canonical-private-pipeline-verification-v11`:

- started: `2026-07-17T14:08:50.714Z`;
- finished: `2026-07-17T14:36:56.937Z`;
- duration: `1,686,223 ms`;
- package claim/completion/failure transaction recovery: `6,660 ms`;
- 50-tool cloud handoff: `436 ms`;
- cryptographic service identity: `529 ms`;
- completion/failure-aware outbox receivers: `1,306 ms`;
- three-source private composition: `562,364 ms`;
- professional color execution: `611,537 ms`;
- bounded UHD Remotion stream: `103,790 ms`;
- active named-edit Playwright journey: `11/11` tests in `15,397 ms`; and
- maximum-eight-source signed-in review: `357,513 ms`.

The final stage completed `27/27` server-derived work items/jobs, authenticated
and accepted a `3840x2160`, 16-second private review, and preserved all eight
source-bound audio identities in approved order. Exactly `50` canonical E2E
and `50` job-adapter tool identities remained verified. Every distributed,
live-cloud, provider, customer-commercial, deployment, public-delivery,
external-beta, and paid-production boundary remained false.

## Explicit Boundaries

The following remain false or unimplemented:

- distributed database queue/outbox/failure transaction;
- multi-host or multi-replica claim and terminal-state coordination;
- deployed worker failure callback and HTTP authorization-header adapter;
- live Google key retrieval, workload identity, IAM, Cloud Tasks, or Cloud Run;
- automatic retry dispatch, dead-letter handling, and production observability;
- durable database cost-event reconciliation or invoice reconciliation;
- provider activation, production render, customer billing/wallet mutation,
  remote Supabase, deployment, public delivery, external beta, and paid
  production.

## Next Gate

The next authorized production-facing gate would require one reviewed
distributed transaction/RPC for queue, outbox, attempt, completion/failure/timeout,
and immutable response authority; deployed Google identity verification and
IAM; private object transport; dead-letter and worker-death reconciliation;
multi-replica fault tests; and controlled staging evidence. None of those
actions is authorized by this verification.
