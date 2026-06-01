# Prompt 10 - Render, Preview, And Export Foundation

## Small Context

Prompt 10 follows Prompt 9 media readiness and creates the bounded render/preview/export foundation that future Remotion, FFmpeg, QA, and export workers will depend on.

## Allowed Scope

- Render readiness checks
- Preview readiness/request boundary
- Export readiness/request boundary
- Render manifest DTO validation and build boundary
- Render/export status summaries
- QA dependency blocker references
- Route metadata/contracts
- Static diagnostics
- Draft SQL/RLS test plan

## Forbidden Scope

- Real Remotion execution
- Real FFmpeg execution
- Real render/export job execution
- Worker claim/execution
- Provider calls
- Tool execution
- Media analysis or user-media processing
- Credit mutation beyond Prompt 6 fail-closed boundaries
- Storage upload/download/write execution beyond Prompt 4 boundaries
- Planning generation
- Approved snapshot mutation beyond Prompt 5 boundaries
- Stripe/payment processing
- Production migrations
- Remote/staging Supabase execution
- Deployment
- Broad service-role handler

## Canonical Concepts/Tables

Use `projects`, `workspace_members`, `approved_plan_snapshots`, `credit_estimates`, `credit_reservations`, `media_assets`, `storage_object_records`, `master_timing_maps`, `render_jobs`, `render_job_inputs`, `renders`, `render_events`, `final_exports`, `qa_reports`, `qa_check_results`, and sanitized `audit_events` references where needed.

Do not target `exports`, `export_variants`, `preview_reviews`, `review_comments`, `qa_report_items`, provider attempt tables, tool runtime tables, StoryTiming execution tables, or draft-only tables as Prompt 10 production write targets.

## Deliverables

- `docs/render-preview-export-foundation.md`
- `docs/render-preview-export-route-contract.md`
- `docs/render-readiness-gate-contract.md`
- `docs/prompt-10-validation-results.md`
- `database/test-sql/012_render_preview_export_rls_smoke_tests.draft.sql`
- `scripts/validation/render-export-scope-diagnostics.mjs`
- Hardened `server/services/render-service.ts`
- Hardened `server/routes/render-routes.ts`
- Hardened `server/validation/render-schemas.ts`
- Updated `src/backend/api/routes/render-api-routes.ts`
- Updated foundation validation runner, CI workflow, status map, milestone plan, and implementation tracker

## Validation Checklist

- Run `git diff --check`.
- Run `git diff --check origin/codex/rp-foundation-09-media-readiness-probe-transcript-timing...HEAD`.
- Run `npm ci`.
- Run `npm run lint`.
- Run `npm run typecheck:server`.
- Run `npm run --silent schema:static-audit`.
- Run `npm run --silent auth:rls:diagnostics`.
- Run `npm run --silent storage:scope:diagnostics`.
- Run `npm run --silent snapshot:scope:diagnostics`.
- Run `npm run --silent credit:scope:diagnostics`.
- Run `npm run --silent backend:api:diagnostics`.
- Run `npm run --silent job:worker:diagnostics`.
- Run `npm run --silent media:readiness:diagnostics`.
- Run `npm run --silent render:export:diagnostics`.
- Run `npm run foundation:validate`.
- Run `npm run foundation:validate:with-build`, or classify local full build as environment-blocked and rely on Linux CI.
- Do not run remote/staging Supabase.
- Keep SQL/RLS tests draft-only unless local Supabase is repaired.

## GitHub Requirement

- Branch: `codex/rp-foundation-10-render-preview-export-foundation`
- PR base: `codex/rp-foundation-09-media-readiness-probe-transcript-timing`
- PR title: `[foundation] Prompt 10 render preview export foundation`
- Do not merge the PR.
- After PR creation, update `docs/implementation-prompts/README.md` with the PR link in a follow-up commit.

## Acceptance Criteria

- Render/preview/export lifecycle is documented and implemented as limited route/service boundaries.
- Render readiness gate contract exists.
- Render service fails closed when worker/render/export runtime is unavailable.
- Render manifest boundary validates DTOs without executing Remotion.
- Preview/export request routes require idempotency.
- Diagnostics exist and are included in foundation validation.
- SQL/RLS draft test exists and is honestly marked draft-only.
- No real rendering/export, provider, tool, worker, media, storage, credit, planning, snapshot mutation, Stripe, migration, remote Supabase, or deployment capability is enabled.
