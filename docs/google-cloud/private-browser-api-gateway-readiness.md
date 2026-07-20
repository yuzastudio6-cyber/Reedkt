# Private Browser API Gateway Readiness

Status: `source_contract_and_guarded_activation_workflow_ready_remote_gateway_and_signed_in_journey_blocked`

Checked: 2026-07-18

## Outcome

ReEditPro now has a fail-closed source contract and a confirmation-gated staging activation workflow for a signed-in browser to reach an IAM-private Cloud Run API without placing a Google service credential in the browser and without granting `allUsers` or `allAuthenticatedUsers` Cloud Run invocation. The gateway workflow also requires successful, attempt-specific, same-SHA evidence from the separate signed-in private-media storage activation before it can authenticate to Google Cloud or deploy.

This is not a deployment claim. The API Gateway API is currently disabled in the `reeditpro` project, no gateway exists or was queried successfully, and no Google Cloud, Supabase, IAM, provider, worker, billing, or deployment mutation was performed. The workflow exists only in the local continuation checkout and has not been pushed or dispatched.

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
- `STORAGE_MODE=gcs` now requires the Google project/region and all eight purpose-specific bucket names at server startup. The signed-in staging configuration deliberately sets `REEDITPRO_LARGE_MEDIA_FINALIZATION_MODE=disabled`; objects above 16 MiB fail before an upload target or resumable credential is issued until the distributed finalizer is verified.
- The generated OpenAPI 2 contract uses `x-google-allow: configured`, exposes only public `/health`, authenticated `/v1/{path=**}`, and unauthenticated CORS `OPTIONS`, and binds the gateway backend identity audience to the exact `run.app` origin.

## Read-Only Cloud Observation

The repository now includes a bounded verifier for this exact staging lane:

```bash
npm run staging:verify-google-api-gateway-readiness
```

It runs only `gcloud ... list`, `describe`, and `get-iam-policy` probes. It never enables an API, creates a resource, changes IAM, deploys, contacts Supabase, calls a provider, charges billing, or prints environment values or raw IAM principals. Audit mode exits successfully with a blocked report so evidence can be collected safely; set `REEDITPRO_REQUIRE_GATEWAY_READY=true` only when a CI gate should fail on any blocker.

The 2026-07-18 sanitized report confirms:

- The exact `reeditpro-api-staging` Cloud Run service resolves in `us-east1`, is Ready, and uses the expected runtime service account.
- No `allUsers` or `allAuthenticatedUsers` invoker is present in the Cloud Run service-level IAM policy. That is the correct private posture; broader project-level IAM still requires explicit verification during activation.
- The service-level policy currently has one non-public invoker, but it is not the dedicated gateway service account. Activation must reconcile that exact legacy member only after the gateway path passes, then prove the gateway identity is the sole service-level invoker.
- Only 1 of the 3 gateway/service-control APIs required by this contract is enabled.
- `API_ALLOWED_CORS_ORIGINS`, `REEDITPRO_BROWSER_API_TRANSPORT`, and `REEDITPRO_INTERNAL_SERVICE_TOKEN` are absent from the current Cloud Run revision.
- The required sensitive runtime settings are not all backed by Cloud Run Secret Manager references.
- The dedicated gateway service account is not an invoker, and no API, API config, gateway, or active gateway was found because API Gateway remains disabled.

That retained observation predates the expanded private-storage gate. No new live probe was run in this source slice. The current deployed revision therefore remains unverified against `cloudRunPrivateMediaStorageConfigured`; a future same-SHA activation must prove exact GCS mode, region, eight bucket names, and the disabled distributed-finalization boundary before gateway readiness can pass.

Therefore the service is correctly private but not ready for a signed-in browser route test. The verifier reported every mutation boundary as false.

## Guarded Activation Workflow

`.github/workflows/beta-readiness-api-staging-deploy.yml` now owns the one reviewed private-browser staging activation lane. It replaces the stale workflow that was pinned to an unrelated source branch and lacked the current gateway transport and startup requirements.

The workflow cannot run on push, pull request, or schedule. A staging environment reviewer must dispatch it with all of the following:

