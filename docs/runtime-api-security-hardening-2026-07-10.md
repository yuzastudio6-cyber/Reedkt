# Runtime API Security Hardening — 2026-07-10

Status: source-hardened, production still blocked

This change separates customer authentication from backend control-plane authorization. It does not certify a deployed API, Supabase project, worker, provider, or Cloud Run service.

## Control-plane routes

The following route families now require both a verified user bearer token and internal service authentication:

- worker claim, heartbeat, release, execution, and media probe routes;
- tool-runtime write and active tool-readiness routes;
- job and job-batch creation routes;
- provider request and disabled webhook-recording routes;
- render-job creation and basic smoke-render execution.

`GET /health/tool-readiness` and detailed `/health/readiness` are internal-only because they expose runtime installation or deployment metadata. Public `/health` returns only service status and request ID; it no longer returns runtime mode or mock-state configuration.

Production startup fails closed unless `REEDITPRO_INTERNAL_SERVICE_TOKEN` is configured. The token is read only by the server and compared in constant time from `X-ReeditPro-Internal-Token`. Legacy worker and internal edit-execution routes are mounted only when the complete explicit local/mock boundary is present: non-production, local/mock API mode, local/mock worker mode, and mock-only or explicitly authorized local Supabase testing. A non-production Cloud Run configuration no longer inherits execution access merely because `NODE_ENV` is not production.

This shared token is a transitional boundary. Before Cloud Run production, replace or supplement it with verified service identity (for example Cloud Run IAM/OIDC), audience validation, rotation, and per-service authorization. Provider webhooks require provider-specific signature verification before they can become live; the current route fails closed before request validation or persistence. It cannot persist caller-selected workspace/project scope.

The canonical Cloud dispatch follow-up defines the stricter controller/worker
identity contract but does not mount a live route or accept caller-authored
identity JSON. Its private service now requires a non-serializable process
brand. A bounded verifier proves RS256 against a checksum-bound server-owned
test JWKS snapshot, then validates exact issuer/principal/audience/issue/expiry
and attempt bindings while persisting only hashed receipts. The exercised
snapshot explicitly records that no live Google key fetch occurred; production
and purported live Google-verifier output remain rejected. Google's supported
live auth-library/key-rotation adapter, Cloud Run IAM, and deployed request
integration are still required.

The private completion follow-up uses the same process-branded worker identity
and requires the same accepted service principal before it can reconcile a
result. Its terminal receipt binds the exact claim/attempt, worker receipt,
private artifact, passed QA, asset reconciliation, downstream lease
verification, and attempt-level internal production-cost evidence. It persists
no bearer token, plaintext claim credential, path, prompt, signed URL, or media
bytes and explicitly excludes customer price, credits, service fee, wallet,
billing, and settlement authority. This remains a zero-network local contract;
no HTTP authorization-header adapter, live Google verifier, IAM, Cloud Run
worker, or production completion route was enabled.

The private failure follow-up uses that same accepted process-branded worker
principal. It accepts only safe failure category/code, execution state,
failure-detail hash, and internal-cost evidence hash; commits the exact queue
release and terminal outbox receipt together; derives bounded
retry/exhaustion/user review on the server; and rejects post-commit retry. It
persists no raw error, log, stack, path, credential, media, or bearer token and
grants no customer price, credits, service fee, wallet, billing, settlement, or
automatic-retry authority. This is still a zero-network local contract, not a
deployed worker callback.

## User-resource scope

Additional checks now bind user-facing server reads and writes to authenticated scope:

- job and job-event reads require a workspace and verify the job's project is owned by the current user;
- render reads require a workspace and verify the render's project is owned by the current user;
- preview review writes verify workspace editor access and bind to a render in the same owned project;
- chat session creation, user messages, and clip attachment verify workspace write access and owned project/chat relationships;
- approved snapshot creation authorizes the workspace and owned project before idempotency/snapshot work.
- generic idempotency authorizes workspace write access before reserving an
  in-process local/mock key, rejects concurrent duplicates, and replays the
  completed response without rerunning the route handler;
- user job/event and render reads use explicit safe projections rather than
  `select('*')`, excluding orchestration payloads, errors, locks, storage paths,
  signed URLs, and render payloads;
- mock credit data and estimate persistence routes are restricted to the
  explicit local mock runtime and scope reads/writes by authorized workspace.
