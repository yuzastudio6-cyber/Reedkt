# Canonical Private Worker Completion Reconciliation Verification — 2026-07-17

Status: `single_host_crash_consistent_completion_verified_live_cloud_blocked`

## Outcome

ReEditPro now has a bounded private worker-completion boundary after controller
and worker identity acceptance. One accepted package attempt can reconcile one
exact completed queue outcome with one terminal Cloud-dispatch outbox receipt.
Both projections share the existing package-scoped cooperative lock and one
checksum-protected write-ahead commit, so a cooperating Node process can exit
after commit or after queue replacement without creating a second completion or
another package attempt.

This is local/private architecture evidence. It does not call a tool, provider,
Cloud Task, Cloud Run Job, GCS, Supabase, billing system, wallet, render service,
or deployment API. It does not prove distributed database atomicity, live Google
identity/IAM, private cloud object transport, multi-replica recovery, external
beta, public delivery, or production readiness.

## Exact Completion Flow

```text
server-selected package attempt
  -> crash-consistent queue claim + opaque dispatch outbox entry
  -> exact controller receipt
  -> exact worker receipt
  -> accepted worker returns bounded completion evidence
  -> immutable job derives the queue outcome
  -> one completion WAL commits queue completion + terminal outbox receipt
  -> restart recovery applies only a missing projection
  -> exact replay returns the existing receipt without another attempt
```

The completion request must bind all of the following:

- dispatch intent, job, delivery attempt, queue claim ID, and queue claim hash;
- the exact accepted worker receipt and the same verified service principal;
- private artifact ID, content type, and SHA-256;
- private artifact-manifest, QA, asset-reconciliation, and downstream-lease
  evidence hashes;
- literal passed/reconciled/verified evidence states; and
- one attempt-level internal production-cost evidence hash.

The queue outcome is derived from the immutable approved job definition. The
worker cannot substitute its approved work-item identity, dependency set,
required disposition, or job identity.

## Identity And Replay

Completion accepts only the existing non-serializable process-branded worker
identity capability. The current identity must still verify issuer, audience,
service-account principal, subject, issue/expiry time, and verifier mode, and it
must match the principal recorded by the accepted worker receipt.

The terminal receipt keeps the originally accepted worker identity projection.
This makes replay deterministic when the same service principal returns with a
fresh valid token after a process restart. A different principal, verifier mode,
audience, completion payload, cost-evidence hash, queue outcome, claim, or
attempt fails closed.

Late controller and worker transport redelivery after terminal completion
returns the original controller/worker receipts. It does not reactivate the
lease, increment the delivery attempt, or authorize execution.

## Crash And Concurrency Semantics

The completion write-ahead record uses schema
`canonical-private-package-completion-transaction-v1`. Its commit authority
contains the exact before/after queue and outbox hashes, job/attempt/claim,
accepted worker receipt, completion evidence/outcome, queue completion, outbox
entry transition, and terminal completion receipt.

Before commit, the semantic validator requires:

- one leased queue entry with the exact active claim;
- one `worker_identity_accepted` outbox entry for the same attempt;
- one transition to a completed queue entry carrying only the stored credential
  digest, never the plaintext claim credential;
- one transition to `worker_completion_reconciled` while preserving immutable
  entry, controller receipt, and worker receipt bytes;
- exactly one appended `job_completed` queue event;
- exactly one appended `worker_completion_reconciled` outbox event; and
- byte-identical unrelated queue and outbox entries.

Real child processes exit with code `78` immediately after the completion WAL
commit and immediately after queue projection. Restart recovery respectively
replays both projections or only the missing outbox projection. Two separate
Node processes racing the same completion converge on one `reconciled` result
and one `exact_replay` result.

Tampered completion WAL content, out-of-band projection drift, changed evidence,
changed identity, and expired attempts fail closed without overwriting unknown
state.

The sibling failure transaction is terminally exclusive with completion. A
completion/failure race commits exactly one result under the package lock; a
terminal failure cannot later become completion, and a completed attempt cannot
later be released as failed.

## Cost And Commercial Boundary

