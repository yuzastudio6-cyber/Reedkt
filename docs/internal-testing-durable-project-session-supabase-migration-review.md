# Internal Testing Durable Project Session Supabase Migration Review

## Decision

`internal_testing_durable_project_session_supabase_migration_review_passed_ready_for_local_migration_dry_run_plan`

## Summary

This milestone reviews and hardens the review-only SQL draft for durable Project Home, Project Edit Session, and Project Edit Brief access. The SQL remains under `database/migration-drafts/024_internal_testing_durable_project_session_access.draft.sql`; it is still not copied into `supabase/migrations` and is not applied to any database.

The review accepts the scoped internal-testing draft for a later local migration dry-run plan. It does not approve production migration, remote Supabase validation, generated types, table-backed routes, storage policies, or product-ready durable access.

## Accepted Findings

- The draft file remains in `database/migration-drafts/`, not `supabase/migrations/`.
- `profiles`, `workspaces`, `workspace_members`, `projects`, and `edit_sessions` preserve the `workspace_members` and `auth.uid()` access chain.
- Route-data tables `edit_briefs`, `edit_cues`, and `edit_session_export_settings` now have review-only select grants plus project/session membership RLS policies in the draft.
- Mutation grants are absent.
- The draft has no destructive SQL, role mutation, service-role grant, provider secret storage, Storage operation, or runtime route implementation.

## Production Blockers

This scoped internal-testing review is not a full production migration review. Production remains blocked because:

- Full MVP schema review is still required before production migration.
- `approved_plan_snapshots`, worker tables, credit ledger tables, and append-only audit tables are out of scope for this project/session draft.
- Storage bucket policies remain unapplied and unvalidated.
- Remote Supabase validation has not run.
- Generated types have not been created.
- Table-backed routes are not implemented.

## Local Dry-Run Requirements

The next approved lane should plan, but not automatically run, a local migration dry-run that:

- Uses an ephemeral local Supabase project or reset target only after explicit approval.
- Applies only `database/migration-drafts/024_internal_testing_durable_project_session_access.draft.sql` as the scoped dry-run target.
- Seeds member and non-member fixture users without private media.
- Verifies member project/session/brief/cue/export select access.
- Verifies non-member and anonymous select denial.
- Verifies authenticated mutation attempts are denied.
- Removes local generated outputs and does not commit generated types or database state.

## Boundaries

- No executable migration is created.
- No migration is applied.
- No local Supabase reset or remote validation runs.
- No generated types or table-backed routes are added.
- No Supabase Data API read/write, Storage, signed URL, service-role browser path, worker, tool, media, render, credit, external beta, production, or product-ready unlock.

## Validation

- `npm run smoke:internal-testing-durable-project-session-supabase-migration-review`
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

`INTERNAL_TESTING_DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_PLAN`
