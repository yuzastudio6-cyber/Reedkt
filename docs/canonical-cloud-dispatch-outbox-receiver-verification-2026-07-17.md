# Canonical Cloud Dispatch Outbox And Receiver Verification — 2026-07-17

Status: `private_cross_process_crash_consistent_completion_contract_verified_live_distribution_blocked`

## Outcome

ReEditPro now has a checksum-protected, restart-safe private outbox contract
whose package attempt is selected by the server and committed atomically with
the outbox entry through a private write-ahead record. The same contract
defines the exact identity and authority checks for the controller and worker
receiver, and now defines the terminal accepted-worker completion receipt,
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

## Durable Private Record

The outbox aggregate is scoped to owner, workspace, project, edit session,
package, and approved snapshot. Its path contains only tenant/package hashes.
It uses the shared private-local persistence boundary for:

- root-confined and symlink-refusing access;
- `0700` directories and a `0600` record;
- same-directory atomic replacement and durability sync;
- a checksum-protected aggregate;
- immutable per-attempt hashes;
- append-only hash-chained creation/controller/worker/completion events; and
- bounded entries, events, and total bytes.

The persisted record contains opaque IDs, hashes, regional resource names,
non-secret service-account names, and receipts. It contains no raw media,
prompt, filesystem path, signed URL, authorization header, bearer token,
claim credential, provider credential, or worker command.

The queue and outbox now share one cooperative cross-process package lock. A
fully written hard-link owner record prevents partial lock publication, and a
dead same-host process can be reclaimed after exact owner-record validation.
One transient `0600` write-ahead record is the queue/outbox commit point for
claim/dispatch or accepted-worker completion; the next reader replays either
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

The canonical pipeline runs this stage immediately after the 50-tool cloud
handoff contract. The handoff stage proves all 50 target mappings; this focused
stage uses one representative CPU attempt to prove the generic outbox,
receiver, and terminal completion state machine. It does not claim that a
deployed task or completion callback ran for each tool.

## Pipeline Verification

The exact-code canonical private pipeline completed all `26/26` stages with
exit code `0` under schema `canonical-private-pipeline-verification-v10`:

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

The broader exact-code internal regression then completed all `32/32` stages
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

The earlier v9 `26/26` and `32/32` runs remain pre-completion-reconciliation
historical evidence and are superseded by these v10 aggregate results. The v8
`25/25` and `31/31` runs remain pre-transaction history.

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
queue/outbox claim transaction, and private single-host completion transaction
are now proven. The next dependency-safe gate is a reviewed distributed
database transaction/RPC plus the live Google key-cache/auth-library adapter
and controlled staging-token proof. Any live implementation still requires
explicit authorization for canonical database work and staging Google Cloud
deployment. See
`docs/canonical-private-package-state-transaction-verification-2026-07-17.md`
and
`docs/canonical-private-worker-completion-reconciliation-verification-2026-07-17.md`.
