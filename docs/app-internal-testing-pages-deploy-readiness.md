# ReEditPro Internal Testing App Deploy Readiness

## Decision

`app_internal_testing_pages_workflow_locally_ready_google_oauth_hosted_configuration_pending`

## Deployment Target

- Manual workflow: `.github/workflows/app-internal-testing-pages-deploy.yml`
- Reviewed integration source ref: `codex/reeditpro-web-ui-shell`
- Default Vite base path: `/Reedkt/`
- Browser-safe configuration:
  - `STAGING_SUPABASE_URL` -> `VITE_SUPABASE_URL`
  - `STAGING_SUPABASE_ANON_KEY` -> `VITE_SUPABASE_ANON_KEY`
  - literal `VITE_REEDITPRO_AUTH_MODE=supabase`
- API mode: `mock`

The workflow checks out an exact operator-supplied SHA, builds with the requested allowlisted base path, and copies `index.html` to `404.html` so GitHub Pages deep links return to the React router. The router and Google OAuth callback now both honor the same Vite base path.

The compiled app was locally served with `--base=/Reedkt/` and passed the hosted-route verifier at `/Reedkt/sign-in?returnTo=/dashboard`: the current sign-in card, Google action, password fallback, and Supabase-mode surface were all present. A separately intercepted click produced the exact `/Reedkt/sign-in?returnTo=...` callback, selected `provider=google`, and included no anon key. This is compiled-subpath evidence, not a GitHub Pages deployment or live-provider result.

The workflow intentionally does not use a Google client secret, `STAGING_SUPABASE_SERVICE_ROLE_KEY`, provider secrets, worker secrets, Google Cloud credentials, Stripe secrets, or any backend-only value.

## Current Integration Boundary

The Google OAuth changes are on `codex/backend-workflow-pipeline-continuation`. The workflow remains fail-closed to the reviewed integration source `codex/reeditpro-web-ui-shell`, so this slice cannot be deployed through it until an authorized review/integration places the commit on that source ref. This document does not claim that integration or deployment has happened.

A read-only browser check on 2026-07-17 reached the current GitHub Pages URL but found no current ReEditPro sign-in card. Its status is `blocked_sign_in_surface_missing`, confirming that the public test artifact is stale or incorrect and must not be used for Gmail testing yet.

## Sign-In Test Path

Until `app.reeditpro.com` DNS is configured, the repository-owned test URL is:

`https://yuzastudio6-cyber.github.io/Reedkt/sign-in`

When custom app DNS is ready, the same workflow can be run with base path `/`, and the sign-in URL becomes:

`https://app.reeditpro.com/sign-in`

After reviewed integration, Supabase Google-provider configuration, exact callback allowlisting, and deployment, verify the hosted surface without submitting credentials:

```bash
REEDITPRO_CONFIRM_HOSTED_SIGN_IN_ROUTE_READINESS=VERIFY_REEDITPRO_HOSTED_SIGN_IN_ROUTE \
REEDITPRO_EXPECT_HOSTED_SUPABASE_CONFIGURED=true \
REEDITPRO_HOSTED_APP_URL=https://yuzastudio6-cyber.github.io/Reedkt/ \
npm run internal-testing:verify-hosted-sign-in-route
```

That verifier must find the current Google-first sign-in surface. It does not prove Google consent or session readback. A real interactive Google sign-in, protected-route reload, and sign-out remain the following gate.

## Boundaries

This readiness packet does not deploy the app or backend API, configure Supabase or Google OAuth, alter IAM/DNS, run tools, dispatch workers, process media, write Supabase data, sign storage URLs, reserve or spend credits, call providers, enable customer billing, or enable external beta/production. With API mode still `mock`, the hosted artifact is only a sign-in/app shell and cannot run the professional backend pipeline.

## Next Gate

`REVIEWED_SOURCE_INTEGRATION_SUPABASE_GOOGLE_PROVIDER_AND_HOSTED_CALLBACK_VERIFICATION`
