# Internal Testing Durable Project Session Supabase Migration SQL Draft

## Decision

`internal_testing_durable_project_session_supabase_migration_sql_draft_passed_ready_for_migration_review`

## Summary

This milestone turns the Schema/RLS draft into a reviewable SQL draft for durable Project Home, Project Edit Session, and Project Edit Brief access. The draft file lives under `database/migration-drafts/024_internal_testing_durable_project_session_access.draft.sql`, not under `supabase/migrations`, so it remains review material rather than executable Supabase migration history.

No SQL is applied. No local Supabase reset, remote database validation, generated type build, table-backed route implementation, storage policy change, or live Data API read/write is enabled.

## Draft SQL Scope

The draft covers:

- Core tables: `profiles`, `workspaces`, `workspace_members`, `projects`, and `edit_sessions`.
- Route data tables: `edit_briefs`, `edit_cues`, and `edit_session_export_settings`.
- Membership lookup indexes for workspace, project, edit-session, brief, cue, and export-setting reads.
- Core authenticated-role select grants for `profiles`, `workspaces`, `workspace_members`, `projects`, and `edit_sessions`.
- Authenticated-role RLS policies using the `workspace_members` and `auth.uid()` access chain.

Route data table select grants remain commented out until migration review verifies policy inheritance for every Project Edit Brief route data table.

## Grant And RLS Policy

Core select grants are draft-only and restricted to the tables needed for project/session access review. Mutation grants remain absent. Anonymous access remains denied by the absence of grants and by RLS.

The RLS predicates preserve the same chain from the route contract:

`editSessionId -> edit_sessions.project_id -> projects.workspace_id -> workspace_members.user_id -> auth.uid()`

## Review Checks

- Draft file lives under `database/migration-drafts/`, not `supabase/migrations/`.
- Core select grants only; route data select grants are review-only comments.
- Authenticated-role RLS uses the workspace membership chain.
- Anonymous access remains denied.
- Mutation grants are absent.
- No local Supabase reset or remote database apply occurred.
- No generated types or table-backed routes were added.
- A migration review is required before any real Supabase CLI migration.

## Boundaries

- Draft SQL is written as review metadata only.
- No executable migration is created.
- No migration is applied.
- No Supabase Data API read/write, Storage, signed URL, grant application, RLS policy application, local reset, remote validation, generated types, or table-backed route implementation.
- No service-role browser path, worker, tool, media, render, credit, external beta, production, or product-ready unlock.

## Validation

- `npm run smoke:internal-testing-durable-project-session-supabase-migration-sql-draft`
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

`INTERNAL_TESTING_DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW`
