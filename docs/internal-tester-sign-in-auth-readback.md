# Internal Tester Sign-In Auth Readback

## Decision

`internal_tester_sign_in_auth_readback_gate_passed_ready_for_manual_readback_workflow`

## Purpose

After the staging tester provisioning workflow runs, the next safe gate is a backend-only readback check. This workflow confirms that the tester email maps to a Supabase Auth user and that the expected profile, workspace, and workspace membership rows exist before the tester attempts browser sign-in.

The readback does not sign in as the user and does not prove the user's password or magic-link flow. It proves backend identity/workspace readiness and records whether email confirmation was observed.

## Operator Flow

1. Run **Internal Tester Profile Workspace Provisioning** if the tester has not been provisioned yet.
2. Run **Internal Tester Sign-In Auth Readback**.
3. Set `confirm_internal_tester_auth_readback` to `VERIFY_REEDITPRO_INTERNAL_TESTER_AUTH_READBACK`.
4. Provide the same tester email.
5. Confirm the CLI output decision is `internal_tester_sign_in_auth_readback_passed_ready_for_browser_sign_in_test`.
6. Run `npm run internal-testing:verify-browser-sign-in` with public Supabase URL/anon key and the tester email/password to prove the browser-safe Supabase sign-in path returns a session.
7. Open `https://yuzastudio6-cyber.github.io/Reedkt/sign-in` and complete the browser sign-in test.

The CLI emits sanitized JSON only. It prints an email hash, user id, profile id, workspace id, membership id, role, and email confirmation status. It does not print service-role keys, passwords, invite links, or signed URLs.

## Safety Boundary

This is a read-only staging operator workflow. It does not add a public API, frontend secret, Vite secret, Supabase migration, schema mutation, data mutation, storage upload, signed URL, provider call, worker dispatch, tool execution, media processing, render/export, credit reservation, credit spend, Stripe billing, external beta unlock, or production unlock.

The service-role secret remains backend-only in GitHub Actions. The deployed static app continues to use only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Next Gate

`INTERNAL_TESTER_BROWSER_SIGN_IN_VERIFICATION`
