# Prompt 4 - Storage/Upload Production Runtime

## Small Context

Prompt 0 consolidated source-of-truth docs. Prompt 1 froze architecture boundaries. Prompt 2 reviewed Supabase schema. Prompt 2A chose canonical schema targets. Prompt 3 added limited auth/profile/workspace/project foundation. Prompt 3A/3B/3C hardened validation and added a foundation validation runner. Prompt 4 begins the next bounded production path: private storage/upload runtime.

## Allowed Scope

- Upload intent creation.
- Upload validation.
- Canonical private storage paths.
- Storage object record boundary.
- Signed upload/download route boundaries.
- Source media upload finalization boundary.
- Workspace/project access checks for storage operations.
- Storage/RLS validation docs and local-only draft tests.
- Storage/upload diagnostics.

## Forbidden Scope

- Media analysis.
- Transcript analysis.
- Edit planning.
- Approved snapshot creation.
- Credit ledger mutation.
- Job execution.
- Worker claims.
- Provider gateway calls.
- Rendering/export execution.
- Tool execution.
- Stripe.
- Production deployment.
- Remote Supabase migration.
- Broad service-role execution.

## Canonical Concepts And Tables

- `upload_intents`
- `storage_object_records`
- `signed_url_events`
- `media_assets` only for source media finalization boundary when canonical
- `uploaded_clips` and `source_sequence_items` only for upload order boundary when canonical
- `projects`
- `workspaces`
- `workspace_members`
- `profiles` only as access context
- `audit_events` only as future sanitized append-only storage/upload audit events

## Required Reading

- `PRODUCTION_FOUNDATION_STATUS.md`
- `docs/source-of-truth-map.md`
- `docs/production-milestone-plan.md`
- `docs/production-architecture-freeze.md`
- `docs/architecture-boundary-matrix.md`
- `docs/execution-gates-contract.md`
- `docs/future-backend-service-map.md`
- `docs/canonical-schema-contract.md`
- `docs/schema-gap-fix-plan.md`
- `docs/prompt-03-schema-target-guardrails.md`
- `docs/prompt-03c-validation-toolchain-results.md`
- `docs/validation-toolchain-repair-runbook.md`
- `docs/prompt-03c-validation-toolchain-results.md`
- `docs/foundation-validation-toolchain.md` if present
- `docs/local-rls-validation-toolchain.md` if present
- `docs/storage-upload-schema-audit.md`
- `docs/storage-upload-pipeline.md`
- `docs/storage-bucket-strategy.md`
- `docs/storage-runtime-boundary.md`
- `supabase/migration-order.md`
- `supabase/README.md`
- `supabase/migrations/`
- `database/test-sql/`
- storage/upload backend route, service, validation, and adapter files

## Deliverables

- `docs/storage-upload-production-runtime.md`
- `docs/storage-upload-route-contract.md`
- `docs/storage-upload-rls-test-plan.md`
- `docs/prompt-04-validation-results.md`
- `database/test-sql/007_storage_upload_rls_smoke_tests.draft.sql`
- `scripts/validation/storage-upload-scope-diagnostics.mjs`
- route/service/schema hardening inside storage/upload scope
- source-of-truth and implementation-prompt tracker updates

## Validation Checklist

- `git diff --check`
- `git diff --check <base>...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run --silent schema:static-audit`
- `npm run --silent auth:rls:diagnostics`
- `npm run --silent storage:scope:diagnostics`
- `npm run foundation:validate`
- `npm run build` or `npm run foundation:validate:with-build`
- Document local build/native-binding blockers honestly if full build is environment-blocked.
- Document SQL/RLS draft status honestly if local Supabase remains unavailable.

## GitHub Requirement

- Branch: `codex/rp-foundation-04-storage-upload-production-runtime`
- Base: `codex/rp-foundation-03c-validation-toolchain-repair`
- PR title: `[foundation] Prompt 4 storage upload production runtime`
- Do not merge the PR.

## Acceptance Criteria

- Storage/upload lifecycle is documented and implemented only within Prompt 4 scope.
- Route contracts exist for storage/upload boundaries.
- Upload validation and path guardrails exist or are hardened.
- Backend-required signed URL behavior fails closed when runtime is unavailable.
- Canonical storage object source-of-truth rule is preserved.
- RLS/storage validation plan exists.
- No blocked domain capability is enabled.
- Validation results are honest.
- Prompt 4 is tracked in implementation prompts.
- Next prompt recommendation is clear.
