# Canonical Cloud Dispatch Outbox And Receiver Verification — 2026-07-17

Status: `private_crash_consistent_terminal_reconciliation_and_server_resolved_timeout_cost_verified_live_distribution_blocked`

## Outcome

ReEditPro now has a checksum-protected, restart-safe private outbox contract
whose package attempt is selected by the server and committed atomically with
the outbox entry through a private write-ahead record. The same contract
defines the exact identity and authority checks for the controller and worker
receiver, and now defines mutually exclusive terminal accepted-worker
completion, pre-commit failure, and controller-authenticated lease-timeout receipts,
without creating a Cloud Task, starting a Cloud Run Job, executing a tool, or
making a network call.

This is the dependency-safe source contract needed before a distributed
database transaction and Google identity verifier can be connected. It is not
a deployed distributed outbox and is not live Google OIDC/IAM proof.

## Exact Attempt Flow

```text
immutable funded package queue
  -> server selects one approved delivery attempt
  -> one write-ahead commit owns the opaque queue claim plus outbox entry
  -> queue and outbox projections recover together after interruption
  -> exact opaque Cloud Tasks body revalidation
  -> exact controller identity contract acceptance
  -> exact controller receipt and Cloud Run request hash
  -> exact worker invocation and workload-identity contract acceptance
  -> worker receiver receipt; no tool or media execution
  -> exact private artifact/QA/reconciliation/downstream/cost evidence
  -> one crash-consistent queue completion plus terminal outbox receipt
  OR bounded pre-commit failure + internal-cost evidence
  -> one crash-consistent queue release plus terminal failure receipt
  OR accepted worker lease expires before committed result
  -> later attempt remains fenced
  -> exact accepted controller reconciles derived timeout evidence
  -> server loads exact failed-timeout cost evidence under the package lock
  -> one crash-consistent queue release plus terminal timeout receipt
```

The package queue remains the sole owner of approved attempts. The enqueue API
does not accept a caller-selected attempt number. Under one package-scoped
cross-process lock, it validates the job, dependencies, schedule, placement,
worker type, resource class, attempt ceiling, manifest entry, region, task
body, and zero-hidden-retry Cloud Run request before committing the claim and
outbox together. The outbox stores the claim ID and its creation evidence but
never stores the plaintext claim credential.

Cloud Tasks redelivery reuses the same dispatch intent and package attempt.
Concurrent identical controller or worker deliveries produce one durable
receipt and one exact replay; they do not increment the package delivery
attempt and do not create another execution authority.

Concurrent identical completion deliveries likewise produce one terminal
reconciliation and one exact replay. The queue completion and terminal outbox
receipt share one completion write-ahead commit, so restart cannot turn a
persisted queue result into an untracked dispatch completion.

Concurrent identical failure deliveries produce one terminal failure
reconciliation and one exact replay. The queue release and terminal outbox
receipt share a failure write-ahead commit. The server derives retry
availability, final exhaustion, or user review from the immutable job and does
not automatically start another attempt.

An expired accepted-worker claim cannot silently advance. The enqueue boundary
returns `stale_attempt_reconciliation_required` without mutation until the
exact accepted controller principal reconciles that claim. Timeout
reconciliation derives retry/exhaustion from the immutable job, atomically
persists the queue release and terminal timeout receipt, and never starts the
next attempt automatically. Completion, failure, and timeout cannot jointly
terminalize the same claim.

## Durable Private Record

The outbox aggregate is scoped to owner, workspace, project, edit session,
package, and approved snapshot. Its path contains only tenant/package hashes.
It uses the shared private-local persistence boundary for:

- root-confined and symlink-refusing access;
- `0700` directories and a `0600` record;
- same-directory atomic replacement and durability sync;
- a checksum-protected aggregate;
- immutable per-attempt hashes;
- append-only hash-chained
  creation/controller/worker/completion/failure/timeout events;
  and
- bounded entries, events, and total bytes.

The persisted record contains opaque IDs, hashes, regional resource names,
non-secret service-account names, and receipts. It contains no raw media,
prompt, filesystem path, signed URL, authorization header, bearer token,
claim credential, provider credential, or worker command.

The queue and outbox now share one cooperative cross-process package lock. A
fully written hard-link owner record prevents partial lock publication, and a
dead same-host process can be reclaimed after exact owner-record validation.
One transient `0600` write-ahead record is the queue/outbox commit point for
claim/dispatch, accepted-worker completion, accepted-worker failure, or
accepted-worker timeout; the next reader replays either
missing projection and refuses checksum drift.

This proves Node-process interruption recovery and cooperating-process
serialization on one host. It does not prove sudden host-power/filesystem
failure, a database transaction, shared-filesystem lock, multiple API replicas,
hostile same-UID resistance, or distributed recovery.

