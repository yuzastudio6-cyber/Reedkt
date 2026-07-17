# Private Browser API Gateway Readiness

Status: `source_contract_ready_remote_gateway_and_signed_in_journey_blocked`

Checked: 2026-07-17

## Outcome

ReEditPro now has a fail-closed source contract for a signed-in browser to reach an IAM-private Cloud Run API without placing a Google service credential in the browser and without granting `allUsers` or `allAuthenticatedUsers` Cloud Run invocation.

This is not a deployment claim. The API Gateway API is currently disabled in the `reeditpro` project, no gateway exists or was queried successfully, and no Google Cloud, Supabase, IAM, provider, worker, billing, or deployment mutation was performed.

## Request Trust Chain

1. Supabase Auth signs the user in through Google and gives the browser a short-lived user access token.
2. The browser sends that token as `Authorization: Bearer ...` for Google API Gateway validation.
3. Because API Gateway replaces `Authorization` while authenticating to a private backend, the browser also sends the same token in `X-ReEditPro-User-Authorization` for ReEditPro's own verification.
4. API Gateway validates exact Supabase issuer, JWKS signature, `authenticated` audience, and token expiry.
5. API Gateway invokes the IAM-private Cloud Run service with its dedicated Google service account and exact Cloud Run audience.
6. Express requires the gateway claim envelope, decodes the original token only for claim comparison, calls Supabase `getUser` to verify it, and requires the gateway subject, token subject, and returned Supabase user to match.
7. Route-level workspace/project membership, immutable snapshot, idempotency, credit, lease, QA, and artifact gates remain authoritative after authentication.

The original token is request-scoped only. It is not placed in a Vite build variable, URL, query, database row, queue body, artifact record, log payload, or browser storage by this transport.

## Source Boundaries Implemented

- `REEDITPRO_BROWSER_API_TRANSPORT=google_api_gateway` is an explicit server mode. It requires Cloud Run runtime, an exact HTTPS Supabase origin and anon key, and at least one exact CORS origin.
- `VITE_REEDITPRO_API_TRANSPORT=google_api_gateway` is the browser-safe selector. It is useful only with `VITE_REEDITPRO_API_MODE=cloud_run` and a safe HTTPS API origin.
- Non-loopback HTTP API targets, URL credentials, paths, queries, and fragments fail closed before authenticated transport.
- Direct local testing remains separate. A gateway-only user header is rejected in direct mode, and a normal `Authorization` header is not mistaken for gateway user authority in gateway mode.
- CORS is noncredentialed and exact-origin. It allows the reviewed user-token, request-ID, idempotency, content, and range headers but does not expose authorization or internal-service headers.
- Small uploads, resumable finalization calls, canonical JSON calls, private review media, and immutable decision-manifest downloads carry the gateway revalidation header only when they target the ReEditPro backend. The token is never added to a signed GCS upload request.
- The generated OpenAPI 2 contract uses `x-google-allow: configured`, exposes only public `/health`, authenticated `/v1/{path=**}`, and unauthenticated CORS `OPTIONS`, and binds the gateway backend identity audience to the exact `run.app` origin.

## Read-Only Cloud Observation

The repository now includes a bounded verifier for this exact staging lane:

```bash
npm run staging:verify-google-api-gateway-readiness
```

It runs only `gcloud ... list`, `describe`, and `get-iam-policy` probes. It never enables an API, creates a resource, changes IAM, deploys, contacts Supabase, calls a provider, charges billing, or prints environment values or raw IAM principals. Audit mode exits successfully with a blocked report so evidence can be collected safely; set `REEDITPRO_REQUIRE_GATEWAY_READY=true` only when a CI gate should fail on any blocker.

The 2026-07-17 sanitized report confirms:

- The exact `reeditpro-api-staging` Cloud Run service resolves in `us-east1`, is Ready, and uses the expected runtime service account.
- No `allUsers` or `allAuthenticatedUsers` invoker is present in the Cloud Run service-level IAM policy. That is the correct private posture; broader project-level IAM still requires explicit verification during activation.
- Only 1 of the 3 gateway/service-control APIs required by this contract is enabled.
- `API_ALLOWED_CORS_ORIGINS`, `REEDITPRO_BROWSER_API_TRANSPORT`, and `REEDITPRO_INTERNAL_SERVICE_TOKEN` are absent from the current Cloud Run revision.
- The required sensitive runtime settings are not all backed by Cloud Run Secret Manager references.
- The dedicated gateway service account is not an invoker, and no API, API config, gateway, or active gateway was found because API Gateway remains disabled.

Therefore the service is correctly private but not ready for a signed-in browser route test. The verifier reported every mutation boundary as false.

The checked-in older staging API workflow also remains insufficient for this browser path: it deploys Cloud Run with `--no-allow-unauthenticated` but does not create a gateway bridge, configure the current browser transport, or prove the current production startup requirements. It must not be treated as a working browser deployment.

## Required Remote Sequence

Remote work remains gated. When the owner authorizes the staging mutation window, the safe order is:

1. Verify Google OAuth callback/redirect configuration and the Supabase hosted sign-in session.
2. Verify Supabase uses an asymmetric signing key whose JWKS and algorithm are accepted by the target API Gateway config; do not expose a symmetric JWT secret.
3. Enable API Gateway and required service-control APIs in the staging project.
4. Create a dedicated gateway service account without a downloaded key.
5. Deploy the reviewed Cloud Run API image from one immutable commit with exact CORS, gateway transport, Supabase public/admin config, internal-service authentication, and Secret Manager bindings.
6. Grant only that gateway service account service-level `roles/run.invoker`; verify no public invoker and no broader project-level invocation path.
7. Render the OpenAPI contract with `npm run staging:render-google-api-gateway-openapi`, create an immutable API config, and deploy the staging gateway.
8. Prove preflight, expired token, wrong issuer, wrong audience, wrong subject, revoked user, cross-workspace access, direct Cloud Run denial, and sanitized logging.
9. Point the reviewed hosted frontend at the verified gateway and run real Google sign-in, reload, sign-out, upload, plan, approval, private execution, QA, review, and export tests.

Google documents that API Gateway can validate user JWTs from a configured issuer/JWKS, sends the authenticated payload in `X-Apigateway-Api-Userinfo`, and can invoke a private Cloud Run backend through a gateway service account. Supabase documents its asymmetric signing-key JWKS endpoint and recommends asymmetric keys instead of the legacy shared secret:

- <https://docs.cloud.google.com/api-gateway/docs/authenticating-users-jwt>
- <https://docs.cloud.google.com/api-gateway/docs/securing-backend-services>
- <https://docs.cloud.google.com/api-gateway/docs/oasv2-extensions>
- <https://supabase.com/docs/guides/auth/signing-keys>
- <https://supabase.com/docs/guides/auth/jwts>

## Evidence

```bash
npm run smoke:google-api-gateway-browser-transport
npm run smoke:google-api-gateway-readiness
npm run staging:verify-google-api-gateway-readiness
npm run typecheck:server
```

The focused smokes prove the local trust boundary, generated OpenAPI invariants, read-only command plan, sanitized report shape, ready fixture, disabled-service fixture, and public-invoker rejection. The live verifier proves only current read-only Google Cloud configuration. It does not prove API enablement, IAM mutation, a deployed gateway, live Supabase signing keys, real Gmail sign-in, durable database state, GCS, workers, providers, billing, or production readiness.
