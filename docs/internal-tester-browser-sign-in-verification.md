# Internal Tester Google Session Readiness

## Decision

`internal_tester_google_session_readiness_workflow_source_ready_remote_pages_and_interactive_session_pending`

## Purpose

`.github/workflows/internal-tester-browser-sign-in-verification.yml` is now a credential-free CI readiness gate for the real Google session test. It replaces the stale password-based lane that checked out an unrelated branch and attempted a public Supabase email/password call.

The workflow does not store a tester password, accept a tester email, use a Supabase service-role key, click Google, submit credentials, create a browser session, or claim Gmail sign-in success.

## Required Evidence

The manual workflow requires:

- exact confirmation `VERIFY_REEDITPRO_GOOGLE_SESSION_READINESS`;
- its own dispatch ref and SHA to equal the reviewed `codex/backend-workflow-pipeline-continuation` tip;
- a successful `App Signed-In Internal Testing Pages Deploy` run from the same repository, branch, and SHA;
- the exact reviewed GitHub Pages base URL;
- the hosted Google-first sign-in card, public Supabase configuration, Google action, and password fallback to remain visible;
- the interactive verifier's source/confidentiality smoke plus repository boundary and secret scans to pass.

The same-SHA Pages run is already downstream of the immutable API Gateway activation artifact. Therefore this gate cannot silently verify a stale mock-mode frontend or an unrelated gateway.

## What CI Proves

Credential-free CI readiness proves that the correct app was deployed from the same reviewed source and that the owner-local verifier is present and fail-closed. It does not prove a Gmail session because Google account selection, password/passkey/MFA, and consent must stay under the owner's direct control.

CI explicitly does not invoke:

```bash
npm run internal-testing:verify-interactive-google-session
```

That command is rejected when `CI=true`.

## Owner-Interactive Gate

After this readiness workflow passes, use the owner-local process in `docs/internal-tester-interactive-google-session.md`. The headed browser verifier requires the exact hosted app, public Supabase origin, activation-evidence gateway origin, and expected Google email. It clicks only ReEditPro's Google handoff and waits for the owner to complete Google's UI.

A pass requires exact callback return, `Google session` identity, expected email match, protected dashboard reload, a successful protected `/v1/projects` gateway response, sign-out, and guarded-route denial after sign-out.

For a brand-new Google identity, callback/identity/reload may succeed before profile/workspace membership exists. The verifier must still fail closed at `/v1/projects`. Use its emitted email hash with the same-SHA protected profile/workspace provisioning and readback workflows, then rerun the owner-local verifier; do not weaken gateway authorization or create/invite the Auth user from the backend.

## Current State

Source readiness is implemented locally on `codex/backend-workflow-pipeline-continuation`. The workflow has not been pushed or run, the Pages/gateway activation workflows have not run, and no live Google session has been attempted.

## Boundaries

- No tester password secret.
- No automated Google credential entry.
- No service-role access or Supabase admin operation.
- No Supabase write or migration.
- No browser storage export, trace, screenshot, or video.
- No upload, media processing, tools, providers, workers, render/export, credits, Stripe, billing, public delivery, external beta, or production authority.

## Next Gate

`RUN_CREDENTIAL_FREE_READINESS_THEN_OWNER_GOOGLE_SESSION_WITH_CONDITIONAL_SAME_SHA_BOOTSTRAP_RETRY`
