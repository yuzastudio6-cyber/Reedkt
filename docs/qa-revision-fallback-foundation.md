# QA, Revision, And Fallback Foundation

Prompt 11 adds the bounded backend API foundation for QA readiness, preview review, revision request, fallback decision, repair planning, and export blocker summaries. It is a route/service foundation only. It does not execute QA workers, inspect media, regenerate assets, call providers, render/export media, execute tools, mutate credits, create real jobs, deploy, run migrations, or use remote Supabase.

## Current Implementation Found

- Prompt 10 render readiness already references `qa_reports` and `qa_check_results` as final export blockers.
- Existing planning docs describe edit QA, agent QA gates, failure/fallback decisions, and user recovery policy.
- SFX/music QA services are mock/frontend planning helpers and remain outside this production backend boundary.
- No dedicated `/v1` QA/revision/fallback route family existed before Prompt 11.

## Canonical Concepts

Prompt 11 uses these concepts as canonical references or future write targets:

- Access context: `projects`, `workspace_members`.
- Source references: `approved_plan_snapshots`, `credit_estimates`, `credit_reservations`, `media_assets`, `storage_object_records`, `render_jobs`, `renders`, `render_events`, `final_exports`, `approval_records`.
- QA/review/revision concepts: `qa_reports`, `qa_check_results`, `preview_reviews`, `review_comments`, `revision_requests`.
- Readiness-only references: `jobs`, worker claim/lease records, sanitized `audit_events`.

Prompt 11 avoids using mock SFX/music QA tables, StoryTiming execution tables, provider/generation tables, render/export execution writes, storage transfer records, credit ledger mutations, and schema-era legacy concepts as production write targets.

## Layer Boundaries

- Frontend may request QA readiness, preview review, revision, fallback, repair-plan, and export-blocker summaries through backend API routes.
- Backend API validates auth, workspace/project scope, safe metadata, idempotency on mutation-style routes, and returns fail-closed readiness results.
- Supabase remains the future source of truth for QA/revision/fallback records, but Prompt 11 only performs guarded read-only summaries when service-role runtime is available.
- Workers remain future-only. QA, revision, fallback, repair, media analysis, render, provider, and tool execution are not started.

## Lifecycle Boundaries

1. Approved snapshot, render/preview, media readiness, and credit reservation records exist as source references.
2. QA readiness checks whether records and future QA runtime are available.
3. QA report creation validates payload shape and idempotency, then returns `backend_required` until transactional writes and QA workers exist.
4. Preview review and review comment boundaries validate user review payloads without writing records.
5. Revision request boundaries validate requested changes and flags for new generation, render, estimate, or approval without starting work.
6. Fallback decision and repair-plan boundaries prepare safe summaries only.
7. Export blocker checks report blocking QA/revision state; final export remains blocked when QA blockers exist.

## Fail-Closed Behavior

The service returns `backend_required` when project access, service-role runtime, QA/revision persistence, QA workers, repair workers, render/export execution, provider/tool execution, or credit mutation are unavailable. Mutation-style routes require idempotency and still fail closed after validation.

## Validation

Prompt 11 adds `qa:revision:diagnostics` and includes it in `foundation:validate`. Draft SQL/RLS coverage is added in `database/test-sql/013_qa_revision_fallback_rls_smoke_tests.draft.sql` but remains unexecuted until local/staging Supabase validation is repaired and explicitly approved.

## Remaining Blockers

- No remote Supabase validation.
- No local SQL/RLS execution.
- No transactional QA/revision/fallback write runtime.
- No QA, revision, fallback, repair, worker, provider, render, tool, media, storage, or credit execution.
- No production audit event writes.
