# Canonical Private Package-State Transaction Verification — 2026-07-17

Status: `single_host_terminal_reconciliation_and_server_resolved_timeout_cost_verified_distributed_database_blocked`

## Outcome

ReEditPro now selects the package delivery attempt on the server and commits
the queue claim together with its Cloud-dispatch outbox entry. The private
single-host implementation uses one package-scoped cooperative cross-process
lock and one checksum-protected write-ahead record as the commit point. Queue
and outbox JSON files are projections of that committed record until both have
been atomically replaced and checksum-verified.

The same lock and recovery protocol now owns a second transaction kind for an
accepted worker result. It commits the exact leased queue entry as completed
together with one terminal `worker_completion_reconciled` outbox receipt. The
receipt binds the accepted worker principal, private artifact, QA,
reconciliation, downstream-lease, and attempt-level internal production-cost
evidence without granting customer price, credits, service fee, wallet,
billing, or settlement authority.

A third transaction kind now reconciles an accepted worker's bounded
pre-commit failure. It commits one exact queue-claim release together with one
terminal `worker_failure_reconciled` outbox receipt, derives retry availability,
attempt exhaustion, or user review from the immutable job, and refuses
post-commit retry.

A fourth transaction kind now reconciles an accepted worker whose exact queue
lease expired before a committed result. A later attempt remains fenced until
the same accepted controller principal atomically commits one
`expired_claim_recovered` queue release and one terminal
`worker_timeout_reconciled` receipt. Timeout retry/exhaustion is derived from
the immutable attempt ceiling and never starts automatically. Completion,
failure, and timeout are mutually exclusive terminal states under the same
package lock. The timeout path also loads and verifies the exact persisted
attempt-cost record while holding that lock; no caller-supplied cost hash is
accepted.

This closes the former local crash windows where either a queue claim could
persist without an outbox entry or a queue completion or failure/timeout release
could persist without its terminal outbox receipt. It also closes lost-update races
between cooperating Node processes on the same host. It does not claim a
distributed database
transaction, shared-filesystem lock, multi-replica authority, Cloud Tasks
creation, Cloud Run execution, provider activation, customer charging, remote
Supabase, deployment, public delivery, external beta, or production readiness.

## Commit And Recovery Protocol

For one package-scoped mutation:

1. acquire the private package lock through an atomically published,
   fully-written hard-link owner record;
2. recover any committed write-ahead record before reading queue or outbox;
3. validate the immutable queue definition, dependencies, schedule, placement,
   attempt ceiling, worker class, and active state;
4. create one opaque queue claim and one exact dispatch outbox entry in memory;
5. cross-check the queue/outbox aggregate authority, atomically publish one
   write-ahead record containing both complete after projections and their
   before/after checksums, then re-read its exact bytes;
6. replace the queue projection;
7. replace the outbox projection;
8. re-read and verify both exact after checksums; and
9. remove only the exact checksum- and inode-validated recovery record.

The write-ahead publication is the commit point. A cooperating process exit
before it leaves the queue and outbox unchanged. A process exit after it can
leave neither, one, or both projections updated; the next package reader or
writer replays only the missing projection. If either projection matches
neither its committed before nor after checksum, recovery fails closed instead
of overwriting unknown state.

Worker completion uses the same sequence with a versioned
`canonical-private-package-completion-transaction-v1` record. Before publishing
that record, semantic validation proves one exact leased claim becomes one
completed queue entry, one accepted-worker outbox entry becomes one terminal
completion receipt, immutable controller/worker receipts remain byte-identical,
unrelated entries remain unchanged, and exactly one queue event plus one outbox
event are appended.

Worker failure uses
`canonical-private-package-failure-transaction-v1`. Semantic validation proves
one exact leased claim becomes one digest-only queue release, one accepted
worker attempt becomes one terminal failure receipt, one release event plus one
failure event are appended, immutable/unrelated bytes do not change, and
server-derived retry/review authority matches the approved attempt ceiling.
Post-commit evidence cannot enter this transaction.

