# Prompt 3A Auth RLS Fix Results

Prompt 3A reviews and hardens the Prompt 3 auth/profile/workspace/project foundation before any Prompt 4 storage/upload work begins. It does not expand production scope.

PR: [#76](https://github.com/yuzastudio6-cyber/Reedkt/pull/76)

## Files Inspected

- `PRODUCTION_FOUNDATION_STATUS.md`
- `docs/source-of-truth-map.md`
- `docs/production-milestone-plan.md`
- `docs/schema-gap-fix-plan.md`
- `docs/canonical-schema-contract.md`
- `docs/prompt-03-schema-target-guardrails.md`
- `docs/auth-profile-workspace-production-path.md`
- `docs/auth-profile-workspace-rls-test-plan.md`
- `docs/auth-profile-workspace-route-contract.md`
- `docs/prompt-03-validation-results.md`
- `database/test-sql/006_auth_workspace_rls_smoke_tests.draft.sql`
- `server/app.ts`
- `server/routes/auth-routes.ts`
- `server/routes/project-routes.ts`
- `server/services/auth-service.ts`
- `server/services/project-service.ts`
- `server/validation/auth-workspace-schemas.ts`
- `src/backend/api/routes/auth-bootstrap-api-routes.ts`
- `src/backend/api/routes/project-api-routes.ts`
- active Supabase migrations touching `profiles`, `workspaces`, `workspace_members`, and `projects`

## Code Changes Made

- Removed request-body validation from the disabled broad project-create route so it cannot appear implementation-ready.
- Kept `POST /v1/projects` fail-closed with a `VALIDATION_FAILED` error.
- Validated `workspaceId` and `projectId` route inputs as UUIDs for Prompt 3A access checks.
- Returned explicit `status` and `hasAccess` values from `GET /v1/projects/:projectId`.
- Removed method-`this` coupling inside auth/project services.
- Added concise server-only boundary comments around service-role-limited behavior.

## Blocked Table Scan Result

Prompt 3A scanned the new auth/project route, service, and validation files for blocked table groups. No blocked table references were found in those server files.

## Auth/Workspace Route Hardening Result

- Authenticated routes still require `requireAuth`.
- Admin/runtime unavailable paths still return `backend_required` style results without exposing private data.
- Profile writes remain limited to safe fields.
- Workspace bootstrap remains limited to `workspaces` and owner `workspace_members`.
- Project access remains based on `projects.workspace_id` plus `workspace_members`.
- Broad project creation remains blocked.

## Build Result

`npm ci` was run for local validation from the existing lockfile. It completed successfully, installed 315 packages, and reported 5 moderate npm audit findings. No `npm audit fix` was run and no dependency files were changed.

`npm run typecheck:server` passed.

`npm run build` was run. The TypeScript phase completed far enough for Vite to start, but the full build failed when Vite/Rolldown attempted to load the native Darwin binding:

```text
Error: Cannot find native binding.
ERR_DLOPEN_FAILED ... @rolldown/binding-darwin-arm64 ... code signature ... not valid for use in process: mapping process and mapped file (non-platform) have different Team IDs
```

The build blocker appears environment/native-binding related, not a Prompt 3A TypeScript error.

## Lint Result

`npm run lint` passed after Prompt 3A removed an unused disabled-route response parameter.

## Static Audit Result

Static audit was run with:

```text
node scripts/validation/supabase-schema-static-audit.mjs
```

It passed as local file inspection only. The audit script reported:

- connects to Supabase: `false`
- reads environment secrets: `false`
- executes SQL: `false`
- uses Node built-ins only: `true`
- active migration files scanned: 21
- draft migration files scanned: 8
- test SQL files scanned: 6

## RLS SQL Status

`database/test-sql/006_auth_workspace_rls_smoke_tests.draft.sql` remains draft-only.

Reason: the test still needs disposable local fixture IDs and schema-era cleanup before it should be treated as executable SQL. Prompt 3A does not add a migration, does not run SQL, and does not convert the file to `.sql`.

## Local Supabase Status

Local Supabase SQL/RLS validation was not run because the RLS file remains draft-only. A non-mutating CLI availability check also failed in this environment:

```text
zsh:1: bad CPU type in executable: supabase
```

## Remote/Staging Supabase Status

Remote and staging Supabase were intentionally not used.

## Remaining Blockers

- RLS SQL remains draft-only and unexecuted.
- Local/staging Supabase validation remains required before production use.
- Full `npm run build` remains blocked by the Vite/Rolldown native binding code-signature issue.
- Supabase CLI is not usable in this environment due `bad CPU type in executable`.
- Broader backend paths remain blocked.

## Prompt 4 Decision

Prompt 4 should wait. Recommended next prompt: Prompt 3B - Auth/RLS Validation Environment Fix.
