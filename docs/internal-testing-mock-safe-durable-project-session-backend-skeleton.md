# Internal Testing Mock-Safe Durable Project Session Backend Skeleton

## Decision

`internal_testing_mock_safe_durable_project_session_backend_skeleton_passed_ready_for_backend_route_integration`

## Summary

This milestone turns the durable auth project/session persistence plan into a mock-safe backend access seam. Mock internal route access can pass for the seeded internal testing project/session when the server-shaped request has an auth user, workspace, project, edit session, request id, and idempotency key.

Durable Supabase access still fails closed. The skeleton names the route, audit, and membership contract, but it does not perform Supabase Data API reads, table writes, migrations, Storage calls, or service-role browser behavior.

## Access Contract

- Project Home: `/projects/:projectId`
- Edit Chat: `/projects/:projectId/edits/:editSessionId/chat`
- Edit Brief: `/projects/:projectId/edits/:editSessionId/brief`

Each route must eventually scope access through `edit_sessions.project_id`, `projects.workspace_id`, and `workspace_members.user_id`. The mock skeleton mirrors that shape with a deterministic membership fixture so route integration can be tested before durable tables are live.

## Required Durable Evidence

- `signed_in_auth_user_verified_server_side`
- `workspace_membership_verified_by_workspace_members`
- `project_membership_verified_by_projects_workspace_id`
- `edit_session_access_verified_by_project_id`
- `rls_policies_verified_for_authenticated_role`
- `explicit_data_api_grants_verified_for_authenticated_role`
- `service_role_confined_to_trusted_backend_worker_context`
- `audit_idempotency_and_rate_limit_envelope_defined`

RLS and explicit Data API grants are both required before durable access can be trusted. Service-role credentials remain backend-only and must never reach browser bundles.

## Boundaries

- No Supabase migration, SQL, Data API read/write, Storage, signed URL, or service-role browser path.
- No profile/workspace bootstrap write.
- No provider/model call, worker dispatch, media processing, render/export, credit spend, wallet mutation, Stripe, external beta, paid production, or product-ready claim.
- No raw user metadata authorization. Access must be based on server-verified auth user identity and membership rows in a later durable phase.

## Validation

- `npm run smoke:internal-testing-mock-safe-durable-project-session-backend-skeleton`
- `npm run smoke:internal-testing-durable-auth-project-session-backend-persistence-plan`
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

## Next Gate

`INTERNAL_TESTING_DURABLE_PROJECT_SESSION_BACKEND_ROUTE_INTEGRATION`
