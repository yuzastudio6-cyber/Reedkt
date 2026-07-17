# ReEditPro Internal Testing App Deploy Readiness

## Decision

`app_signed_in_internal_testing_pages_gateway_workflow_source_ready_remote_activation_and_deploy_pending`

## Deployment Target

- Manual workflow: `.github/workflows/app-internal-testing-pages-deploy.yml`
- Exact reviewed source ref: `codex/backend-workflow-pipeline-continuation`
- Default Vite base path: `/Reedkt/`
- Required successful upstream workflow: `Private Browser API Gateway Staging Activation`
- Browser-safe configuration:
  - `STAGING_SUPABASE_URL` -> `VITE_SUPABASE_URL`
  - `STAGING_SUPABASE_ANON_KEY` -> `VITE_SUPABASE_ANON_KEY`
  - literal `VITE_REEDITPRO_AUTH_MODE=supabase`
  - literal `VITE_REEDITPRO_API_MODE=cloud_run`
  - literal `VITE_REEDITPRO_API_TRANSPORT=google_api_gateway`
  - immutable activation-evidence `.gateway.dev` origin -> `VITE_REEDITPRO_API_BASE_URL`
- API mode: authenticated browser transport through Google API Gateway to IAM-private Cloud Run

The workflow requires its own dispatch ref/SHA to equal the exact continuation branch tip, checks out that same SHA, and refuses to build unless a successful `Private Browser API Gateway Staging Activation` run from the same repository, branch, and SHA is proven through the GitHub Actions API. The activation workflow enforces the same self-ref/self-SHA rule and uploads a sanitized, immutable, attempt-specific evidence artifact only after strict gateway readiness passes. The Pages workflow downloads the artifact from that exact run and attempt, validates its closed schema and all source/cloud/security boundaries, and derives the gateway origin from it instead of accepting a separately typed hostname. It then reproves gateway health, protected-route auth denial, and exact noncredentialed CORS for the GitHub Pages origin before installing or building frontend dependencies.

The static build receives only the public Supabase origin/anon key, the authenticated API Gateway origin, and literal browser modes. It audits the compiled artifact for the exact gateway transport and refuses backend-only secret-name leakage. It copies `index.html` to `404.html` so Pages deep links return to the React router. Both the router and Google OAuth callback honor `/Reedkt/`.

Before upload, the workflow serves the compiled subpath locally with the exact reviewed Vite base path and a strict port, then runs the credential-free hosted-route verifier. After Pages deployment, it retries that verifier against the deployed URL. This proves the current Google-first sign-in surface and browser-safe Supabase configuration are present; it does not click Google, submit credentials, or prove a session.

The gateway-mode compiled app was locally built and served with `--base=/Reedkt/` using public fixture Supabase and `.gateway.dev` values. It passed the compiled-artifact gateway/secret-boundary audit and the hosted-route verifier at `/Reedkt/sign-in?returnTo=/dashboard`: the current sign-in card, Google action, password fallback, and Supabase-mode surface were all present. A base-unaware preview attempt correctly failed because its `/Reedkt/assets/*` requests returned 404; the guarded workflow now passes the exact reviewed base path to both build and preview and uses `--strictPort`. A separately intercepted click produced the exact `/Reedkt/sign-in?returnTo=...` callback, selected `provider=google`, and included no anon key. This is local compiled-subpath evidence, not a GitHub Pages deployment, live gateway, or live-provider result.

The workflow intentionally does not use a Google client secret, `STAGING_SUPABASE_SERVICE_ROLE_KEY`, provider secrets, worker secrets, Google Cloud credentials, Stripe secrets, or any backend-only value. It cannot deploy the backend, alter IAM, write Supabase, call a provider, run a worker, process media, render, reserve/spend customer credits, or bill a customer.

## Current Integration Boundary

The Google OAuth, gateway browser transport, guarded backend activation, and Pages deployment bridge now share `codex/backend-workflow-pipeline-continuation` locally. The branch has not been pushed, the gateway activation workflow has not run, and Pages has not been redeployed. Therefore the workflow cannot yet obtain its required successful same-SHA activation run evidence.

Edit Preferences/Edit Reference and Motion Studio remain separately owned. This deployment bridge does not implement, rewrite, or claim their UI/backend contracts; a later reviewed integration SHA must include their verified handoffs before a whole-product release test.

A read-only browser check on 2026-07-17 reached the current GitHub Pages URL but found no current ReEditPro sign-in card. Its status is `blocked_sign_in_surface_missing`, confirming that the public test artifact is stale or incorrect and must not be used for Gmail testing yet.

## Sign-In Test Path

Until `app.reeditpro.com` DNS is configured, the repository-owned test URL is:

`https://yuzastudio6-cyber.github.io/Reedkt/sign-in`

When custom app DNS is ready, the same workflow can be run with base path `/`, and the sign-in URL becomes:

`https://app.reeditpro.com/sign-in`

After owner-authorized gateway activation, Supabase Google-provider configuration, exact callback allowlisting, and Pages deployment, verify the hosted surface without submitting credentials:

```bash
REEDITPRO_CONFIRM_HOSTED_SIGN_IN_ROUTE_READINESS=VERIFY_REEDITPRO_HOSTED_SIGN_IN_ROUTE \
REEDITPRO_EXPECT_HOSTED_SUPABASE_CONFIGURED=true \
REEDITPRO_HOSTED_APP_URL=https://yuzastudio6-cyber.github.io/Reedkt/ \
npm run internal-testing:verify-hosted-sign-in-route
```

That verifier must find the current Google-first sign-in surface. It does not prove Google consent or session readback. A real interactive Google sign-in, protected-route reload, and sign-out remain the following gate.

## Boundaries

This readiness packet does not deploy the app or backend API, configure Supabase or Google OAuth, alter IAM/DNS, run tools, dispatch workers, process media, write Supabase data, sign storage URLs, reserve or spend credits, call providers, enable customer billing, or enable external beta/production. The future hosted artifact will use the real authenticated gateway transport, but backend routes remain evidence-gated and unavailable stages must continue to fail closed.

## Next Gate

`OWNER_AUTHORIZED_GATEWAY_ACTIVATION_AND_PAGES_DEPLOY_THEN_INTERACTIVE_GOOGLE_SESSION`
