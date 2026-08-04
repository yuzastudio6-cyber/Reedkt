# Canonical Private Durable Package Work Queue Verification — 2026-07-16

Status: `verified_private_single_host_cross_process_restart_safe_distributed_cloud_blocked`

## Outcome

ReEditPro's canonical work-graph orchestrator now has a durable package-scoped
queue between immutable approval/resource placement and the existing
single-job adapter. A host restart no longer requires the orchestrator to call
every already-completed adapter again to reconstruct graph state.

This is a private/local blocker-reduction milestone. It does not deploy a
Google Cloud queue or worker, prove a distributed transaction, activate a
provider, call remote Supabase, charge a customer, mutate a wallet, publish an
artifact, deploy the product, or establish an editing-time SLA.

## Immutable Queue Definition

The queue definition is deterministically derived from:

- package, workspace, project, edit-session, and approved-snapshot identity;
- exact package, snapshot, and work-graph hashes;
- exact placement-manifest, tool-execution-authority, and approved
  resource-placement-authority hashes;
- canonical job order and dependency IDs;
- approved work-item identity and required status;
- worker type, resource class, planned cloud target, accelerator, and exact
  placement hash;
- private-execution/provider disposition and required gate;
- immutable maximum attempts, attempt timeout, and approved schedule.

The browser cannot supply or change any of those fields. A current package or
placement mismatch creates a different definition and the persisted aggregate
fails closed.

## Claim And Recovery Lifecycle

For each exact entry, the private store:

1. admits a claim only after worker-type, private-capability, approved-schedule,
   dependency-completion, and maximum-attempt checks pass;
2. permits one active claim under a cooperative cross-process, same-host
   package lock;
3. returns a random 256-bit base64url credential to the controller and stores
   only its SHA-256 digest plus a hashed worker identity;
4. binds the claim to worker type, resource class, placement hash, delivery
   attempt, lease deadline, and operation-attempt deadline;
5. heartbeats with timing-safe credential verification;
6. completes only an exact job/work-item/dependency/artifact outcome or
   releases the claim for a bounded retry/failure disposition;
7. treats exact credential-bound completion/release replay as read-only;
8. recovers an expired claim to queued state, increments the immutable attempt
   history, and rejects the stale claim before issuing a fresh credential; and
9. treats completed entries as terminal and rehydrates them on the next
   orchestrator instance without adapter execution.

Plaintext claim credentials and plaintext worker identity are never persisted.
Credential digests are intentionally persisted so heartbeat, completion, and
release can be verified without retaining the secret.

## Persistence Integrity

The tenant/package-scoped private aggregate uses:

- atomic private-file replacement;
- an outer envelope checksum;
- aggregate, entry, claim, completion, and release hashes;
- exact reconciliation against the immutable queue definition; and
- an append-only, sequence-checked, hash-chained event history.

The bounded aggregate is limited to 256 jobs, ten approved attempts per job,
8,192 events, and 8 MiB. The event bound covers the maximum approved-attempt
lifecycle without silently growing an unbounded local log.

Every queue read and mutation now acquires the shared package-state lock and
recovers any committed queue/outbox write-ahead record first. A real
two-process race proves one generic claim winner. The lock is private,
no-follow, hard-link published only after its owner record is fully written,
and reclaimable only when the recorded same-host PID is no longer alive.

## Work-Graph Integration

New work-graph responses use
`canonical-private-work-graph-run-response-v3`. Queue evidence reports the
definition and aggregate hashes, queued/leased/completed counts, recovered
completions, current-run claims/completions/releases, expiry recovery, and the
explicit non-production boundaries.

The response schema requires:

- queue and work-graph total/completed counts to agree;
- every current-run claim to terminate in completion or release;
- durable completed count to equal recovered completions plus current-run
  completions and race-safe terminal replays; and
- recovered completion count not to exceed the response's replayed outcomes.

Persisted v2 private/local responses remain readable. No queue route was added,
and no browser response contains a claim credential, credential digest, worker
identity hash, job definition, filesystem path, command, or cloud authority.

## Verified Evidence

The following pass on the exact implementation:

- `npm run typecheck:server`
- `npm run smoke:canonical-private-package-work-queue`
- `npm run smoke:canonical-private-package-state-transaction`
- `npm run smoke:edit-planning-authority`
- `npm run smoke:canonical-private-tool-dispatch`
- `REEDITPRO_SOURCE_SLICE_LONG_FORM_PROOF=1 ./node_modules/.bin/tsx server/smoke/canonical-private-long-form-execution-smoke.ts`
- `npm run qa:internal-pipeline`

