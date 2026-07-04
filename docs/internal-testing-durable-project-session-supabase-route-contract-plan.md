# Internal Testing Durable Project Session Supabase Route Contract Plan

## Decision

`internal_testing_durable_project_session_supabase_route_contract_plan_passed_ready_for_schema_rls_draft`

## Summary

This milestone records the durable Supabase route contract for Project Home, Project Edit Session, and Project Edit Brief routes. It accepts the previous readback QA evidence only as mock-safe route metadata and defines what a later schema/RLS draft must prove before any table-backed route access can graduate.

This is contract planning only. It does not apply a migration, SQL, RLS policy, Data API grant, Storage policy, service-role path, live route read, live route write, worker dispatch, media processing, render/export, credit spend, external beta, paid production, or product-ready behavior.

## Source Evidence

- Prior readback QA decision: `internal_testing_durable_project_session_backend_readback_qa_passed_ready_for_durable_supabase_route_contract_plan`.
- Prior persistence plan decision: `internal_testing_durable_auth_project_session_backend_persistence_plan_passed_ready_for_mock_safe_backend_skeleton`.
- Prior mock route metadata included `projectSessionAccess` on Project Edit Session and Project Edit Brief success and failure envelopes.
- Durable Supabase access remains disabled until explicit Data API grants and authenticated-role RLS policies are both proven.

## Route Contracts

| Route family | Path | Required access chain |
| --- | --- | --- |
| Project Home | `/projects/:projectId` | `projectId -> projects.workspace_id -> workspace_members.user_id -> auth.uid()` |
| Project Edit Session | `/projects/:projectId/edits/:editSessionId/chat` | `editSessionId -> edit_sessions.project_id -> projects.workspace_id -> workspace_members.user_id -> auth.uid()` |
| Project Edit Brief | `/projects/:projectId/edits/:editSessionId/brief` | `editSessionId -> edit_sessions.project_id -> projects.workspace_id -> workspace_members.user_id -> auth.uid()` |

The Project Edit Brief route may later read route data tables such as `edit_briefs`, `edit_cues`, cue child tables, application logs, and `edit_session_export_settings`, but those data grants must be added only after a separate RLS/schema review proves the route data rows inherit the same project/session access chain.

## Required Data API Grants

- `schema_usage_granted_to_authenticated`
- `select_granted_to_authenticated_for_profiles_workspaces_workspace_members_projects_edit_sessions`
- `route_data_table_select_grants_graduated_only_after_rls_policy_review`
- `no_mutation_grants_until_write_route_contracts_are_separately_approved`

## RLS Policy Intent

- `profiles`: authenticated user reads only their own profile row.
- `workspaces`: authenticated user reads workspaces only through `workspace_members`.
- `workspace_members`: authenticated user reads only their own membership rows.
- `projects`: authenticated user reads projects only when a matching workspace membership exists.
- `edit_sessions`: authenticated user reads edit sessions only through project workspace membership.

## Service-Role Boundary

- Browser and frontend-safe API helpers must never receive service-role credentials.
- Trusted backend code may use service role only after a separate schema/RLS/backend implementation gate.
- Route authorization should prefer authenticated-role RLS and explicit Data API grants before any service-role fallback is considered.

## Audit And Rate-Limit Requirements

- Every route access decision records `requestId` and `idempotencyKey`.
- Project/session id mismatches fail closed before route data is returned.
- A rate-limit envelope is planned before durable read or write routes graduate.
- Access-denied readbacks return safe error details without private table payloads.

## Boundaries

- No Supabase migration, SQL, Data API table read, Data API table write, Storage, signed URL, RLS policy application, grant application, profile/workspace bootstrap write, service-role browser path, service-role server use, worker dispatch, provider/model call, media processing, render/export, credit spend, external beta, paid production, or product-ready unlock.

## Validation

- `npm run smoke:internal-testing-durable-project-session-supabase-route-contract-plan`
- `npm run smoke:internal-testing-durable-project-session-backend-readback-qa`
- `npm run smoke:internal-testing-durable-project-session-backend-route-integration`
- `npm run smoke:internal-testing-mock-safe-durable-project-session-backend-skeleton`
- `npm run smoke:internal-testing-durable-auth-project-session-backend-persistence-plan`
- `npm run smoke:internal-testing-auth-project-session-membership-policy`
- `npm run smoke:internal-testing-qa-wrapper`
- `npm run smoke:project-edit-brief-internal-testing-entrypoint`
- `npm run qa:internal-testing`
- `npm run typecheck:server`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`

## Next Gate

`INTERNAL_TESTING_DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT`
