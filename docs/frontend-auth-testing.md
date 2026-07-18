# Frontend Authentication And Test Sessions

Status: `implemented_frontend_entry_not_production_onboarding`

## Purpose

ReeditPro app routes require an explicit browser session. The public landing page and `/sign-in` remain public. This slice provides a professional entry point for local end-to-end testing and a Google-first Supabase sign-in surface when approved public browser configuration exists. Email/password remains a quiet recovery and internal-tester fallback.

It does not create production accounts, provision subscriptions, mutate wallets, bypass backend authorization, or enable public delivery/provider execution.

## Runtime Modes

Set `VITE_REEDITPRO_AUTH_MODE` explicitly:

- `supabase`: uses the frontend-safe Supabase client, Google OAuth handoff, and email/password fallback. `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must both be configured. Google provider enablement and callback allowlisting remain remote prerequisites.
- `local_test`: available only when Vite reports `DEV` and the browser hostname is `localhost`, `127.x.x.x`, or `::1`.
- blank/unknown: fails closed. App routes redirect to `/sign-in`, which explains that authentication is unavailable.

## Local Test Safety

The local test session:

- is written only to `sessionStorage` under `reeditpro.auth.localTestSession.v1`;
- contains a display identity and creation timestamp only;
- does not create a bearer token, JWT, API credential, cookie, or Supabase session;
- ends when the tab session closes or the tester selects **Sign out**;
- cannot activate outside Vite development on a loopback hostname.

The normal frontend-only local test identity does not authenticate deployed backend routes. When the explicitly guarded `npm run dev:private-workspace` workflow is used, the loopback-only Express runtime may map a tokenless loopback request to its fixed `mock-user-runtime` identity. That mapping is accepted only in non-production local/mock mode, only from a loopback caller/origin, and never creates or exposes a bearer token. See `docs/private-workspace-manual-testing.md`.

## Interactive Private Workspace

For one-command signed-in browser testing against the real local Express `/v1` routes, run:

```bash
npm run dev:private-workspace
```

This injects `local_test` auth, reviewed `frontend_safe` transport, and local private uploads into isolated child processes. It scrubs external-service configuration, binds both services to loopback, and leaves normal `npm run dev` behavior unchanged. This is a private single-host test capability, not Supabase/staging/production authentication evidence.

The launcher exposes reviewed `/v1` calls to the browser through a loopback-only same-origin Vite proxy. The API still runs on its separate private loopback port, but browser code does not need direct access to that port.

## Protected Routes

All current app routes and legacy app redirects are wrapped by `RequireAuth`. The guard stores only a sanitized same-app path in the `returnTo` query parameter. Absolute URLs, protocol-relative targets, backslash paths, and `/sign-in` loops fall back to `/dashboard`.

Public routes:

- `/`
- `/sign-in`

## Supabase Sign-In

In `supabase` mode, `/sign-in` calls `signInWithOAuth({ provider: 'google' })` through the auth client service. The callback uses the exact browser origin, Vite base path, and sanitized same-app return target. Email/password calls `signInWithEmailPassword` only after the tester opens the fallback disclosure. Supabase owns browser session persistence and refresh. The app subscribes to Supabase auth state changes and uses the verified session identity and provider label in the shell.

Only the public anon key belongs in Vite configuration. Service-role keys, database credentials, provider secrets, and raw tokens must never be exposed through `VITE_*` variables.

## Browser QA

Playwright starts Vite with `VITE_REEDITPRO_AUTH_MODE=local_test`. Shared route helpers enter through `/sign-in` before protected route assertions, so normal route/editor tests exercise the guard rather than bypassing it.

Run focused QA with a fresh server:

```bash
PLAYWRIGHT_PORT=5197 PLAYWRIGHT_REUSE_SERVER=false npx playwright test tests/e2e/auth.spec.ts
```

Representative editor QA remains required after auth changes:

```bash
PLAYWRIGHT_PORT=5194 PLAYWRIGHT_REUSE_SERVER=false npm run qa:editor
```

Google-specific local contract and browser QA:

```bash
npm run smoke:google-oauth-sign-in
npm run qa:google-oauth-sign-in
```

These checks do not contact Google or prove a real Gmail session. That requires hosted provider/callback configuration and interactive browser readback.

## Hosted Google Session Evidence

The hosted staging path is deliberately split so CI never handles a tester password or automates a Google account:

1. `.github/workflows/beta-readiness-api-staging-deploy.yml` must activate and verify the IAM-private API Gateway path for the exact reviewed SHA and emit its sanitized immutable evidence artifact.
2. `.github/workflows/app-internal-testing-pages-deploy.yml` must consume that exact successful same-SHA artifact, derive the gateway origin from it, build the Supabase/Google-first app, and verify the deployed `/Reedkt/sign-in` route.
3. `.github/workflows/internal-tester-browser-sign-in-verification.yml` must prove the exact Pages run and hosted sign-in surface without accepting an email/password, using a service-role key, clicking Google, or creating a session.
4. The owner then runs the headed local verifier and completes Google's account UI directly:

```bash
REEDITPRO_CONFIRM_INTERACTIVE_GOOGLE_SESSION=VERIFY_REEDITPRO_INTERACTIVE_GOOGLE_SESSION \
REEDITPRO_HOSTED_APP_URL=https://yuzastudio6-cyber.github.io/Reedkt/ \
REEDITPRO_EXPECTED_SUPABASE_ORIGIN=https://PROJECT_REF.supabase.co \
REEDITPRO_EXPECTED_API_GATEWAY_ORIGIN=https://ACTIVATED_GATEWAY.gateway.dev \
REEDITPRO_EXPECTED_GOOGLE_EMAIL=OWNER_GOOGLE_EMAIL \
npm run internal-testing:verify-interactive-google-session
```

The verifier clicks only ReEditPro's Google action. It does not enter or read Google credentials, print tokens, export browser storage, or retain a trace, screenshot, video, or storage state. A pass requires the exact callback, expected Google identity, protected dashboard reload, an authenticated 2xx `/v1/projects` response from the exact activated gateway, sign-out, and protected-route denial afterward.

Current status: all four source lanes and their local fail-closed checks exist on `codex/backend-workflow-pipeline-continuation`, but no workflow has been pushed or dispatched and no live Gmail session has passed. This is source readiness, not deployed authentication evidence.
