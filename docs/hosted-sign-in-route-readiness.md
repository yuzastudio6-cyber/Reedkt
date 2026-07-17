# Hosted Sign-In Route Readiness

## Decision

`hosted_sign_in_route_readiness_contract_ready_live_host_pending`

## Purpose

This verifier closes the gap between source-level sign-in work and a deployed page. It opens `/sign-in?returnTo=/dashboard` on the exact hosted app base URL and checks that the current ReEditPro surface is present with:

- Google as the primary action;
- the email/password recovery disclosure;
- browser-safe Supabase configuration active;
- the private-preview billing/delivery boundary;
- no stale reference to a different app origin.

It does not click Google, follow the provider redirect, submit credentials, create a session, use service-role access, mutate Supabase, upload media, call providers, dispatch workers, render/export, or unlock beta/production.

The verifier itself has passed against a locally served compiled `/Reedkt/` artifact with browser-safe fixture values. A read-only check of the public GitHub Pages host on 2026-07-17 reached the URL but returned `blocked_sign_in_surface_missing`; the current hosted artifact is not the reviewed Google-first build.

## Command

```bash
REEDITPRO_CONFIRM_HOSTED_SIGN_IN_ROUTE_READINESS=VERIFY_REEDITPRO_HOSTED_SIGN_IN_ROUTE \
REEDITPRO_EXPECT_HOSTED_SUPABASE_CONFIGURED=true \
REEDITPRO_HOSTED_APP_URL=https://yuzastudio6-cyber.github.io/Reedkt/ \
npm run internal-testing:verify-hosted-sign-in-route
```

Use the reviewed GitHub Pages URL until `app.reeditpro.com` DNS and hosting are configured. Exact loopback HTTP is supported for local verification; non-loopback targets must use HTTPS and credential-bearing URLs are rejected.

## Output

The CLI emits sanitized JSON containing:

- target base, sign-in, and final URLs;
- current sign-in surface status;
- Google primary-action status;
- email/password fallback status;
- inferred browser-safe Supabase configuration status;
- `credentialsSubmitted: false`;
- `providerRedirectFollowed: false`;
- `serviceRoleUsed: false`;
- `tokenPrinted: false`;
- `passwordPrinted: false`.

The browser is closed before the result is emitted, including on failure.

## Failure Meaning

- `blocked_unreachable`: the deployment or DNS is unavailable.
- `blocked_sign_in_surface_missing`: a stale or incorrect app is deployed.
- `blocked_google_primary_action_missing`: the Google-first surface or its fallback is missing.
- `blocked_supabase_public_env_missing`: required browser-safe Supabase/Auth mode configuration was not inlined.
- `blocked_unexpected_app_subdomain_reference`: the visible page points at a different app origin.

## Next Gate

A passing hosted route check is not Gmail authentication proof. The next gate is an interactive Google sign-in that verifies:

1. the Google consent/account flow reaches the exact allowlisted callback;
2. Supabase returns a real Google-backed session;
3. `/dashboard` and another guarded route survive a browser reload;
4. identity/provider labeling is correct;
5. sign-out clears the session and returns to guarded sign-in;
6. no access or refresh token is printed or placed in application logs.

## Boundaries

- Hosted route inspection only.
- No credential submission or provider redirect.
- No service-role access or Supabase mutation.
- No storage, media, tools, worker, provider, render/export, credit, billing, public-delivery, external-beta, or production authority.
