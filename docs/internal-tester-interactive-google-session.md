# Interactive Google Session Verification

## Decision

`interactive_google_session_verifier_source_ready_live_host_and_owner_session_pending`

## Purpose

This is the real Gmail/Google-session gate for ReEditPro's private staging app. It is intentionally owner-local and headed: ReEditPro opens a fresh Playwright Chromium window and clicks only the app's reviewed **Continue with Google** action. The owner completes Google account selection, authentication, and consent directly in Google's UI.

The verifier never reads or enters a Google password, passkey, recovery code, MFA code, or cookie. It never exports browser storage, writes Playwright storage state, records a trace/video/screenshot, prints a token, or runs in CI.

## Evidence Required

A pass requires all of the following in one fresh browser context:

1. the exact reviewed hosted `/sign-in` surface is present;
2. the handoff visits the expected public Supabase `/auth/v1/authorize` origin and `https://accounts.google.com`;
3. the provider returns through the exact hosted ReEditPro `/sign-in` callback and removes OAuth code/error material from the final URL;
4. the app shows the expected email with `Google session` identity labeling;
5. `/dashboard` remains signed in after a full reload;
6. `/projects` receives a successful authenticated `GET /v1/projects` response from the exact activation-evidence `.gateway.dev` origin;
7. **Sign out** clears the Supabase auth record, and reopening `/dashboard` returns to guarded sign-in.

Only response origin, path, method, and status are used for gateway evidence. Request headers, response bodies, tokens, and browser-storage values are never read into the report.

## Owner-Local Command

Run this only after the guarded gateway activation and Pages deployment both pass for the same reviewed SHA:

```bash
npx playwright install chromium

REEDITPRO_CONFIRM_INTERACTIVE_GOOGLE_SESSION=VERIFY_REEDITPRO_INTERACTIVE_GOOGLE_SESSION \
REEDITPRO_HOSTED_APP_URL=https://yuzastudio6-cyber.github.io/Reedkt/ \
REEDITPRO_EXPECTED_SUPABASE_ORIGIN=https://PROJECT_REF.supabase.co \
REEDITPRO_EXPECTED_API_GATEWAY_ORIGIN=https://ACTIVATED_GATEWAY.gateway.dev \
REEDITPRO_EXPECTED_GOOGLE_EMAIL=OWNER_GMAIL_ADDRESS \
REEDITPRO_INTERACTIVE_GOOGLE_SESSION_TIMEOUT_SECONDS=600 \
npm run internal-testing:verify-interactive-google-session
```

The public Supabase origin must match the reviewed staging project. The gateway origin must come from the immutable activation-evidence artifact consumed by the successful Pages run. The expected email is compared inside the browser and only a 16-character SHA-256 prefix is emitted.

## First-Login Bootstrap Case

For a brand-new Google tester, steps 1-5 may pass while step 6 fails because no ReEditPro profile/workspace membership exists yet. That is an expected fail-closed boundary, not a reason to automate Google credentials or weaken `/v1/projects` authorization.

When the result shows the expected Google identity but blocks at gateway readback:

1. keep the emitted `expectedEmailHash`;
2. run the exact-SHA **Internal Tester Google Profile Workspace Provisioning** workflow with that hash and protected `STAGING_INTERNAL_TESTER_EMAIL` secret;
3. pass **Internal Tester Google Auth Readback** for the same SHA/hash;
4. rerun this owner-local verifier from a fresh browser and require all seven gates, including sign-out.

The provisioning workflow cannot create or invite the Auth user. The first owner-controlled Google handoff is what establishes that prerequisite identity.

## Current State

The CLI's missing-confirmation, CI-rejection, invalid-host, and confidentiality boundaries pass locally. A live Google session has not been attempted because the private gateway, hosted app, provider configuration, and callback allowlists have not yet passed their owner-authorized remote gates.

## Boundaries

- Owner-controlled Google UI only; no automated credential entry.
- Fresh non-persistent browser context; no storage-state export.
- No service-role key, Supabase Admin API, Data API profile/workspace write, or migration is used by this verifier. Google OAuth necessarily creates or updates the user's Supabase Auth identity/session on the remote Auth service.
- No upload, media processing, tool execution, provider generation, worker dispatch, render/export, credit mutation, Stripe, customer billing, public delivery, external beta, or production authority.
- A pass proves authentication and private API transport only. The signed-in large-source edit journey remains the next gate.

## Next Gate

`IF_WORKSPACE_MISSING_RUN_SAME_SHA_PROVISION_AND_READBACK_ELSE_RUN_SIGNED_IN_LARGE_SOURCE_PRIVATE_EDIT_JOURNEY`
