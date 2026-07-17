# Canonical Cloud Dispatch Outbox And Receiver Verification — 2026-07-17

Status: `private_durable_contract_verified_live_distribution_blocked`

## Outcome

ReEditPro now has a checksum-protected, restart-safe private outbox contract
between one already-leased approved package attempt and the previously frozen
Cloud Tasks -> private controller -> Cloud Run Jobs handoff. The same contract
defines the exact identity and authority checks for the controller and worker
receiver without creating a Cloud Task, starting a Cloud Run Job, executing a
tool, or making a network call.

This is the dependency-safe source contract needed before a distributed
database transaction and Google identity verifier can be connected. It is not
a deployed distributed outbox and is not live Google OIDC/IAM proof.

## Exact Attempt Flow

```text
immutable funded package queue
  -> one active opaque queue claim and approved delivery attempt
  -> one create-only durable outbox entry
  -> exact opaque Cloud Tasks body revalidation
  -> exact controller identity contract acceptance
  -> exact controller receipt and Cloud Run request hash
  -> exact worker invocation and workload-identity contract acceptance
  -> worker receiver receipt only; no tool or media execution
```

The package queue remains the sole owner of approved attempts. Outbox creation
requires an active leased entry whose job, delivery attempt, placement, worker
type, resource class, manifest entry, region, task body, and zero-hidden-retry
Cloud Run request all agree. The outbox stores the claim ID and its creation
evidence but never stores the plaintext claim credential.

Cloud Tasks redelivery reuses the same dispatch intent and package attempt.
Concurrent identical controller or worker deliveries produce one durable
receipt and one exact replay; they do not increment the package delivery
attempt and do not create another execution authority.

## Durable Private Record

The outbox aggregate is scoped to owner, workspace, project, edit session,
package, and approved snapshot. Its path contains only tenant/package hashes.
It uses the shared private-local persistence boundary for:

- root-confined and symlink-refusing access;
- `0700` directories and a `0600` record;
- same-directory atomic replacement and durability sync;
- a checksum-protected aggregate;
- immutable per-attempt hashes;
- append-only hash-chained creation/controller/worker events; and
- bounded entries, events, and total bytes.

The persisted record contains opaque IDs, hashes, regional resource names,
non-secret service-account names, and receipts. It contains no raw media,
prompt, filesystem path, signed URL, authorization header, bearer token,
claim credential, provider credential, or worker command.

This proves single-host restart recovery and process-local concurrent
serialization. It does not prove cross-process locking, a package-queue plus
outbox database transaction, multiple API replicas, or distributed recovery.

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
service API nor persisted. The current local proof uses an explicitly labelled
`private_contract_fixture`; it cannot be passed off as live verification.
`trusted_google_identity_verifier` output is rejected by the private service
until a reviewed cryptographic adapter is actually wired.

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

The receipt explicitly records that no tool, media, provider, render, or worker
execution started. A later Cloud Run bootstrap may load private package and
artifact authority only after the live workload-identity adapter, distributed
transaction, private object transport, worker lease/reconciliation, and
deployment gates pass.

## Focused Evidence

`npm run smoke:canonical-cloud-dispatch-outbox-receivers` proves:

- a real active package-queue claim produces one durable outbox entry;
- restart readback and exact enqueue replay preserve identical bytes;
- concurrent controller redelivery yields one acceptance and one replay;
- concurrent worker redelivery yields one acceptance and one replay;
- the package queue remains byte/hash identical with one delivery attempt;
- forged principal, audience, task body, controller receipt, worker principal,
  expired claim, cross-tenant scope, and tampered persisted bytes fail closed;
- the outbox file is `0600` and contains no plaintext claim credential, bearer
  credential, internal audience URL, source path, or signed URL;
- Cloud Run internal retries remain zero; and
- network, Cloud Tasks, Cloud Run, worker execution, distributed transaction,
  live identity, and production authority all remain false.

The canonical pipeline runs this stage immediately after the 50-tool cloud
handoff contract. The handoff stage proves all 50 target mappings; this focused
stage uses one representative CPU attempt to prove the generic outbox and
receiver state machine. It does not claim that a deployed task was delivered
for each tool.

## Pipeline Verification

The canonical private pipeline completed all `24/24` stages with exit code
`0` under schema `canonical-private-pipeline-verification-v7`:

- started: `2026-07-17T05:03:51.586Z`;
- finished: `2026-07-17T05:35:15.199Z`;
- duration: `1,883,613 ms`;
- cloud dispatch handoff: `528 ms`;
- outbox and receiver contract: `839 ms`;
- three-source canonical composition: `790,920 ms`;
- professional color execution: `909,638 ms`;
- bounded UHD Remotion stream: `133,094 ms`; and
- signed-in named-edit browser journey: `11/11` tests in `19,505 ms`.

The broader internal regression then completed all `30/30` stages with exit
code `0` under the same v7 schema:

- started: `2026-07-17T05:36:38.665Z`;
- finished: `2026-07-17T06:22:42.889Z`;
- duration: `2,764,224 ms`;
- cloud dispatch handoff: `776 ms`;
- outbox and receiver contract: `779 ms`;
- three-source canonical composition: `1,098,020 ms`;
- professional color execution: `862,532 ms`;
- bounded UHD Remotion stream: `130,202 ms`;
- signed-in named-edit browser journey: `11/11` tests in `19,303 ms`; and
- maximum-eight-source signed-in private review: `615,683 ms`.

The final regression preserved eight approved source-bound audio tones in
order, completed `27` private work items and jobs, produced a `3840x2160`
private review artifact, and accepted the review without enabling browser
execution authority. The evidence catalog remained at `50` canonical
private/internal end-to-end and job-adapter-verified tools. Product, external
beta, live cloud, public delivery, and paid-production readiness remained
false throughout both runs.

## Explicit Boundaries

The following remain false:

- distributed package-queue plus outbox transaction;
- cross-process or multi-replica atomic claim/outbox coordination;
- live Google token signature, issuer, audience, and expiry verification;
- Cloud Tasks OIDC configuration and Invoker IAM;
- Jobs Developer IAM and Cloud Run Jobs execution;
- deployed private controller or worker receiver;
- live service-account and regional resource reconciliation;
- private generation-bound GCS transport;
- worker execution, completion, QA, and reconciliation through this handoff;
- dead-letter reconciliation and production observability;
- provider activation, billing/wallet mutation, remote Supabase, deployment,
  public delivery, external beta, and paid production.

## Next Gate

The next dependency-safe source gate is a reviewed transactional persistence
design that atomically couples package-attempt ownership with outbox creation,
plus a trusted Google verifier adapter boundary that cannot be constructed from
request JSON. Any live implementation still requires explicit authorization
for canonical database work and staging Google Cloud deployment.
