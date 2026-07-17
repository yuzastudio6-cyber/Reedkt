# Canonical Private Package-State Transaction Verification — 2026-07-17

Status: `single_host_crash_consistent_cross_process_verified_distributed_database_blocked`

## Outcome

ReEditPro now selects the package delivery attempt on the server and commits
the queue claim together with its Cloud-dispatch outbox entry. The private
single-host implementation uses one package-scoped cooperative cross-process
lock and one checksum-protected write-ahead record as the commit point. Queue
and outbox JSON files are projections of that committed record until both have
been atomically replaced and checksum-verified.

This closes the former local crash window where a queue claim could persist
without an outbox entry. It also closes lost-update races between cooperating
Node processes on the same host. It does not claim a distributed database
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

The outbox controller and worker receipts now revalidate the exact active queue
attempt while holding the same package-state lock that serializes their outbox
mutation. The server no longer accepts a caller-selected delivery-attempt
number at the enqueue boundary.

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
- an expired active attempt advances exactly once to the next approved attempt,
  while a second expiry persists terminal `attempts_exhausted` state without
  creating another outbox entry;
- a tampered write-ahead record fails before either projection changes;
- out-of-band queue drift fails without overwrite;
- transaction-only queue/outbox reads reject a forged or inactive lock
  capability;
- two separate Node processes racing the generic queue create one claim;
- two separate Node processes racing atomic dispatch create one claim, one
  attempt, and one outbox entry (`created` plus `exact_replay`);
- a real killed lock-owner child is safely reclaimed;
- a lock-target symlink is refused without changing its external target;
- queue, outbox, write-ahead, and lock files are `0600`; and
- distributed database, Google Cloud execution, and production authority stay
  false.

The strengthened smoke passed four additional concurrent stress repetitions on
the exact implementation. `npm run smoke:canonical-private-package-work-queue`,
`npm run smoke:canonical-cloud-dispatch-outbox-receivers`,
`npm run smoke:private-local-persistence`, and `npm run typecheck:server` also
pass after the integration.

## Aggregate Verification

The exact-code canonical private pipeline passed all `26/26` stages with exit
code `0` under schema `canonical-private-pipeline-verification-v9`:

- started: `2026-07-17T10:53:30.311Z`;
- finished: `2026-07-17T11:14:32.796Z`;
- duration: `1,262,485 ms`;
- package-state transaction: `2,072 ms`;
- 50-tool cloud handoff: `394 ms`;
- cryptographic service identity: `380 ms`;
- durable outbox receivers: `768 ms`; and
- exactly `50` canonical end-to-end and job-adapter identities.

The broader exact-code internal regression then passed all `32/32` stages with
exit code `0` under the same v9 schema:

- started: `2026-07-17T11:14:45.729Z`;
- finished: `2026-07-17T11:42:08.792Z`;
- duration: `1,643,063 ms`;
- package-state transaction: `2,096 ms`;
- 50-tool cloud handoff: `400 ms`;
- cryptographic service identity: `385 ms`;
- durable outbox receivers: `749 ms`; and
- signed-in maximum-eight-source private review: `357,731 ms`.

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

The local write-ahead proof is a production-architecture precursor, not a
substitute for that distributed evidence.
