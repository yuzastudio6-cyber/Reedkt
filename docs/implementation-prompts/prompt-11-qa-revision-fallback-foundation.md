# Prompt 11 - QA, Revision, And Fallback Foundation

## Context

Prompt 10 added limited render/preview/export route-service boundaries. Prompt 10A fixed diagnostics and CI classification. Prompt 11 adds the bounded QA/revision/fallback foundation that future preview review, regeneration, final export blocking, repair planning, and worker systems will depend on.

## Allowed Scope

- QA readiness checks.
- QA report/readiness boundaries.
- QA blocker reporting and resolve-boundary validation.
- Preview review and review comment boundaries.
- Revision request, revision estimate-readiness, and revision approval-required boundaries.
- Fallback readiness, fallback decision planning boundary, repair plan readiness, and export blocker summaries.
- Route metadata, diagnostics, docs, and draft local SQL/RLS test plan.

## Forbidden Scope

- No QA worker execution.
- No real media inspection or user-media processing.
- No provider calls.
- No real render/export execution.
- No tool execution.
- No worker execution or real job creation.
- No credit mutation beyond existing Prompt 6 fail-closed boundaries.
- No storage upload/download execution beyond Prompt 4 boundaries.
- No approved snapshot mutation beyond Prompt 5 boundaries.
- No planning generation, regeneration, repair execution, Stripe, deployment, remote Supabase, or schema-changing migrations.

## Canonical Concepts

Use `projects`, `workspace_members`, `approved_plan_snapshots`, `credit_estimates`, `credit_reservations`, `media_assets`, `storage_object_records`, `render_jobs`, `renders`, `render_events`, `final_exports`, `qa_reports`, `qa_check_results`, `preview_reviews`, `review_comments`, `revision_requests`, `approval_records`, jobs/worker records as blockers only, and sanitized `audit_events` if needed.

## Deliverables

- `server/validation/qa-revision-schemas.ts`
- `server/services/qa-revision-service.ts`
- `server/routes/qa-revision-routes.ts`
- `src/backend/api/routes/qa-revision-api-routes.ts`
- `docs/qa-revision-fallback-foundation.md`
- `docs/qa-revision-fallback-route-contract.md`
- `docs/qa-revision-fallback-gate-contract.md`
- `docs/prompt-11-validation-results.md`
- `database/test-sql/013_qa_revision_fallback_rls_smoke_tests.draft.sql`
- `scripts/validation/qa-revision-scope-diagnostics.mjs`
- Source-of-truth/tracker updates.

## Validation Checklist

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-10a-render-preview-export-validation-hardening...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run --silent schema:static-audit`
- `npm run --silent auth:rls:diagnostics`
- `npm run --silent storage:scope:diagnostics`
- `npm run --silent snapshot:scope:diagnostics`
- `npm run --silent credit:scope:diagnostics`
- `npm run --silent backend:api:diagnostics`
- `npm run --silent job:worker:diagnostics`
- `npm run --silent media:readiness:diagnostics`
- `npm run --silent render:export:diagnostics`
- `npm run --silent qa:revision:diagnostics`
- `npm run foundation:validate`
- `npm run foundation:validate:with-build`

If local Node remains blocked by `Bad CPU type in executable`, record it and rely on GitHub Foundation Validation. Keep SQL/RLS draft-only unless local Supabase is repaired.

## GitHub Requirement

Create branch `codex/rp-foundation-11-qa-revision-fallback-foundation`, push it, and open PR `[foundation] Prompt 11 QA revision fallback foundation` against `codex/rp-foundation-10a-render-preview-export-validation-hardening`. Do not merge the PR. After PR creation, update this tracker with the PR link.

## Acceptance Criteria

- QA/revision/fallback route contracts exist.
- QA/revision/fallback gate contract exists.
- Service fails closed when runtime is unavailable.
- Diagnostics exist and pass.
- SQL/RLS draft test exists and is honestly marked unexecuted unless local validation actually runs.
- No real QA/revision/fallback or downstream provider/render/tool/job/media/storage/credit execution is enabled.
