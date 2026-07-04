# ReEditPro App Sign-In Entrypoint

## Decision

`app_sign_in_entrypoint_passed_ready_for_internal_testing_auth_smoke`

## Scope

This entrypoint adds the app-side target for the public launchpad Sign in button:

- route: `/sign-in`
- default post-auth destination: `/internal-testing`
- frontend auth mode: Supabase anon client only
- allowed env keys: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Boundary

The route does not add service-role credentials, Supabase migrations, backend table mutations, storage signing, provider calls, worker dispatch, media processing, rendering, credit reservation, credit spend, Stripe, external beta, or production activation.

If Supabase public env values are absent, the page shows a configuration blocker and remains safe. If Supabase email/password auth is configured, the page can sign in or create an internal tester account and then open the internal testing entrypoint.

## Next Gate

`APP_SIGN_IN_ENTRYPOINT_DEPLOYMENT_AND_SUPABASE_ENV_CONFIGURATION`