The receipt requires and hash-binds attempt-level internal production-cost
evidence. It deliberately contains no internal cost amount and grants no pricing
or settlement authority. Internal production cost remains separate from:

- customer price;
- customer credits;
- ReEditPro service fee or margin;
- wallet mutation;
- billing, charging, settlement, refund, or export-unlock authority.

The persisted boundary records
`customerPriceCreditsServiceFeeWalletOrBillingIncluded: false`. No fee, margin,
customer charge, credit spend, or wallet mutation was added or executed.

## Focused Evidence

`npm run smoke:canonical-cloud-dispatch-outbox-receivers` now passes 21 assertions,
including:

- one completion reconciliation and one exact concurrent replay;
- exact accepted-worker principal and attempt binding;
- changed completion evidence and changed identity rejection;
- terminal queue/outbox state with one package attempt;
- private artifact, QA, reconciliation, downstream-lease, and attempt-cost hash
  binding;
- late controller and worker redelivery replay after completion; and
- absence of bearer tokens, plaintext claim credentials, paths, prompts, signed
  URLs, media bytes, or commercial authority in persistence.

`npm run smoke:canonical-private-package-state-transaction` now passes 49
assertions, including:

- deterministic recovery at both completion commit stages;
- real process exit `78` and exact restart recovery at both stages;
- separate-process completion convergence;
- one queue completion event and one outbox completion event;
- tampered completion WAL and projection-drift refusal;
- expired-attempt completion refusal;
- mutually exclusive completion/failure terminal racing and reverse-transition
  refusal; and
- all prior claim/outbox crash, race, lock, mode, and tamper evidence.

`npm run typecheck:server` and the repository lint command also pass.

## Aggregate Verification

The current exact-code v12 full internal pipeline passed all `32/32` stages
with exit code `0`. It preserves this completion evidence while adding mutually
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
- completion/failure-aware outbox receivers: `1,306 ms`; and
- maximum-eight-source signed-in review: `357,513 ms`.

The completion proof remained terminally exclusive with the new failure path,
and exactly `50` canonical E2E plus `50` job-adapter identities remained
verified. All live cloud, distributed transaction, customer commercial,
provider, deployment, and public-delivery gates stayed false.

The preceding v10 exact-code canonical private pipeline passed all `26/26` stages with exit
code `0` under schema `canonical-private-pipeline-verification-v10`:

- started: `2026-07-17T12:23:05.305Z`;
- finished: `2026-07-17T12:44:24.145Z`;
- duration: `1,278,840 ms`;
- package-state transaction and completion recovery: `4,063 ms`;
- 50-tool cloud handoff: `402 ms`;
- cryptographic service identity: `398 ms`;
- completion-aware outbox receivers: `925 ms`; and
- exactly `50` canonical E2E and job-adapter identities.

The preceding broader exact-code internal regression passed all `32/32` stages with exit
code `0` under the same v10 schema:

- started: `2026-07-17T12:44:36.442Z`;
- finished: `2026-07-17T13:12:07.454Z`;
- duration: `1,651,012 ms`;
- package-state transaction and completion recovery: `3,965 ms`;
- 50-tool cloud handoff: `397 ms`;
- cryptographic service identity: `561 ms`;
- completion-aware outbox receivers: `920 ms`; and
- signed-in maximum-eight-source private review: `372,731 ms`.

The full regression completed `27/27` private work items/jobs, produced and
authenticated a `3840x2160`, 16-second private review, preserved all eight
approved source-bound audio identities in order, and persisted acceptance.
Both aggregate reports explicitly kept live Google worker completion,
distributed queue/outbox atomicity, provider activation, customer
billing/wallet mutation, remote Supabase, deployment, public delivery, external
beta, and paid production false.

## Remaining Production Gate

The local worker-completion algorithm is now defined and crash-tested. A live
path still requires one reviewed distributed transaction/RPC for queue, outbox,
attempt, and completion authority; a supported Google identity/key-rotation
adapter; deployed private controller and worker IAM; generation-bound private
GCS transport; dead-letter and worker-death recovery; multi-replica tests;
observability; and controlled staging evidence. None is authorized by this
verification.
