# Internal Testing Durable Project Session Supabase Local Migration Dry-Run Plan

## Decision

`internal_testing_durable_project_session_supabase_local_migration_dry_run_plan_passed_ready_for_local_migration_dry_run_execution`

## Summary

This milestone converts the accepted migration review into an explicit future local dry-run plan. It does not run Supabase, start Docker, apply SQL, reset a database, generate types, implement table-backed routes, or touch a remote Supabase project.

The next execution lane may dry-run `database/migration-drafts/024_internal_testing_durable_project_session_access.draft.sql` only against an isolated local Supabase target after explicit approval.

## Future Local Dry-Run Flow

The future execution lane should:

1. Confirm local Supabase CLI availability and a clean checkout.
2. Create `/tmp/reeditpro-internal-testing-durable-project-session-supabase-local-migration-dry-run/<runId>` outside the repository.
3. Copy the reviewed draft SQL into a temporary local-only migration path under that temp root.
4. Run `supabase start` and `supabase db reset --local` only in the isolated temp target.
5. Run synthetic fixture RLS checks through local `psql`.
6. Stop local Supabase with no backup and remove the temp root before commit or PR handoff.

## Fixture Assertions

The future local execution should prove:

- Member users can select project, edit session, brief, cue, and export-setting rows.
- Non-member users cannot select those rows.
- Anonymous users cannot select those rows.
- Authenticated users cannot insert, update, or delete project/session rows through this draft.
- Service-role access is not used from browser or fixture code.
- Private media, Storage objects, public artifacts, and signed URLs are not created.

## Boundaries

- No Supabase command is run in this planning milestone.
- No executable migration is committed.
- No `supabase/migrations` file is added.
- No local Supabase reset, remote validation, generated types, table-backed routes, Storage, or signed URL path is enabled.
- No service-role browser path, worker, tool, media, render, credit, external beta, production, or product-ready unlock is enabled.

## Production Blockers

Production remains blocked because full MVP schema review, approved plan snapshots, worker tables, credit ledger/audit tables, Storage policies, remote validation, generated types, and table-backed route implementation are all still outside this scoped dry-run plan.

## Validation

- `npm run smoke:internal-testing-durable-project-session-supabase-local-migration-dry-run-plan`
- `npm run smoke:internal-testing-durable-project-session-supabase-migration-review`
- `npm run smoke:internal-testing-durable-project-session-supabase-migration-sql-draft`
- `npm run smoke:internal-testing-durable-project-session-supabase-schema-rls-draft`
- `npm run smoke:internal-testing-durable-project-session-supabase-route-contract-plan`
- `npm run smoke:internal-testing-qa-wrapper`
- `npm run smoke:project-edit-brief-internal-testing-entrypoint`
- `npm run qa:internal-testing`
- `npm run typecheck:server`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`

## Next Gate

`INTERNAL_TESTING_DURABLE_PROJECT_SESSION_SUPABASE_LOCAL_MIGRATION_DRY_RUN_EXECUTION`