The focused queue smoke verifies five jobs across completed, dependency-blocked,
capability-blocked, scheduled, expired/reclaimed, and attempt-exhausted states.
It proves one concurrent claim winner, wrong-credential rejection, heartbeat,
credential-bound idempotent replay, restart recovery, stale-worker fencing,
terminal immutability, tenant isolation, event chaining, checksum tamper
rejection, and recomputed-hash placement substitution rejection.

The package-state transaction smoke additionally launches separate Node
processes and proves one generic claim winner plus one server-selected atomic
claim/outbox commit. It combines deterministic interruption with real child
process exits after write-ahead publication and after queue projection,
recovers the exact missing projections, refuses tampered recovery bytes and
out-of-band projection drift, reclaims a truly killed same-host lock owner, and
refuses a lock-target symlink.

The route-level planning smoke proves the orchestrator creates the v3 evidence,
completes two jobs, leaves exact blocked descendants queued, recovers those two
completions on later runs, and reaches immutable attempt exhaustion without a
new adapter claim.

The exact post-change source-slice run passed in `409,611 ms`. Its eight-job
graph used two passes and nine total claims: pass two recovered five terminal
jobs without calling their adapters, then claimed the remaining retryable
chunk, finalizer, and final-QA jobs. The final queue held eight completed, zero
queued, and zero leased entries. It produced a 31,730,928-byte, 660-frame,
3840×2160 H.264/AAC master that passed independent QA, content-stable replay,
private-download integrity, and source-audio continuity at both technical
boundaries.

The exact-code complete tool-dispatch smoke also passed with exit code 0. It
reverified all 50 server-proven tool identities through their approved private
canonical lifecycle and all 19 exact runner families. Its terminal eight-job
review graph explicitly asserted eight completed, zero queued, and zero leased
queue entries; a fresh work-graph service recovered all eight terminal jobs
with zero new claims and zero scheduler executions.

The exact-code full internal regression passed all 28 of 28 stages with exit
code 0 from `2026-07-17T00:53:09.135Z` through
`2026-07-17T01:28:42.983Z` in `2,133,848 ms`. The queue stage passed in
`579 ms`; the three-source canonical execution passed in `579,008 ms`; the
professional color execution passed in `704,254 ms`; the bounded UHD Remotion
streaming proof passed in `113,863 ms`; and the signed-in maximum-eight-source
private-review regression passed in `690,806 ms`. Its terminal accepted review
was a 1,086,192-byte, 3840x2160, 16-second private result with all eight
source-bound audio identities preserved in approved order. The report kept
provider activation, billing/wallet mutation, remote Supabase, public delivery,
deployment, external-beta readiness, and paid-production readiness false.

The historical default mode of that standalone file did not reach queue
execution: eight three-second fixture inputs still expect 720 frames while the
current mock planner emits 360. That pre-existing fixture/planner mismatch is
reported, not converted into passing evidence. The maintained signed-in
maximum-eight-source workflow remains covered by the authoritative full
pipeline regression.

## Honest Boundary And Next Gate

The cooperative file lock now proves cross-process atomic claims for Node
processes on one host. It is not a shared-filesystem lease, hostile same-UID
boundary, host-power/filesystem-failure proof, or database transaction.
Therefore these gates remain false:

- distributed transaction;
- multi-host and multi-replica claim authority;
- cloud service identity;
- Google Cloud dispatch; and
- production authority.

The next infrastructure gate is a reviewed distributed queue/transaction
authority with authenticated service identity, exact immutable-message
binding, dead-letter/reconciliation policy, private object transport, and
deployed concurrency/failure evidence. The bounded
`canonical-cloud-worker-dispatch-handoff-v1` contract now defines the exact
regional Cloud Tasks -> private controller -> Cloud Run Jobs handoff and binds
all 50 proven tools to their frozen target class. It deliberately leaves live
outbox, OIDC/IAM, job deployment, object transport, dead-letter handling,
capacity, and benchmark evidence false. See
`docs/canonical-cloud-worker-dispatch-handoff-verification-2026-07-17.md` and
`docs/canonical-private-package-state-transaction-verification-2026-07-17.md`.

Only after those remaining live checks exist can local runner evidence support
a Google Cloud throughput or customer ETA claim.

This queue improves reliability and prevents completed-work re-execution after
restart. It does not itself make a 30-minute edit complete in 10–20 minutes;
that target still requires deployed CPU/GPU/render workers, representative
multi-hour workload benchmarks, capacity controls, and calibrated ETA models.
