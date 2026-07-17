# Canonical Service Identity Verifier Verification — 2026-07-17

Status: `cryptographic_contract_verified_live_google_jwks_iam_blocked`

## Outcome

ReEditPro now has a bounded, zero-network cryptographic verifier core for the
private Cloud dispatch controller and worker receiver. It validates a signed
RS256 ID token against a checksum-bound, server-owned JWKS snapshot and returns
a process-local verified-identity capability. The receiver no longer accepts a
caller-shaped claims object as trusted verifier evidence.

This is source and private-contract proof. The exercised JWKS snapshot uses a
locally generated test key and explicitly records
`liveGoogleJwksFetchPerformed = false`. No Google public key was fetched, no
Cloud Task or Cloud Run Job was called, and no IAM or deployment claim is made.

## Exact Verification Contract

The verifier requires all of the following before it creates trusted evidence:

- a checksum-valid, bounded JWKS snapshot from server construction;
- a fresh snapshot lifetime and one unique allowlisted key ID;
- RSA signing keys of at least 2,048 bits with public exponent `65537`;
- exactly `RS256`, an allowlisted `kid`, and no caller-selected `jku`, `jwk`,
  `x5u`, `x5c`, or `crit` key source;
- a canonical three-segment base64url JWT within strict byte ceilings;
- a valid RSA-SHA256 signature over the exact header and payload bytes;
- issuer `https://accounts.google.com`;
- the exact server-owned receiver audience;
- the exact expected controller or worker service-account email;
- `email_verified = true` and a bounded subject identity;
- valid `iat`, `exp`, optional `nbf`, and maximum token lifetime; and
- a verifier clock inside both the token and JWKS lifetimes.

Every failure returns the same internal-service authentication error without
including the token or the failed claim. Raw bearer tokens are never written to
the outbox, receipt, evidence object, logs, or error details.

## Non-Serializable Trust Handoff

The verifier output is branded in a module-private `WeakSet`. Its evidence
property is non-enumerable, immutable, and process-local:

- JSON serialization produces `{}`;
- JSON parsing cannot recreate the brand;
- structured cloning loses the brand;
- a caller-authored `{ evidence: ... }` object is rejected; and
- only the verifier or the explicitly named private-fixture helper can create
  an accepted in-process capability.

The private fixture helper remains local-test-only and is labelled
`private_contract_fixture`. Signed local proof is labelled
`trusted_jwks_contract_fixture`. Neither mode can be mistaken for
`trusted_google_identity_verifier` or live Google/IAM verification.

## Receiver Integration

The controller and worker receiver methods now accept only the process-branded
capability. Receipt construction unwraps the brand, revalidates the evidence
hash, mechanism, verifier ID, issuer, principal, audience, and expiry, then
binds only hashed identity fields into the durable outbox receipt.

The outbox integration smoke uses cryptographically signed identities for both
the controller OIDC mechanism and worker workload-identity mechanism. It still
proves one accepted delivery plus one exact concurrent replay, one package
attempt, zero Cloud Run hidden retries, and no queue mutation or execution.

## Focused Evidence

`npm run smoke:canonical-service-identity-verifier` proves:

- valid RS256 controller and worker identities pass;
- signature tampering, `alg = none`, unknown keys, embedded key sources,
  incorrect issuer/audience/principal, unverified email, expiry, future issue
  time, future `nbf`, excessive lifetime, nonstandard RSA exponent, and stale
  JWKS fail closed;
- caller-authored and structured-cloned evidence cannot cross the process trust
  boundary;
- the verified capability serializes to an empty object;
- the evidence retains no raw bearer token; and
- live Google key retrieval, IAM, Cloud Tasks, Cloud Run, and production remain
  false.

`npm run smoke:canonical-cloud-dispatch-outbox-receivers` additionally proves
that the signed verifier output is accepted by the exact durable controller and
worker receipt state machine while caller-authored evidence is rejected.

## Aggregate Verification

The exact-code canonical private pipeline passed all `25/25` stages with exit
code `0` under schema `canonical-private-pipeline-verification-v8`:

- started: `2026-07-17T06:50:34.211Z`;
- finished: `2026-07-17T07:12:09.665Z`;
- duration: `1,295,454 ms`;
- 50-tool cloud handoff: `446 ms`;
- cryptographic service identity: `400 ms`;
- durable outbox receivers: `521 ms`;
- three-source composition: `555,203 ms`;
- professional color: `601,705 ms`;
- UHD Remotion streaming: `98,807 ms`; and
- canonical named-edit UI: `11/11` tests in `16,319 ms`.

The broader internal regression then passed all `31/31` stages with exit code
`0` under the same v8 schema:

- started: `2026-07-17T07:12:17.250Z`;
- finished: `2026-07-17T07:39:21.755Z`;
- duration: `1,624,505 ms`;
- 50-tool cloud handoff: `429 ms`;
- cryptographic service identity: `541 ms`;
- durable outbox receivers: `552 ms`;
- canonical named-edit UI: `11/11` tests in `14,520 ms`; and
- maximum-eight-source signed-in review: `360,277 ms`.

The final signed-in stage completed all `27` server-derived work items and
jobs, produced and authenticated a `3840x2160`, `16`-second private review,
preserved eight source-bound audio identities in order, and persisted review
acceptance. The versioned catalog remained exactly `50` canonical end-to-end
and `50` canonical job-adapter identities. Live Google identity, Cloud Tasks,
Cloud Run execution, provider activation, billing/wallet mutation, remote
Supabase, public delivery, deployment, external beta, and paid production all
remained false.

## Explicit Boundaries

The following remain false:

- live retrieval and cache-control rotation of Google signing keys;
- use of Google's official authentication library against a live token;
- Cloud Tasks OIDC configuration and Cloud Run Invoker IAM;
- workload-identity token acquisition from the Cloud Run metadata server;
- deployed controller and worker receiver endpoints;
- distributed package-queue/outbox transaction and multi-replica locking;
- worker bootstrap, tool execution, completion, QA, and reconciliation through
  the Cloud dispatch path;
- provider activation, billing/wallet mutation, remote Supabase, deployment,
  public delivery, external beta, and paid production.

## Google Contract Sources

The source contract follows current Google primary guidance:

- Google ID-token verification requires signature, audience, issuer, and expiry
  checks, with signing keys refreshed according to their cache lifetime:
  <https://developers.google.com/identity/gsi/web/guides/verify-google-id-token>
- Cloud Tasks uses a service-account OIDC token for authenticated HTTP targets;
  task headers are informational and must not be used as identity:
  <https://docs.cloud.google.com/tasks/docs/creating-http-target-tasks>
- Cloud Run service-to-service requests use a Google-signed ID token whose
  audience matches the receiving service or configured custom audience:
  <https://docs.cloud.google.com/run/docs/authenticating/service-to-service>

## Next Gate

The next identity gate is a reviewed live adapter using Google's supported
authentication library or equivalently reviewed Google-key cache integration,
including key rotation, cache-control handling, outage behavior, token-source
headers, and controlled staging tokens. That live adapter must be constructed
outside request JSON and combined with the still-gated distributed
package-queue/outbox transaction before any receiver route or Cloud dispatch is
enabled.
