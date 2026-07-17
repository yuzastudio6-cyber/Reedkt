# ReEditPro App Sign-In Entrypoint

## Decision

`app_sign_in_google_oauth_handoff_passed_local_ready_for_private_staging_configuration`

## Product Behavior

The app has one guarded sign-in entry at `/sign-in` and returns a successful session to a sanitized internal route, defaulting to `/dashboard`.

- Google is the primary sign-in action.
- Email/password remains available in a quiet disclosure as a recovery and internal-tester fallback.
- The callback is built from the exact browser origin plus the Vite base path, so `/Reedkt/sign-in` works on the GitHub Pages test host and `/sign-in` works on a future custom domain.
- External, credential-bearing, non-HTTPS, and malformed callback targets fail closed. HTTP is accepted only for exact loopback development hosts.
- ReEditPro asks Supabase not to auto-redirect, verifies the returned authorization URL against the configured Supabase origin, Google provider, authorize endpoint, and exact callback, then permits browser navigation.
- OAuth provider error details are replaced with recoverable, non-technical user messages.
- App routes remain guarded until Supabase returns a real session.

## Browser-Safe Configuration

The static app may receive only:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_REEDITPRO_AUTH_MODE=supabase`

No Google client secret, Supabase service-role key, worker credential, provider key, billing key, or storage signing credential belongs in the browser bundle. The Google OAuth client secret must stay in the Supabase Auth provider configuration.

## Verified Locally

- the Google action is visually dominant and keyboard accessible;
- email/password stays available as an accessible fallback;
- exact internal `returnTo` state survives the OAuth handoff;
- external return targets resolve to `/dashboard`;
- provider errors do not expose provider details;
- the GitHub Pages base path is normalized and applied to both the router and callback;
- the public Supabase authorize URL is constructed without embedding the anon key or any secret;
- a compiled `/Reedkt/` build hands Google the exact `/Reedkt/sign-in` callback and safe internal return path;
- existing local-session authentication and public marketing regressions still pass.

Run:

```bash
npm run smoke:app-sign-in-entrypoint
npm run smoke:google-oauth-sign-in
npm run qa:google-oauth-sign-in
```

## Not Yet Proven

Local code and browser interception do not prove a real Gmail session. Before calling Google sign-in end to end, all of these must pass:

1. Enable Google in the intended Supabase Auth project with the approved Google OAuth client ID and secret.
2. Register the exact Supabase provider callback URI in Google Cloud.
3. Add the exact hosted ReEditPro `/sign-in` callback to the Supabase redirect allowlist.
4. Integrate this commit into the reviewed deployment source and deploy the static app with the three browser-safe variables above.
5. Run the hosted route verifier and then complete a real Google browser sign-in, session readback, protected-route reload, and sign-out test without printing tokens.

No remote Supabase setting, Google credential, GitHub Pages deployment, or live Gmail login was changed or performed in this slice.

## Boundary

This entrypoint does not add service-role access, Supabase migrations or table mutation, storage signing, backend API exposure, provider execution, worker dispatch, media processing, rendering, credit reservation/spend, Stripe, customer billing, public delivery, external beta, or production activation.

## Next Gate

`SUPABASE_GOOGLE_PROVIDER_HOSTED_CALLBACK_AND_REAL_BROWSER_READBACK`