## Controller Identity Contract

The controller accepts only trusted-verifier output supplied outside the task
body. The exact contract requires:

- Google issuer `https://accounts.google.com`;
- the server-owned Cloud Tasks service-account principal;
- the server-owned deployed-controller audience;
- verified email, issuer, audience, and expiry claims;
- an unexpired identity at the time of acceptance;
- the exact allowlisted opaque task body;
- the exact durable outbox attempt; and
- the exact hashed Cloud Run Jobs request.

Raw authorization headers and bearer tokens are neither accepted by this
service API nor persisted. The receiver now accepts only a non-serializable,
process-branded verifier capability; caller-authored evidence JSON and cloned
objects fail closed. Its valid controller and worker path uses an explicitly
labelled `trusted_jwks_contract_fixture` with an actual RS256 signature and a
bounded server-owned test JWKS snapshot. The snapshot records that no live
Google key fetch occurred, and `trusted_google_identity_verifier` remains
rejected until the live adapter is wired. See
`docs/canonical-service-identity-verifier-verification-2026-07-17.md`.

The controller receipt records only hashed identity binding, verifier evidence,
request binding, and Cloud Run request identity. It explicitly records that no
Cloud Run Jobs call occurred and that production dispatch is unauthorized.

## Worker Receiver Contract

The worker receiver requires:

- the exact controller receipt hash;
- dispatch intent, dispatch binding, and attempt-plan hashes;
- the exact current active package claim;
- the exact target worker service-account principal;
- the server-owned worker receiver audience; and
- unexpired trusted-verifier evidence.

The worker-acceptance receipt explicitly records that no tool, media, provider,
render, or worker execution started. The separate terminal completion receipt
requires the exact accepted worker principal, claim and attempt, private
artifact hash, private manifest, passed QA, asset reconciliation, downstream
lease verification, and attempt-level internal production-cost evidence hash.
It derives the queue result from the immutable job and grants no customer
price, credits, service fee, wallet, billing, or settlement authority.

A later Cloud Run bootstrap may load private package and artifact authority only
after the live workload-identity adapter, distributed transaction, private
object transport, worker lease/reconciliation, and deployment gates pass.

## Worker Failure Contract

The failure receiver requires the same accepted worker principal and exact
current claim. It accepts only a safe category/code, execution-state marker,
failure-detail hash, and internal-cost evidence hash. It never persists raw
failure messages, logs, stacks, media, paths, signed URLs, or credentials.

Retryable pre-commit categories can expose one new server-selected attempt only
inside the immutable approved maximum. Final exhaustion persists without a
third attempt. `authority_changed` and `unknown_internal` require user review.
Post-commit ambiguity never releases the claim or authorizes retry; it must use
completion reconciliation.

Focused proof also creates a failed DeepFilterNet attempt-cost record under
`private-internal-attempt-cost-evidence-v1` and
`rp-ratecard-01-mock-safe`, then binds the same evidence hash into the failure
receipt. Internal cost remains separate from customer price, credits, service
fee, wallet, billing, settlement, and charging authority.

## Accepted-Worker Timeout Contract

The timeout boundary is controller-authenticated because an expired worker is
not trusted to declare its own death. It requires the same accepted controller
service principal, exact accepted worker receipt, exact expired queue claim,
and immutable attempt deadline. The service rejects a caller-supplied cost
hash. While holding the same package lock, the server loads the private cost
record by dispatch intent and verifies exact tenant, snapshot, work item, job,
retry, tool, operation, failed-timeout outcome, accepted-worker time window,
and replay hash. The server derives `execution_timeout`,
`WORKER_LEASE_EXPIRED`, `failed_before_commit`, release reason, and the
remaining approved attempt allowance.

The versioned timeout receipt binds the initial and expired claim hashes,
heartbeat evidence, controller and worker receipts, timeout evidence, queue
release, cost evidence, and retry/exhaustion result. It persists no raw failure,
log, stack, media, path, prompt, signed URL, claim credential, token, price,
credit, fee, wallet, or billing material. A DeepFilterNet timeout proof uses the
existing versioned rate card and records `1,296` internal-cost micros with
future customer commercial authority still absent.

A missing record returns the dependency gate without queue/outbox mutation.
Checksum tampering and a validly checksummed but mismatched attempt identity
also fail closed. Exact replay re-reads the record and requires the already
committed timeout receipt to contain the same evidence hash.

## Focused Evidence

`npm run smoke:canonical-private-package-state-transaction` proves the commit
boundary, and `npm run smoke:canonical-cloud-dispatch-outbox-receivers` proves
the receiver state machine:

- the server creates one queue claim and one outbox entry in one write-ahead
  commit without accepting a caller attempt number;
- injected interruption plus real child-process exit after the commit point and
  after queue projection recover exactly one attempt and one outbox entry;
