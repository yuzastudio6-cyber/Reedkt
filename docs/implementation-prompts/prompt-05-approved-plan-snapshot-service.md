# Prompt 5 - Approved Plan Snapshot Service

## Small Context

Prompt 0 consolidated production source of truth. Prompt 1 froze production boundaries. Prompt 2 reviewed Supabase schema. Prompt 2A chose canonical schema targets. Prompt 3/3A/3B/3C created and validated the narrow auth/workspace foundation. Prompt 4 added a limited storage/upload route/service foundation. Prompt 5 adds the approved plan snapshot service boundary that future workers must use.

## Scope

Implement a limited backend-required approved snapshot route/service foundation:

- snapshot readiness checks
- approved snapshot creation boundary
- approved snapshot read/list metadata
- snapshot integrity verification
- blocker reporting
- request validation
- route metadata
- docs, diagnostics, and draft RLS test plan

## Canonical Tables

- `approval_records`
- `approved_plan_snapshots`
- `edit_plan_versions`
- `credit_estimates`
- `credit_reservations`
- `projects`
- `workspaces`
- `workspace_members`

`credit_approvals` is legacy/compatibility-only and must not be targeted as the canonical approval gate.

## Non-Goals

- no provider calls
- no rendering
- no Stripe
- no migration deployment
- no remote Supabase migration or SQL execution
- no worker execution
- no job creation/execution
- no credit reserve/spend/refund mutation
- no storage upload/download execution
- no media analysis
- no planning generation
- no tool execution
- no broad service-role handler
- no schema-changing migration
- no package installation beyond `npm ci`

## Deliverables

- `docs/approved-plan-snapshot-service.md`
- `docs/approved-plan-snapshot-contract.md`
- `docs/approved-snapshot-route-contract.md`
- `docs/prompt-05-validation-results.md`
- `docs/implementation-prompts/prompt-05-approved-plan-snapshot-service.md`
- `database/test-sql/008_approved_snapshot_rls_smoke_tests.draft.sql`
- `scripts/validation/approved-snapshot-scope-diagnostics.mjs`
- approved snapshot route/service/schema hardening
- API route metadata and registry update
- source-of-truth tracking updates

## Validation Checklist

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-04-storage-upload-production-runtime...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run --silent schema:static-audit`
- `npm run --silent auth:rls:diagnostics`
- `npm run --silent storage:scope:diagnostics`
- `npm run --silent snapshot:scope:diagnostics`
- `npm run foundation:validate`
- `npm run foundation:validate:with-build`

SQL/RLS remains draft-only unless local Supabase is repaired. Remote/staging Supabase must not be used.

## GitHub Requirement

- Branch from `origin/codex/rp-foundation-04-storage-upload-production-runtime`.
- Use branch `codex/rp-foundation-05-approved-plan-snapshot-service`.
- Commit changes with clear messages.
- Push the branch.
- Open PR titled `[foundation] Prompt 5 approved plan snapshot service` against `codex/rp-foundation-04-storage-upload-production-runtime`.
- After PR creation, update the implementation prompt tracker with the PR link in a follow-up commit.

## Acceptance Criteria

- Approved snapshot readiness gates are explicit.
- Creation fails closed when backend runtime is unavailable.
- Snapshot JSON rejects secrets, signed URLs, provider keys, service-role data, and raw chat execution source.
- Snapshot hash/integrity contract exists.
- Canonical schema targets follow Prompt 2A.
- `credit_approvals` and `edit_plans` are not canonical gate targets.
- Draft RLS test plan exists.
- Diagnostics exist and run without Supabase connections.
- Validation results are honestly recorded.
- Exact production capability enabled: limited approved snapshot route/service foundation only.
