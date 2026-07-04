# Internal Testing Auth Project Access Readiness

## Decision

`internal_testing_auth_project_access_readiness_passed_ready_for_authenticated_internal_testing_entrypoint`

## Summary

This milestone adds a read-only Auth and project-access readiness check to `/internal-testing`. It lets an internal tester see whether frontend-safe Supabase Auth configuration exists, whether a browser user is signed in, and which mock project/session routes are ready for repeated testing.

This is production-shaped, not product-ready. The check intentionally does not run the existing profile/workspace bootstrap path, does not read or write Supabase project/profile/workspace tables, and does not create Storage objects, signed URLs, credits, worker jobs, media processing, or render/export work.

## Readiness Surface

- Public Supabase Auth client status is checked through the frontend anon boundary.
- Browser session/user state is read only when public Auth env values are configured.
- Mock project route remains `/projects/mock-project-edit-chat-foundation`.
- Mock edit-session route remains `/projects/mock-project-edit-chat-foundation/edits/edit-session-youtube-wide/chat`.
- Mock Edit Brief route remains `/projects/mock-project-edit-chat-foundation/edits/edit-session-youtube-wide/brief`.

## Accepted Evidence

- `auth-project-access-readiness` is a `mock_local` internal testing scenario.
- `/internal-testing` exposes Auth status, configured/not-configured state, signed-in email when available, and mock project/session route links.
- `readInternalTestingAuthProjectAccessReadiness` uses auth/session/user read helpers only.
- The implementation does not call `runAuthBootstrapFlow`, profile repositories, workspace repositories, route handlers, Storage, SQL, migrations, workers, providers, media tools, or credit spend paths.

## Boundaries

- No service-role key or admin client.
- No profile/workspace bootstrap writes.
- No Supabase Data API table reads or writes.
- No Storage, signed URL, SQL, migration, or policy mutation.
- No provider/model calls, worker dispatch, media processing, render/export, credit spend, ledger writes, Stripe, external beta, paid production, or product-ready claim.

## Remaining Gates

Durable authenticated project/session testing still needs explicit backend persistence gates: real project membership, profile/workspace row policy, RLS, Storage/privacy policy, approved-plan snapshot handoff, credit reservation persistence, worker/provider/render activation, monitoring, and deployment readback.

## Validation

- `npm run smoke:internal-testing-auth-project-access-readiness`
- `npm run smoke:internal-testing-qa-wrapper`
- `npm run qa:internal-testing`
- `npm run smoke:worker`
- `npm run smoke:prod-cost-controls`
- `npm run smoke:prod-runtime-contracts`
- `npm run typecheck:server`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`
