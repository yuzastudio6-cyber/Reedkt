# Prompt 03 Auth/Profile/Workspace/RLS Production Path

## Status

Prompt-complete but foundation incomplete.

## Branch

`codex/rp-foundation-03-auth-profile-workspace-rls-production-path`

## Base

Prompt 2A branch `codex/rp-foundation-02a-schema-gap-fix-plan` because PR #72 was open when Prompt 3 started.

## Implemented

- Added Prompt 3 reconciliation migration for `profiles`, `workspaces`, `workspace_members`, and `projects`.
- Kept `auth.users` as Supabase-owned identity source.
- Added RLS helper functions with safe `search_path` and explicit `auth.uid()` null checks.
- Added trigger guards for profile identity, workspace owner, membership privilege escalation, ownerless workspaces, and project scope changes.
- Added local SQL/RLS smoke test coverage.
- Added Prompt 3 schema guard and smoke scripts.
- Updated handwritten database contract types for the four Prompt 3 tables and helpers.
- Removed deprecated `userProfiles` and `workspaceMemberships` aliases from local table-name exports.
- Updated foundation docs, policy matrix, audit, validation runbook, and deployment blockers.

## Not Implemented

- No remote Supabase migration.
- No production SQL execution.
- No service-role handler.
- No service-role secrets.
- No provider calls.
- No rendering, exports, workers, tools, Stripe, public buckets, public artifacts, or broad backend services.
- No internal beta or external beta unlock.

## Validation

Prompt 3 validation is recorded in the PR and final response. Local Supabase validation must be treated as skipped/blocked unless the PR validation section explicitly says it ran against disposable local Supabase.

## Next Prompt

If Prompt 3 validation passes, the next foundation prompt should reconcile local/staging migration application and generated database/API contract validation before broader backend services.