- exact confirmations `ACTIVATE_REEDITPRO_PRIVATE_BROWSER_STAGING` and `ACCEPT_REEDITPRO_PRIVATE_STAGING_CLOUD_COST`;
- the exact tip SHA of `codex/backend-workflow-pipeline-continuation`;
- the exact currently ready `reeditpro-api-staging` revision, preventing an unexpected concurrent overwrite;
- positive numeric Secret Manager versions for `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `REEDITPRO_INTERNAL_SERVICE_TOKEN`—never `latest`;
- keyless GitHub OIDC/Workload Identity configuration, the exact staging app origin, the public staging Supabase origin, and the exact expected legacy private invoker through the protected `staging` environment.

Before mutation it proves the workflow dispatch itself and the checked-out source both use the exact reviewed branch tip SHA, runs the source security suite, and verifies a successful `Signed-In Private Media Storage Staging Activation` run from the same repository, branch, and SHA. It downloads only that run attempt's immutable sanitized artifact, validates its closed schema, and derives the eight exact bucket names from it before Google authentication. It then checks the current Cloud Run revision/runtime identity, rejects every project-level `roles/run.invoker` binding, rejects public or unexpected service-level invokers, verifies the four pinned secret versions without reading their values, and accepts only an all-public-key ES256/RS256 Supabase JWKS. The source suite now explicitly includes the single-host package transaction, database-neutral distributed package-state contract, locked seven-function RPC adapter, all-50-tool cloud dispatch handoff, live-Google verifier adapter, and controller/worker receiver contracts. These are source/fail-closed proofs only; they do not activate SQL, a live RPC client, workers, or Google dispatch. A legacy/shared-secret Supabase signing configuration therefore fails before API enablement.

Only after that preflight can it:

1. enable the three documented API Gateway control services;
2. create the dedicated gateway service account without a downloaded key and grant only service-account-user plus service-level Cloud Run invocation authority;
3. build the reviewed API image, push it under the exact source SHA, and deploy by resolved SHA-256 digest;
4. deploy the production-startup-safe Cloud Run revision with worker execution disabled, bounded private GCS source transport configured from the same-SHA storage artifact, distributed large-media finalization disabled, exact browser transport/CORS, pinned Secret Manager bindings, IAM invoker checks, and no unauthenticated invoker;
5. derive the API's generated managed-service hostname, render the reviewed OpenAPI contract, and create/reuse an immutable source/spec-hash-labelled API config;
6. create or update the `us-east1` gateway and prove public health, unauthenticated direct-Cloud-Run denial, protected-route auth denial, and exact noncredentialed CORS;
7. remove only the preflight-matched legacy private invoker after those proofs, then require the sanitized readiness verifier to pass with the gateway identity as the sole service-level invoker;
8. create and upload an immutable, attempt-specific, sanitized schema-v2 activation-evidence artifact containing the exact source SHA, storage activation run/attempt, Cloud Run revision, API config, gateway origin, app origin, storage configuration boundary, and disabled-scope flags. No token, credential, IAM member, secret value, object path, or signed URL enters that artifact.

Cloud Run uses `ingress=all` because API Gateway invokes the service's Google-managed `run.app` endpoint; IAM remains the access boundary and the workflow requires a direct unauthenticated request to return `403`. On any later failure, the workflow attempts to restore the previous gateway config, previous Cloud Run traffic revision, and exact prior service-level invoker set. It intentionally never deletes an API, config, gateway, service account, image, secret, or revision during rollback.

The accepted cost phrases cover only the exact internal Google Cloud staging storage and gateway resources named by their respective workflows. They do not approve a ReEditPro fee, customer price, customer credits, wallet mutation, billing call, provider activation, worker dispatch, object upload/finalization, public rendering, external beta, or production.

The checked-in older staging API workflow also remains insufficient for this browser path: it deploys Cloud Run with `--no-allow-unauthenticated` but does not create a gateway bridge, configure the current browser transport, or prove the current production startup requirements. It must not be treated as a working browser deployment.

## Required Remote Sequence

Remote work remains gated. When the owner authorizes the staging mutation window, the safe order is:

1. Verify Google OAuth callback/redirect configuration and the Supabase hosted sign-in session.
2. Verify Supabase uses an asymmetric signing key whose JWKS and algorithm are accepted by the target API Gateway config; do not expose a symmetric JWT secret.
3. Configure and review the protected staging storage inputs, then dispatch `Signed-In Private Media Storage Staging Activation` for the exact reviewed SHA. Do not run equivalent ad hoc mutation commands.
4. Preserve the successful storage run and its immutable, attempt-specific artifact.
5. Dispatch the guarded gateway activation for the same SHA with that exact storage run ID; the workflow must derive bucket configuration only from the verified artifact.
6. Preserve the successful gateway run and schema-v2 artifact. The Pages deployment must download that exact artifact and derive its gateway origin rather than accepting a separately entered endpoint.
7. Prove expired token, wrong issuer, wrong audience, wrong subject, revoked user, cross-workspace access, exact private upload behavior, and sanitized deployed logging.
8. Point the reviewed hosted frontend at the verified gateway and run real Google sign-in, reload, sign-out, bounded upload, plan, approval, private execution, QA, review, and export tests. Objects above 16 MiB remain blocked until distributed finalization is separately accepted.

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
npm run smoke:google-api-gateway-staging-activation
npm run smoke:signed-in-private-media-storage-readiness
npm run smoke:gcs-upload-integrity-security
npm run smoke:large-media-ingest-readiness
npm run smoke:canonical-private-package-state-transaction
npm run smoke:canonical-distributed-package-state-port
npm run smoke:canonical-distributed-package-state-rpc-adapter
npm run smoke:canonical-cloud-dispatch-handoff
npm run smoke:canonical-live-google-service-identity-verifier
npm run smoke:canonical-cloud-dispatch-outbox-receivers
npm run staging:verify-google-api-gateway-readiness
npm run typecheck:server
```

The focused smokes prove the local trust boundary, generated OpenAPI invariants, read-only command plans, sanitized report shapes, ready fixture, disabled-service fixture, public/unexpected-invoker rejection, exact same-SHA storage evidence consumption before cloud authentication, activation confirmations, pinned inputs, mutation order, route probes, exclusivity cutover, rollback, and blocked scopes. They also execute the embedded activation-evidence producer and Pages consumer with a valid fixture and prove tampered sole-invoker evidence fails closed. The live gateway verifier proves only the retained read-only Google Cloud configuration; the storage verifier has not been run against Google Cloud by this slice. None of this proves workflow dispatch, API enablement, IAM mutation, a deployed gateway, object upload, signed URL behavior, live Supabase signing keys, real Gmail sign-in, durable database state, distributed finalization, workers, providers, billing, or production readiness.
