# Internal Testing Durable Project Session Supabase Schema/RLS Draft

## Decision

`internal_testing_durable_project_session_supabase_schema_rls_draft_passed_ready_for_migration_sql_draft`

## Summary

This milestone turns the route-contract plan into a schema/RLS draft for later migration work. It records the required core tables, route data inheritance rules, Data API grant intent, authenticated-role RLS intent, and verification checks needed before Project Home, Project Edit Session, or Project Edit Brief can use table-backed Supabase access.

This is a draft only. It does not write SQL, add a migration, apply RLS, apply grants, run local Supabase reset, validate a remote project, generate types, implement table-backed route handlers, or enable live Supabase reads/writes.

## Core Table Draft

| Table | Required columns | Purpose |
| --- | --- | --- |
| `profiles` | `id` | Server-verified user identity anchor. |
| `workspaces` | `id` | Workspace scope anchor. |
| `workspace_members` | `workspace_id`, `user_id`, `role` | Workspace membership proof for project/session access. |
| `projects` | `id`, `workspace_id` | Project-to-workspace ownership chain. |
| `edit_sessions` | `id`, `project_id` | Edit-session-to-project ownership chain. |

Required index intent:

- `workspace_members_user_workspace_lookup` on `user_id` and `workspace_id`.
- `projects_workspace_lookup` on `workspace_id`.
- `edit_sessions_project_lookup` on `project_id`.

## Route Data Table Draft

- `edit_briefs` rows must inherit `project_id` and `edit_session_id` access.
- `edit_cues` rows must inherit `brief_id` and `edit_session_id` access.
- `edit_session_export_settings` rows must inherit `project_id` and `edit_session_id` access.

Select grants for route data tables remain draft-only and must not graduate until a later policy review proves their RLS predicates inherit the same project/session membership chain.

## RLS Intent

- `profiles`: self-read by `auth.uid()`.
- `workspaces`: readable only through `workspace_members`.
- `workspace_members`: readable only by the signed-in member.
- `projects`: readable only through workspace membership.
- `edit_sessions`: readable only through project workspace membership.
- Route data tables inherit edit session and project membership before any select grant graduates.

## Data API Grant Intent

- Schema usage may be planned for the authenticated role.
- Select grants may be planned for `profiles`, `workspaces`, `workspace_members`, `projects`, and `edit_sessions`.
- Route data table select grants remain pending a route data policy review.
- Mutation grants remain absent until write route contracts are separately approved.

## Verification Checks

- Authenticated user can read own profile.
- Authenticated user can read only member workspaces.
- Authenticated user can read only projects in member workspaces.
- Authenticated user can read only edit sessions in member projects.
- Non-member project read is denied.
- Non-member edit-session read is denied.
- Anonymous role is denied.
- Mutation grants are absent for this internal-testing draft.
- Service role is not required for browser or frontend-safe route access.

## Boundaries

- No migration SQL is written.
- No migration is applied.
- No Supabase Data API read/write, SQL, Storage, signed URL, grant application, RLS policy application, local reset, remote validation, generated types, or table-backed route implementation.
- No service-role browser path, worker, tool, media, render, credit, external beta, production, or product-ready unlock.

## Validation

- `npm run smoke:internal-testing-durable-project-session-supabase-schema-rls-draft`
- `npm run smoke:internal-testing-durable-project-session-supabase-route-contract-plan`
- `npm run smoke:internal-testing-durable-project-session-backend-readback-qa`
- `npm run smoke:internal-testing-durable-project-session-backend-route-integration`
- `npm run smoke:internal-testing-mock-safe-durable-project-session-backend-skeleton`
- `npm run smoke:internal-testing-durable-auth-project-session-backend-persistence-plan`
- `npm run smoke:internal-testing-qa-wrapper`
- `npm run smoke:project-edit-brief-internal-testing-entrypoint`
- `npm run qa:internal-testing`
- `npm run typecheck:server`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`

## Next Gate

`INTERNAL_TESTING_DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT`