- every private final-render and edit-decision-manifest stream re-checks current
  workspace membership and project access; a delivery creator loses access
  after membership revocation.

These checks reduce IDOR and cross-tenant binding risk in the API skeleton. The raw database migration history remains non-executable, so production persistence still requires the isolated canonical schema and two-user security tests.

The old generic Supabase select-then-insert idempotency path is disabled. A
generic production/Supabase write now fails closed before its route handler with
`IDEMPOTENCY_ATOMICITY_REQUIRED`. Each durable write must move to a
route-specific transaction/RPC that couples authorization, request-hash
reservation, domain mutation, and durable response association. Explicit
local/mock routes use a bounded single-process reservation/replay store with
TTL, capacity limits, concurrent in-progress rejection, exact completed-response
replay, and fail-closed sealing of ambiguous `5xx`/closed attempts. See
`docs/generic-idempotency-hardening-2026-07-10.md`.

Production worker claim, heartbeat, release, and execution currently fail
closed after dual authentication. The existing database skeleton keys claims too
loosely by job ID, so it is not enabled as a production lease authority. The
isolated canonical-v2 work defines an atomic tenant-bound claim with an opaque
hashed lease token, worker identity, expiry, and exact job/snapshot/reservation
lineage before that block can be removed. Local/mock worker smokes remain
available for internal testing.

The same canonical execution gate is applied to the basic render-smoke preview route. It runs before idempotency validation, tool probing, job loading, claims, events, or FFmpeg execution, eliminating the prior route-specific bypass.

## HTTP boundary

The API now:

- disables `X-Powered-By`;
- uses explicit CORS allowlisting without credentialed-cookie CORS;
- rejects unsafe/unbounded caller-supplied request IDs;
- sends `nosniff`, frame denial, no-referrer, permissions, same-site resource, and no-store headers;
- sends HSTS in production.

## Error and provider-payload confidentiality

Production error responses now fail closed for unknown exceptions, internal `ApiError` failures, and PostgREST failures. Those responses use the stable `INTERNAL_ERROR` code, a generic message, HTTP 500, and the request ID; database messages, hints, schema names, filesystem paths, and internal details are not returned to callers. Detailed internal error responses are limited to an explicit non-production `local` or `mock` runtime. Internal failures are still emitted server-side as structured logs, after recursive credential/path redaction and without stack traces.

JSON sanitization is recursive and bounded by depth, object-entry, array-length, string-length, and total-character limits. Secret-like keys, bearer/basic credentials, signed-URL query credentials, and filesystem paths are redacted before the sanitized value is used for logs or internal event summaries.

Provider webhook recording remains blocked and does not pretend to verify a signature. The route and direct service boundary now reject every webhook before persistence. The allowlisted summary builder remains testable for the future signed path, but no caller-selected workspace/project/job lineage or payload summary is written. Future handling must verify provider signature and replay tolerance first, then derive tenant scope from a stored backend provider attempt.

Focused source-level proof is available through:

```bash
npm run smoke:error-provider-confidentiality
```

This is source hardening only. A provider webhook must remain blocked until provider-specific signature verification, timestamp tolerance, replay prevention, and an authenticated event-to-workspace binding are implemented and tested.

## Required follow-up

Production remains blocked until all of the following are proven:

1. Canonical database chain and exact tenancy constraints.
2. Two users/two workspaces negative API and RLS tests.
3. Atomic authorization + idempotency + mutation transactions.
4. Distributed rate limiting, request quotas, and edge/WAF controls.
5. Cloud service identity and token rotation.
6. Provider webhook signature verification and replay prevention.
7. Sanitized public DTOs for the remaining preview/review/execution-artifact
   surfaces; job/event and render reads are already projected.
8. Canonical tenant-bound worker lease RPC and service-identity integration.
9. Live Supabase catalog and Security Advisor verification.

Upload/storage-specific source hardening is documented in `docs/upload-storage-boundary-hardening-2026-07-10.md`. The production Express API no longer accepts the local raw-byte upload path, upload authorization precedes idempotency recording, and storage records without upload-intent provenance require a project-scoped delivery boundary. Distributed edge quotas and deployed object-storage verification remain production blockers.

Private single-host file modes, atomic replacement, and symlink-safe reads are
documented in `docs/private-local-persistence-hardening-2026-07-10.md`.

No remote service, SQL migration, provider call, worker execution, or deployment was performed for this hardening pass.