Accepted-worker timeout uses
`canonical-private-package-timeout-transaction-v1`. Semantic validation proves
the accepted outbox attempt still owns the exact expired queue claim, the same
accepted controller principal authorizes reconciliation, the queue receives one
server-derived timeout release, the outbox receives one terminal timeout
receipt, exactly one event is appended to each projection, and unrelated state
does not change. No later attempt can be selected before this commit.

This evidence covers Node-process interruption and restart on one local host.
It does not prove sudden host-power loss, storage-controller/filesystem failure,
or directory-entry durability across those failures; those require a deployed
database/object-store durability design and controlled fault testing.

## Cross-Process Lock

The lock candidate is written, permission-hardened to `0600`, and synced before
it is hard-linked into the canonical lock path. Another process therefore
cannot observe a partially initialized owner record. Lock directories remain
`0700`, target and ancestor symlinks are refused, and normal release verifies
the exact owner ID plus device/inode identity.

A real child-process termination test proves same-host dead-owner recovery.
The next process reclaims only a valid lock whose PID is no longer alive. PID
reuse fails closed as busy, which favors safety over availability. This is a
cooperative same-host primitive; it does not protect against a hostile same-UID
filesystem actor and is not a distributed lock.

## Secret And Authority Boundary

The queue still generates a random 256-bit claim credential, but the durable
queue stores only its digest and the outbox stores only claim/authority hashes.
The write-ahead record contains the same private queue/outbox projections and
does not persist the plaintext credential, caller bearer token, media path,
prompt, signed URL, provider credential, or worker command.

The outbox controller and worker receipts revalidate the exact active queue
attempt while holding the same package-state lock that serializes their outbox
mutation. Completion additionally requires the exact accepted worker receipt
and same process-branded service principal. The server no longer accepts a
caller-selected delivery-attempt number at the enqueue boundary.

Failure reconciliation accepts only a safe category/code, execution-state
marker, failure-detail hash, and attempt-level internal-cost evidence hash. It
does not accept or persist raw failure messages, logs, stacks, local paths, or
credentials. A deterministic DeepFilterNet failure proof creates the existing
versioned private internal-cost record, binds its hash to the terminal receipt,
and keeps customer price, credits, service fee, wallet, billing, and settlement
authority absent.

Timeout reconciliation accepts only the opaque dispatch intent and the
process-branded accepted controller principal. It explicitly rejects a
caller-supplied cost hash. The server loads the exact create-only cost record by
dispatch intent and verifies tenant, snapshot, work item, job, retry, tool,
operation, failed-timeout outcome, accepted-worker time window, and replay
hash before it derives the timeout category/code, exact
expired claim, heartbeat/deadline evidence, release reason, remaining attempt
allowance, and reconciliation timestamp. A deterministic DeepFilterNet timeout
proof binds a versioned failed `timeout` internal-cost record to the terminal
receipt while keeping every customer commercial field absent.

## Focused Evidence

`npm run smoke:canonical-private-package-state-transaction` passes and proves:

- deterministic fault injection and a real child process exiting with code 77
  immediately after write-ahead commit both replay both projections;
- deterministic fault injection and a real child process exiting with code 77
  after queue replacement both replay only the missing outbox;
- both recoveries preserve exactly one delivery attempt and one outbox entry;
- write-ahead recovery cross-checks the transaction kind, queue claim identity
  and hash, dispatch intent, outbox entry identity and hash, and absence of a
  preexisting same-intent entry before applying either projection;
- an expired accepted-worker attempt leaves queue and outbox unchanged and
  returns `stale_attempt_reconciliation_required` until exact atomic timeout
  reconciliation succeeds;
- deterministic interruption plus real child-process exit with code `80` at
  both timeout commit stages recover one queue release and one terminal timeout
  receipt;
- separate-process timeout races converge on one reconciliation plus exact
  replay;