- separate Node-process races yield one generic queue claim and one atomic
  dispatch result plus one exact replay;
- dead-owner lock recovery, tampered transaction refusal, projection-drift
  refusal, forged lock-capability refusal, restrictive modes, and lock-target
  symlink refusal pass;
- restart readback and exact enqueue replay preserve identical bytes;
- concurrent controller redelivery yields one acceptance and one replay;
- concurrent worker redelivery yields one acceptance and one replay;
- concurrent worker completion yields one reconciliation and one exact replay;
- real process exits after completion commit and after queue completion recover
  exactly one queue result plus terminal outbox receipt;
- changed completion evidence, changed worker identity, expired attempts,
  tampered completion WAL content, and completion projection drift fail closed;
- concurrent worker failure yields one reconciliation and one exact replay;
- real process exits at both failure commit stages recover one release plus one
  terminal receipt;
- completion/failure races commit exactly one mutually exclusive terminal
  result;
- changed failure evidence/principal, stale attempts, tampered failure WAL,
  failure projection drift, and post-commit retry all fail closed;
- one first failure permits only the remaining approved attempt, the second
  persists exhaustion, and unknown internal failure persists user review;
- an expired accepted-worker attempt fences later enqueue without changing
  queue or outbox until exact timeout reconciliation;
- timeout crashes at both write-ahead stages, including real child exits with
  code `80`, recover one queue release and one terminal timeout receipt;
- separate-process timeout races converge on one reconciliation plus exact
  replay;
- completion/failure/timeout races commit exactly one terminal outcome, and a
  terminal timeout cannot later become completion or failure;
- pre-expiry timeout, wrong controller, timeout-WAL tamper, and timeout
  projection drift fail closed;
- missing, checksum-tampered, and validly checksummed but attempt-mismatched
  timeout cost records fail closed without queue/outbox mutation;
- the service rejects a caller-supplied timeout cost hash as authority;
- first timeout reconciliation exposes only one later explicit attempt and a
  second timeout persists exhaustion without a third outbox;
- timed-out DeepFilterNet cost evidence is loaded from the exact private record
  and stays internal-only and hash-bound;
- the failed-attempt cost record uses integer micros and the versioned rate card
  while all customer commercial authority stays false;
- the package queue advances exactly once to the outbox-bound delivery attempt;
- forged principal, audience, task body, controller receipt, worker principal,
  expired claim, cross-tenant scope, and tampered persisted bytes fail closed;
- the successful controller and worker paths use process-branded,
  cryptographically verified RS256 identities, while caller-authored verifier
  evidence is rejected;
- the outbox file is `0600` and contains no plaintext claim credential, bearer
  credential, internal audience URL, source path, or signed URL;
- Cloud Run internal retries remain zero; and
- network, Cloud Tasks, Cloud Run, worker execution, distributed transaction,
  live identity, and production authority all remain false.

The receiver smoke passes `23` checks and the package-state transaction smoke
passes `51` checks. The canonical pipeline runs this stage immediately after
the 50-tool cloud handoff contract. The handoff stage proves all 50 target
mappings. This focused stage uses one representative CPU attempt to prove the
generic outbox, receiver, and mutually exclusive terminal state machine. It does not claim that
a deployed task or terminal callback ran for each tool.

## Pipeline Verification

The current exact-code full internal pipeline completed all `32/32` stages with
exit code `0` under schema `canonical-private-pipeline-verification-v13`. It
started at `2026-07-17T21:17:11.077Z`, finished at
`2026-07-17T21:47:27.541Z`, and completed in `1,816,464 ms`. The package-state
phase completed in `10,073 ms`, and the timeout-aware receiver stage completed
in `1,571 ms`; the report explicitly
verified crash-consistent accepted-worker timeout reconciliation, later-attempt
fencing, and timed-out-attempt internal-cost evidence. Three-source composition
completed in `695,974 ms`, professional color in `615,010 ms`, bounded UHD
Remotion streaming in `96,703 ms`, all `11/11` named-edit browser tests in
`13,967 ms`, and the maximum-eight-source signed-in private review in
`357,508 ms`. Exactly 50 canonical
E2E plus 50 job-adapter identities remained verified. All distributed,
live-cloud, provider, commercial, deployment, public-delivery, external-beta,
and paid-production gates remained false.

The preceding exact-code v12 pipeline also passed all `32/32` stages. Its
timeout-aware receiver completed in `1,577 ms`, and the maximum-eight-source
signed-in private review completed in `382,429 ms`. It remains historical
pre-Docker-transport-hardening evidence.

The preceding exact-code full internal pipeline completed all `32/32` stages
with exit code `0` under schema `canonical-private-pipeline-verification-v11`:

