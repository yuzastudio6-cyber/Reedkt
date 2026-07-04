# Internal Testing Auth Project Session Membership Policy

## Decision

`internal_testing_auth_project_session_membership_policy_passed_ready_for_durable_auth_project_session_backend_persistence_plan`

## Summary

This milestone adds a route-visible project/session access policy for internal testing. Project Home, Edit Chat, and Edit Brief now display a shared access-policy notice that separates mock internal route access from durable authenticated project/session membership.

Mock route access remains allowed for repeated local testing. Durable authenticated project/session access remains blocked until explicit evidence exists for Auth, workspace membership, project membership, edit-session access, RLS policy, Data API grants, and backend persistence mode.

## Evidence Contract

Durable access requires all of the following:

- `signed_in_auth_user`
- `workspace_membership_verified`
- `project_membership_verified`
- `edit_session_access_verified`
- `rls_policy_verified`
- `explicit_data_api_grants_verified`
- `backend_persistence_mode_verified`

The current route policy intentionally reports missing durable evidence by default. This is progress because the actual route family now surfaces the exact gate instead of silently allowing future code to imply durable access.

## Route Surfaces

- `/projects/mock-project-edit-chat-foundation`
- `/projects/mock-project-edit-chat-foundation/edits/edit-session-youtube-wide/chat`
- `/projects/mock-project-edit-chat-foundation/edits/edit-session-youtube-wide/brief`
- `/internal-testing`

## Supabase Boundary

This milestone is informed by Supabase's 2026 Data API exposure change: table access must not be assumed. Future durable project/session access must prove RLS and explicit Data API grants before any table-backed route can claim readiness.

No SQL, migration, Supabase CLI, Storage, service-role, profile/workspace bootstrap write, or Data API table access is added here.

## Boundaries

- No service-role or admin client.
- No profile/workspace bootstrap writes.
- No Supabase Data API table reads or writes.
- No Storage, signed URL, SQL, migration, or policy mutation.
- No provider/model calls, worker dispatch, media processing, render/export, credit spend, ledger writes, Stripe, external beta, paid production, or product-ready claim.

## Validation

- `npm run smoke:internal-testing-auth-project-session-membership-policy`
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

## Next

The next safe milestone is a durable authenticated project/session backend persistence plan. That plan should define how backend routes verify workspace membership, project membership, edit-session access, RLS, Data API grants, and audit/idempotency boundaries without exposing service-role credentials to the browser.
