# Internal Tester Browser Password Bootstrap

## Decision

`internal_tester_browser_password_bootstrap_gate_passed_ready_for_manual_staging_workflow`

## Purpose

Hosted browser sign-in verification needs a real staging Supabase Auth user whose password is known to the verifier but never stored in source control. This gate adds a backend-only GitHub Actions workflow that creates or updates the internal tester Auth password from the `STAGING_INTERNAL_TESTER_PASSWORD` repository secret.

The workflow uses the staging Supabase service-role key only inside GitHub Actions. It does not expose the password to the frontend, logs, docs, shell history, or committed files.

## Operator Flow

1. Set or rotate the repository secret `STAGING_INTERNAL_TESTER_PASSWORD`.
2. Run **Internal Tester Browser Password Bootstrap** from GitHub Actions.
3. Set `confirm_internal_tester_browser_password_bootstrap` to `BOOTSTRAP_REEDITPRO_INTERNAL_TESTER_BROWSER_PASSWORD`.
4. Set `allow_staging_writes` to `true`.
5. Provide the tester email.
6. Run **Internal Tester Profile Workspace Provisioning** for profile/workspace readiness.
7. Run **Internal Tester Sign-In Auth Readback**.
8. Run **Internal Tester Browser Sign-In Verification**.

The CLI output is sanitized JSON. It prints an email hash and user id, but it never prints passwords, tokens, invite links, signed URLs, or service-role keys.

## Auth Behavior

- Existing tester Auth user: update password and request email confirmation.
- Missing tester Auth user: create the user with the supplied password and request email confirmation.
- Minimum password length: 12 characters.
- Password source: `STAGING_INTERNAL_TESTER_PASSWORD` repository secret only.

## Safety Boundary

This is a staging-only operator workflow. It does not add a public API, Vite secret, frontend secret, Supabase migration, schema mutation, profile/workspace row write, Storage upload, signed URL, provider call, Qwen call, worker dispatch, tool execution, media processing, render/export, credit reservation, credit spend, Stripe billing, external beta unlock, or production unlock.

The deployed static app continues to use only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Next Gate

`INTERNAL_TESTER_PROFILE_WORKSPACE_PROVISIONING`
