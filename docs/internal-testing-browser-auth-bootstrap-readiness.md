# Internal Testing Browser Auth Bootstrap Readiness

## Decision

`internal_testing_browser_auth_bootstrap_readiness_passed_ready_for_manual_signed_in_browser_readback`

## Summary

This milestone adds a signed-in bootstrap readiness panel to `/internal-testing`. It lets an internal tester see whether the browser-safe auth bootstrap can create or reuse their profile, workspace, and membership through the Supabase anon client when RLS permits it.

If RLS blocks profile or workspace setup, the panel reports `backend_required` so the backend-only manual provisioning and readback workflows can finish setup without exposing service-role keys to browser code.

Browser self-sign-up is not the authoritative internal tester confirmation path. If Supabase creates a user without returning a session, `/sign-in` now treats that as `Tester provisioning required` and tells the tester to use the backend provisioning workflow instead of waiting on email confirmation delivery.

## Readiness Surface

- The panel uses `useAuthBootstrap`, the same browser-safe hook used by `/sign-in`.
- The panel displays auth bootstrap status, mode, next step, signed-in email when available, and workspace readiness.
- A refresh button rechecks the current browser session.
- `backend_required` points testers to the manual provisioning and readback workflows.

## Boundaries

- The only allowed browser mutation is signed-in profile/workspace bootstrap through the Supabase anon client when RLS permits it.
- No service-role key, admin client, password readback, signed URL, Storage upload, SQL, migration, or policy mutation is available in browser code.
- No project/session writes, provider/model calls, worker dispatch, media processing, render/export, credit spend, ledger write, Stripe, external beta, paid production, or product-ready claim is enabled.
- Backend-only provisioning remains the fallback when RLS blocks browser-safe bootstrap.

## Remaining Gates

Manual end-to-end testing still needs a real tester email to be provisioned/read back, followed by browser sign-in verification against the deployed app.

Next gate: `MANUAL_TESTER_EMAIL_PROVISIONING_AND_BROWSER_SIGN_IN`.

## Validation

- `npm run smoke:internal-testing-browser-auth-bootstrap-readiness`
- `npm run smoke:internal-testing-auth-project-access-readiness`
- `npm run smoke:internal-testing-qa-wrapper`
- `npm run qa:internal-testing`
- `npm run smoke:app-sign-in-entrypoint`
- `npm run check:frontend-boundary`
- `npm run smoke:supabase-command-safety`
- `npm run typecheck:server`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`
