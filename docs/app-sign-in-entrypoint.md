# ReEditPro App Sign-In Entrypoint

## Decision

`app_sign_in_entrypoint_passed_ready_for_internal_testing_auth_smoke`

## Scope

This entrypoint adds the app-side target for the public launchpad Sign in button:

- route: `/sign-in`
- default post-auth destination: `/dashboard`
- frontend auth mode: Supabase anon client only
- allowed env keys: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- internal testing env key: `VITE_REEDITPRO_INTERNAL_TEST_AUTH`

## Boundary

The route does not add service-role credentials, Supabase migrations, backend table mutations, storage signing, provider calls, worker dispatch, media processing, rendering, credit reservation, credit spend, Stripe, external beta, or production activation.

If Supabase public env values are absent, the page shows a configuration blocker and remains safe. If Supabase email/password auth is configured, the page can sign in or create an internal tester account and then open the app home entrypoint.

For repeatable local testing only, `VITE_REEDITPRO_INTERNAL_TEST_AUTH=true` lets the page create a browser-local mock auth session and continue to `/dashboard` without contacting Supabase. This mode is used by `npm run dev:internal-testing:local-upload` so an operator can test sign-in, source upload, and the preview-only local edit smoke in one loop.

For hosted/internal tester auth, run `npm run internal-testing:verify-browser-sign-in` with `REEDITPRO_CONFIRM_INTERNAL_TESTER_BROWSER_SIGN_IN=VERIFY_REEDITPRO_INTERNAL_TESTER_BROWSER_SIGN_IN`, public Supabase URL/anon key, and the tester email/password. That browser-safe Supabase sign-in verifier proves the anon auth path can return a session without printing tokens or using service-role access.

Before using real tester credentials in a hosted browser, run `npm run internal-testing:verify-hosted-sign-in-route` against the deployed app URL. That hosted sign-in route verifier proves `/sign-in?redirect=/dashboard` is reachable, shows the expected safety surface, and hands off to `/dashboard` without using credentials.

## Next Gate

`APP_SIGN_IN_ENTRYPOINT_DEPLOYMENT_AND_SUPABASE_ENV_CONFIGURATION`