- completion, failure, and timeout races commit exactly one mutually exclusive
  terminal outcome, and a terminal timeout cannot later become completion or
  failure;
- timeout-WAL tampering, timeout projection drift, pre-expiry reconciliation,
  and a changed controller principal fail closed;
- missing, checksum-tampered, and validly checksummed but attempt-mismatched
  timeout cost records fail closed without changing queue or outbox bytes;
- a first reconciled timeout exposes only the one remaining approved attempt,
  a later explicit server enqueue allocates it, and a second reconciled timeout
  persists `attempts_exhausted` without a third outbox entry;
- a tampered write-ahead record fails before either projection changes;
- out-of-band queue drift fails without overwrite;
- transaction-only queue/outbox reads reject a forged or inactive lock
  capability;
- two separate Node processes racing the generic queue create one claim;
- two separate Node processes racing atomic dispatch create one claim, one
  attempt, and one outbox entry (`created` plus `exact_replay`);
- deterministic interruption plus real child-process exit with code `78` after
  completion WAL commit replay both completion projections;
- deterministic interruption plus real child-process exit with code `78` after
  queue completion replay only the missing terminal outbox receipt;
- two separate Node processes racing the exact completion create one
  `reconciled` result and one `exact_replay` result;
- completion-WAL tampering, completion projection drift, changed evidence, and
  expired-attempt completion fail closed without another attempt;
- deterministic interruption plus real child-process exit with code `79` at
  both failure commit stages recover one queue release and one terminal failure
  receipt;
- separate-process failure races converge on one reconciliation plus exact
  replay;
- completion versus failure commits exactly one mutually exclusive terminal
  outcome, and neither terminal state can later become the other;
- failure-WAL tampering, failure projection drift, expired-attempt failure,
  changed failure evidence, and changed worker identity fail closed;
- retry availability advances through only the remaining approved attempt,
  final exhaustion persists, and `unknown_internal` blocks for user review;
- failed and timed-out DeepFilterNet attempt-cost evidence uses the versioned
  mock-safe rate card and remains separate from all customer commercial fields;
- a real killed lock-owner child is safely reclaimed;
- a lock-target symlink is refused without changing its external target;
- queue, outbox, write-ahead, and lock files are `0600`; and
- distributed database, Google Cloud execution, and production authority stay
  false.

The focused transaction smoke now passes `51` checks.
`npm run smoke:canonical-private-package-work-queue`,
`npm run smoke:canonical-cloud-dispatch-outbox-receivers`,
`npm run smoke:private-local-persistence`, and `npm run typecheck:server` also
pass after the integration.

## Historical Aggregate Verification

Before the durable-start/finalizer follow-up, the full internal pipeline passed
all `32/32` stages with
exit code `0` under schema `canonical-private-pipeline-verification-v13`. It
started at `2026-07-17T21:17:11.077Z`, finished at
`2026-07-17T21:47:27.541Z`, and completed in `1,816,464 ms`.
The package-state report now asserts crash-consistent completion, failure, and
accepted-worker timeout reconciliation, later-attempt fencing until timeout
reconciliation, and versioned timed-out-attempt internal-cost evidence. The
package-state phase completed in `10,073 ms`, and the timeout-aware outbox
receiver stage completed in `1,571 ms`; the same run
completed the bounded 27-job maximum-eight-source signed-in private review in
`357,508 ms` and preserved exactly 50 canonical E2E plus 50 job-adapter
identities. Distributed database/cloud authority and all production-only gates
remained false.

That v13 report is historical for the newer attempt-start/finalizer source. The
51-check transaction smoke, 31-check receiver smoke, and focused cost/type/lint
checks are current; the v14 aggregate has not yet been run.

The preceding exact-code v12 pipeline also passed all `32/32` stages. Its
timeout-aware receiver completed in `1,577 ms`, and its maximum-eight-source
signed-in review completed in `382,429 ms`. It remains historical pre-Docker-
transport-hardening evidence.

