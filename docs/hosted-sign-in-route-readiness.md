# Hosted Sign-In Route Readiness

## Decision

`hosted_sign_in_route_readiness_passed_ready_for_browser_sign_in_verification`

## Purpose

This verifier closes the gap between source-level sign-in readiness and a real hosted page. It opens the deployed ReEditPro app route in a browser, verifies the `/sign-in?redirect=/internal-testing` surface, and confirms the "Open testing" handoff points back into `/internal-testing`.

It does not submit credentials, does not use service-role, does not write Supabase data, does not upload media, does not run Edit Brief, does not call Qwen, does not dispatch workers, does not render/export, and does not unlock beta or production.

## Command

```bash
REEDITPRO_CONFIRM_HOSTED_SIGN_IN_ROUTE_READINESS=VERIFY_REEDITPRO_HOSTED_SIGN_IN_ROUTE \
REEDITPRO_HOSTED_APP_URL=https://yuzastudio6-cyber.github.io/Reedkt/ \
npm run internal-testing:verify-hosted-sign-in-route
```

To require public Supabase auth configuration to be present in the deployed app bundle, add:

```bash
REEDITPRO_EXPECT_HOSTED_SUPABASE_CONFIGURED=true
```

Use the GitHub Pages URL until `app.reeditpro.com` DNS is configured. If the launchpad button still sends testers to `app.reeditpro.com` before DNS exists, the app will remain unreachable even when this repository's `/sign-in` route is correct.

## Output

The CLI emits sanitized JSON:

- target base URL
- target sign-in URL
- final browser URL
- whether the sign-in safety surface was found
- whether `/internal-testing` handoff was found
- whether public Supabase env appears configured
- `credentialsSubmitted: false`
- `serviceRoleUsed: false`
- `tokenPrinted: false`
- `passwordPrinted: false`

## Failure Meaning

- `blocked_unreachable`: hosted page or DNS is not reachable.
- `blocked_sign_in_surface_missing`: the deployed app is stale or not serving the ReEditPro sign-in surface.
- `blocked_internal_testing_handoff_missing`: the route exists, but the safe testing handoff is wrong.
- `blocked_supabase_public_env_missing`: the route is reachable, but public Supabase env was required and missing.
- `blocked_unexpected_app_subdomain_reference`: visible hosted UI still points testers at `app.reeditpro.com`.

## Next Gate

After this passes, run:

```bash
REEDITPRO_CONFIRM_INTERNAL_TESTER_BROWSER_SIGN_IN=VERIFY_REEDITPRO_INTERNAL_TESTER_BROWSER_SIGN_IN \
VITE_SUPABASE_URL=... \
VITE_SUPABASE_ANON_KEY=... \
INTERNAL_TESTER_EMAIL=... \
INTERNAL_TESTER_PASSWORD=... \
npm run internal-testing:verify-browser-sign-in
```

The browser sign-in verifier proves the public anon Supabase email/password path returns a session. The hosted route verifier proves the deployed page itself is reachable and shaped correctly.

## Boundaries

- Browser route readiness only.
- No credential submission.
- No service-role access.
- No Supabase write.
- No Storage write.
- No signed URL.
- No media upload.
- No worker dispatch.
- No provider or Qwen call.
- No render/export.
- No credit reservation or spend.
- No external beta or production unlock.
