# Internal Testing Browser Auth Bootstrap Readiness

## Decision

`internal_testing_browser_auth_bootstrap_readiness_passed_ready_for_manual_signed_in_browser_readback`

## Summary

This milestone adds a signed-in bootstrap readiness panel to `/internal-testing`. It lets an internal tester see whether the browser-safe auth bootstrap can create or reuse their profile, workspace, and membership through the Supabase anon client when RLS permits it.

If RLS blocks profile or workspace setup, the panel reports `backend_required` so the backend-only manual provisioning and readback workflows can finish setup without exposing service-role keys to browser code. The operator sequence requires a real prior Google login; backend readback records the Google-linked identity and prior Auth sign-in as separate facts, while the owner-interactive verifier proves the live provider. The backend never creates or invites an Auth user.

Browser self-sign-up is not the authoritative internal tester confirmation path. The current staging sequence is Google-first: complete Google once under owner control, use the emitted email hash with the guarded same-SHA provisioning/readback workflows if workspace bootstrap is missing, then rerun the interactive verifier for authenticated gateway readback and sign-out proof.

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

Manual end-to-end testing still needs owner-authorized gateway/Pages activation, one real Google login, guarded profile/workspace provisioning and readback if RLS did not bootstrap them, and a second interactive run that passes `/v1/projects`, reload, sign-out, and post-sign-out denial.

Next gate: `OWNER_INTERACTIVE_GOOGLE_LOGIN_THEN_SAME_SHA_BOOTSTRAP_AND_GATEWAY_READBACK`.

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
