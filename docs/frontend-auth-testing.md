# Frontend Authentication And Test Sessions

Status: `implemented_frontend_entry_not_production_onboarding`

## Purpose

ReeditPro app routes require an explicit browser session. The public landing page and `/sign-in` remain public. This slice provides a professional entry point for local end-to-end testing and Supabase email/password sign-in when approved public browser configuration exists.

It does not create production accounts, provision subscriptions, mutate wallets, bypass backend authorization, or enable public delivery/provider execution.

## Runtime Modes

Set `VITE_REEDITPRO_AUTH_MODE` explicitly:

- `supabase`: uses the existing frontend-safe Supabase client and email/password helper. `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must both be configured.
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

In `supabase` mode, `/sign-in` calls `signInWithEmailPassword` from the existing auth client service. Supabase owns browser session persistence and refresh. The app subscribes to Supabase auth state changes and uses the verified session identity in the shell.

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