- started: `2026-07-17T14:08:50.714Z`;
- finished: `2026-07-17T14:36:56.937Z`;
- duration: `1,686,223 ms`;
- package claim/completion/failure transactions: `6,660 ms`;
- cloud dispatch handoff: `436 ms`;
- cryptographic service identity: `529 ms`;
- completion/failure-aware outbox and receiver contract: `1,306 ms`;
- three-source composition: `562,364 ms`;
- professional color execution: `611,537 ms`;
- bounded UHD Remotion stream: `103,790 ms`;
- signed-in named-edit browser journey: `11/11` tests in `15,397 ms`; and
- maximum-eight-source signed-in review: `357,513 ms`.

The run preserved exactly `50` canonical E2E and `50` job-adapter tool
identities, completed `27/27` final private jobs, and accepted an integrity-
bound `3840x2160`, 16-second private review with all eight source-bound audio
identities in order. Product, external beta, live cloud, public delivery, and
paid-production readiness remained false.

The preceding v10 exact-code canonical private pipeline completed all `26/26`
stages with exit code `0` under schema
`canonical-private-pipeline-verification-v10`:

- started: `2026-07-17T12:23:05.305Z`;
- finished: `2026-07-17T12:44:24.145Z`;
- duration: `1,278,840 ms`;
- package-state transaction and completion recovery: `4,063 ms`;
- cloud dispatch handoff: `402 ms`;
- cryptographic service identity: `398 ms`;
- completion-aware outbox and receiver contract: `925 ms`;
- three-source canonical composition: `533,080 ms`;
- professional color execution: `604,722 ms`;
- bounded UHD Remotion stream: `99,414 ms`; and
- signed-in named-edit browser journey: `11/11` tests in `16,231 ms`.

The preceding broader exact-code internal regression completed all `32/32` stages
with exit code `0` under the same v10 schema:

- started: `2026-07-17T12:44:36.442Z`;
- finished: `2026-07-17T13:12:07.454Z`;
- duration: `1,651,012 ms`;
- package-state transaction and completion recovery: `3,965 ms`;
- cloud dispatch handoff: `397 ms`;
- cryptographic service identity: `561 ms`;
- completion-aware outbox and receiver contract: `920 ms`;
- three-source canonical composition: `529,890 ms`;
- professional color execution: `600,954 ms`;
- bounded UHD Remotion stream: `99,619 ms`;
- signed-in named-edit browser journey: `11/11` tests in `16,042 ms`; and
- maximum-eight-source signed-in private review: `372,731 ms`.

The final regression preserved eight approved source-bound audio tones in
order, completed `27` private work items and jobs, produced a `3840x2160`
private review artifact, and accepted the review without enabling browser
execution authority. The evidence catalog remained at `50` canonical
private/internal end-to-end and job-adapter-verified tools. Product, external
beta, live cloud, public delivery, and paid-production readiness remained
false throughout both runs.

The v12 run remains pre-Docker-transport-hardening historical evidence, and the
v11 run remains pre-timeout-reconciliation historical evidence. Both are
superseded by the v13 aggregate result. The v10 `26/26` and `32/32` runs remain
pre-failure-reconciliation history. The v9 runs remain
pre-completion-reconciliation history, and the v8 `25/25` and `31/31` runs
remain pre-transaction history.

## Explicit Boundaries

The following remain false:

- distributed database package-queue plus outbox transaction;
- multi-host, shared-filesystem, or multi-replica claim/outbox coordination;
- live Google signing-key retrieval, rotation, token verification, and IAM;
- Cloud Tasks OIDC configuration and Invoker IAM;
- Jobs Developer IAM and Cloud Run Jobs execution;
- deployed private controller or worker receiver;
- live service-account and regional resource reconciliation;
- private generation-bound GCS transport;
- live worker execution and live completion/QA/reconciliation through this
  handoff;
- dead-letter reconciliation and production observability;
- provider activation, billing/wallet mutation, remote Supabase, deployment,
  public delivery, external beta, and paid production.

## Next Gate

The process-brand, cryptographic verifier core, private single-host
queue/outbox claim transaction, and private single-host terminal
completion/failure/timeout transactions are now proven. The next
dependency-safe gate
is a durable attempt-start/cost binding and controller-owned timeout finalizer,
followed by a reviewed distributed
database transaction/RPC plus the live Google key-cache/auth-library adapter
and controlled staging-token proof. Any live implementation still requires
explicit authorization for canonical database work and staging Google Cloud
deployment. See
`docs/canonical-private-package-state-transaction-verification-2026-07-17.md`
and
`docs/canonical-private-worker-completion-reconciliation-verification-2026-07-17.md`,
plus
`docs/canonical-private-worker-failure-reconciliation-verification-2026-07-17.md`
and
`docs/canonical-private-worker-timeout-reconciliation-verification-2026-07-17.md`.
