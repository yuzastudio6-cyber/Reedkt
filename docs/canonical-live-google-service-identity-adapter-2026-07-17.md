# Canonical Live Google Service Identity Adapter — 2026-07-17

Status: `adapter_source_verified_live_google_token_iam_and_route_blocked`

## Outcome

ReEditPro now has a server-only adapter for the future authenticated Cloud
Tasks controller and Cloud Run worker boundaries. The adapter uses the
supported `google-auth-library` `OAuth2Client.verifyIdToken` path, keeps one
client per constructed verifier so the library owns signing-key caching and
rotation, and independently rechecks the exact ReEditPro identity contract
after the library returns a verified ticket.

This is source and zero-network adapter-path evidence. The focused smoke
replaces only `OAuth2Client.prototype.verifyIdToken` inside its isolated test
process, restores it in `finally`, and performs no Google token, certificate,
IAM, Cloud Tasks, Cloud Run, Supabase, provider, billing, deployment, or public
delivery operation. No HTTP receiver was mounted.

## Server-Owned Authority

The factory freezes these values at server construction:

- authentication mechanism: controller OIDC or Cloud Run workload identity;
- exact expected service-account email;
- exact expected audience;
- maximum token lifetime, defaulting to 65 minutes; and
- a bounded verification and Google certificate-fetch timeout, defaulting to
  5 seconds, with library transport retries disabled and certificate responses
  bounded to 1 MiB.

The request can supply only one `Authorization` header. It cannot supply the
expected principal, audience, mechanism, verifier, claims, keys, or evidence.
Cloud Tasks headers such as `X-CloudTasks-*` are not accepted as identity.

## Request And Token Contract

Before the Google library can perform a signing-key lookup, the adapter
requires:

- one trimmed, bounded `Bearer <JWT>` value with no comma or duplicate value;
- exactly three canonical base64url JWT segments under byte ceilings;
- a bounded 256–512-byte signature segment;
- a JSON protected header with `alg = RS256`, a bounded `kid`, and optional
  `typ = JWT`; and
- no caller-selected `crit`, `jku`, `jwk`, `x5u`, or `x5c` key source.

After `verifyIdToken` verifies the signature and expected audience, ReEditPro
independently requires:

- issuer exactly `https://accounts.google.com`;
- the exact server-owned audience;
- the exact normalized server-owned `*.gserviceaccount.com` principal;
- `email_verified = true` and a bounded subject;
- integer positive `iat` and `exp`, optional valid `nbf`, a current verifier
  time inside the token window, and the bounded maximum lifetime; and
- a process-local, non-serializable verified-identity brand before receiver
  services can consume the evidence.

Every request-time failure becomes the same
`INTERNAL_SERVICE_AUTH_INVALID` response. The raw Authorization header and
bearer token are not persisted in evidence, receipts, details, or adapter
errors.

## Focused Evidence

Run:

```bash
npm run smoke:canonical-live-google-service-identity-verifier
```

The smoke proves the supported library call path receives the exact token,
audience, and lifetime; one client is reused per verifier; both mechanism
labels produce process-branded evidence; malformed or unsafe inputs fail
before library invocation; library rejection, missing payload, claim mismatch,
and timeout fail generically; and the capability serializes to `{}` without
retaining the token.

The smoke's successful library response is deliberately stubbed. Therefore
its `trusted_google_identity_verifier` evidence tests adapter construction only
and is not live Google verification evidence.

## Verification Packet

The bounded source increment passed with exit code `0` for:

- `npm run typecheck:server`;
- `npm run lint`;
- `npm run build` (`2,625` client modules transformed; existing chunk warnings
  only);
- `npm run build:server` (`1,056` modules transformed);
- `npm run check:frontend-boundary` (`816` files);
- `npm run check:secrets` (`4,437` files, no secret values printed);
- `npm run smoke:canonical-service-identity-verifier`;
- `npm run smoke:canonical-live-google-service-identity-verifier`;
- `npm run smoke:canonical-cloud-dispatch-outbox-receivers`;
- `npm run smoke:canonical-cloud-dispatch-handoff`,
  `npm run smoke:runtime-api-security`, and
  `npm run smoke:production-api-deployment-contract`; and
- `npm ls google-auth-library --depth=1`, resolving the new direct dependency
  and the existing `@google-cloud/storage` dependency to one deduplicated
  `google-auth-library@9.15.1` install.

`package-lock.json` changed only to add the root direct dependency; the already
resolved package and integrity record were unchanged. The historical full
pipeline result predates this additive adapter, so no new exact-code aggregate
claim is made.

## Still-Gated Unsafe Actions

The following remain closed:

- treating this smoke as a live Google key/token or IAM result;
- constructing the adapter from request JSON or caller claims;
- mounting controller, worker, completion, failure, or timeout HTTP routes;
- Cloud Tasks creation, Cloud Run invocation, or metadata-server token use;
- distributed package queue/outbox/terminal transaction authority;
- enabling any of the 50 private proven tools on deployed workers;
- remote Supabase mutation or migration execution;
- provider activation, customer credit/billing mutation, deployment, public
  delivery, external beta, or paid production.

## Next Evidence Gate

The next identity proof is an owner-authorized controlled-staging token and IAM
verification against an exact deployed receiver audience and service account,
including key rotation/cache behavior, outage behavior, duplicate header
rejection at the HTTP edge, sanitized logs, and negative principal/audience
tests. Receiver mounting additionally requires the separately gated
distributed queue/outbox/terminal transaction and multi-replica authority; the
adapter alone does not authorize cloud dispatch.