The preceding exact-code full internal pipeline passed all `32/32` stages with
exit code `0` under schema `canonical-private-pipeline-verification-v11`:

- started: `2026-07-17T14:08:50.714Z`;
- finished: `2026-07-17T14:36:56.937Z`;
- duration: `1,686,223 ms`;
- package claim/completion/failure transaction recovery: `6,660 ms`;
- 50-tool cloud handoff: `436 ms`;
- cryptographic service identity: `529 ms`;
- completion/failure-aware outbox receivers: `1,306 ms`; and
- signed-in maximum-eight-source private review: `357,513 ms`.

The final stage completed `27` private work items and jobs, produced and
authenticated a `3840x2160`, 16-second private review, preserved all eight
approved source-bound audio identities in order, and persisted review
acceptance. Exactly `50` canonical E2E and `50` job-adapter identities remained
verified. Distributed queue/outbox terminal transactions, live Google identity
and cloud execution, providers, customer billing/wallet mutation, remote
Supabase, deployment, public delivery, external beta, and paid production all
remained false.

The preceding v10 exact-code canonical pipeline passed all `26/26` stages with
exit code `0` under schema `canonical-private-pipeline-verification-v10`:

- started: `2026-07-17T12:23:05.305Z`;
- finished: `2026-07-17T12:44:24.145Z`;
- duration: `1,278,840 ms`;
- package-state transaction and completion recovery: `4,063 ms`;
- 50-tool cloud handoff: `402 ms`;
- cryptographic service identity: `398 ms`;
- completion-aware outbox receivers: `925 ms`; and
- exactly `50` canonical end-to-end and job-adapter identities.

The preceding broader exact-code internal regression passed all `32/32` stages
with exit code `0` under the same v10 schema:

- started: `2026-07-17T12:44:36.442Z`;
- finished: `2026-07-17T13:12:07.454Z`;
- duration: `1,651,012 ms`;
- package-state transaction and completion recovery: `3,965 ms`;
- 50-tool cloud handoff: `397 ms`;
- cryptographic service identity: `561 ms`;
- completion-aware outbox receivers: `920 ms`; and
- signed-in maximum-eight-source private review: `372,731 ms`.

The final full-regression stage completed `27` private work items and jobs,
produced and authenticated a `3840x2160`, 16-second private review, preserved
all eight approved source-bound audio identities in order, and persisted review
acceptance. Both aggregate reports explicitly kept the distributed queue/outbox
transaction, live Google identity and cloud execution, provider activation,
customer billing/wallet mutation, remote Supabase, deployment, public delivery,
external beta, and paid production false.

## Remaining Distributed Gate

Live Cloud Tasks creation remains closed until one reviewed database
transaction or RPC atomically couples authenticated tenant authority, exact
package-attempt allocation, queue mutation, outbox insertion, immutable
message/response identity, and audit evidence across replicas. Controlled
staging must then prove rollback, duplicate delivery, worker death, retry,
dead-letter reconciliation, regional private object transport, live Google
OIDC/key rotation, Invoker/Jobs Developer IAM, observability, and recovery.

The follow-up private runtime now persists a durable attempt-start/cost binding
and provides a controller-owned package timeout finalizer for the explicitly
metered DeepFilterNet, Remotion, and FFmpeg workloads. A worker that dies after
that start but before terminal evidence can therefore be reconciled on one host
without caller-selected job identity. Unmetered tools remain blocked, and a
deployed distributed worker-death observer, database transaction/RPC, and
multi-replica proof are still required. See
`docs/canonical-private-worker-timeout-finalizer-verification-2026-07-17.md`.

The local claim, completion, failure, and accepted-worker timeout write-ahead proofs are
production-architecture
precursors, not substitutes for that distributed evidence. See
`docs/canonical-private-worker-completion-reconciliation-verification-2026-07-17.md`
and
`docs/canonical-private-worker-failure-reconciliation-verification-2026-07-17.md`,
plus
`docs/canonical-private-worker-timeout-reconciliation-verification-2026-07-17.md`.
