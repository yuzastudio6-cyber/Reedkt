# Internal Tester Browser Sign-In Verification

## Decision

`internal_tester_browser_sign_in_verification_passed_ready_for_internal_testing_route`

## Purpose

The existing backend readback confirms that a tester Auth user, profile, workspace, and membership exist. This verifier closes the next practical sign-in gap: it checks whether the same tester email/password can obtain a browser-safe Supabase session through the public anon auth path used by `/sign-in`.

This is a verification command only. It does not create users, reset passwords, bypass email confirmation, write profile/workspace rows, upload media, and does not upload media through Storage. It does not run Edit Brief, call Qwen, dispatch workers, render, reserve credits, or unlock beta/production.

## Command

```bash
REEDITPRO_CONFIRM_INTERNAL_TESTER_BROWSER_SIGN_IN=VERIFY_REEDITPRO_INTERNAL_TESTER_BROWSER_SIGN_IN \
VITE_SUPABASE_URL=... \
VITE_SUPABASE_ANON_KEY=... \
INTERNAL_TESTER_EMAIL=... \
INTERNAL_TESTER_PASSWORD=... \
npm run internal-testing:verify-browser-sign-in
```

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are accepted as backend/operator aliases for the same public browser-safe values. Do not pass a service-role key; this verifier does not use service-role access.

## GitHub Actions

Preferred hosted verification path:

1. Add repository secret `STAGING_INTERNAL_TESTER_PASSWORD`.
2. Confirm `STAGING_SUPABASE_URL` and `STAGING_SUPABASE_ANON_KEY` are present.
3. Run `.github/workflows/internal-tester-browser-sign-in-verification.yml`.

The workflow first runs `npm run internal-testing:verify-hosted-sign-in-route` against the deployed app URL, then runs `npm run internal-testing:verify-browser-sign-in` with the tester email input and password secret. It does not use service-role access, does not print the password or tokens, does not write Supabase data, and does not run upload/media/tool/provider/Qwen/render/credit/production behavior.

## Output

The CLI emits sanitized JSON:

- `emailHash`
- `userId`
- `sessionReturned`
- `emailConfirmed`
- `expiresAt`
- `serviceRoleUsed: false`
- `passwordPrinted: false`
- `tokenPrinted: false`

It does not print tokens, refresh tokens, passwords, invite links, signed URLs, service-role keys, raw prompts, or media paths.

## Failure Meaning

- `blocked_email_not_confirmed`: the public sign-in path still needs a confirmed/provisioned tester account before browser sign-in can work.
- `blocked_sign_in_failed`: the email/password or public Auth settings are wrong.
- `blocked_session_missing`: Supabase accepted the request but did not return a usable browser session.
- `blocked_missing_env`: public Supabase URL/anon key are not configured.

## Next Step

When the verifier passes, open the deployed `/sign-in` route with the same tester credentials and continue to `/internal-testing`. For local upload/edit-preview proof, use:

```bash
npm run test:internal-testing:local-upload-e2e
```

The local upload verifier separately proves sign-in, Edit Brief upload, preview-only local edit smoke, and Qwen 3.7 Max reasoning identity recording without live Qwen/provider calls.

## Boundaries

- Browser-safe public Supabase auth only.
- No service-role access.
- No Supabase data write.
- No Storage write.
- No signed URL.
- No media upload.
- No worker dispatch.
- No provider or Qwen call.
- No render/export.
- No credit reservation or spend.
- No external beta or production unlock.
