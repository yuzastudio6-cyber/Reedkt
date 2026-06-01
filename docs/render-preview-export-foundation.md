# Render, Preview, And Export Foundation

Prompt 10 adds the limited render/preview/export route and service foundation for ReeditPro. It defines the backend-safe boundary that future Remotion, FFmpeg, QA, and export workers must use, but it does not render media, export media, create real render jobs, write storage artifacts, claim workers, call providers, execute tools, mutate credits, or deploy anything.

## Current Implementation Found

- `server/routes/render-routes.ts` previously exposed Prompt 7-era blocked stubs for render jobs, render reads, preview review, and basic smoke preview.
- `server/services/render-service.ts` previously had production-looking behavior that could insert `render_jobs` when an admin client existed and return mock queued render success when it did not.
- `src/backend/api/routes/render-api-routes.ts` previously marked several render routes as mock-ready metadata.
- Local render smoke and Remotion worker helper files remain in the repo as non-production candidates, but Prompt 10 route/service paths do not call them.

## Canonical Concepts

Prompt 10 uses these concepts as guarded readiness references:

| Concept | Canonical target | Prompt 10 behavior |
| --- | --- | --- |
| Project access | `projects`, `workspace_members` | Read/check through Prompt 3 project access service. |
| Approved snapshot | `approved_plan_snapshots` | Required reference for render/export readiness. |
| Credit gate | `credit_estimates`, `credit_reservations` | Required read-only gate references when credits apply. |
| Source media/storage | `media_assets`, `storage_object_records` | Readiness references only; no media processing or storage execution. |
| Timing | `master_timing_maps` or approved timing manifest reference | Readiness reference only; missing timing remains backend-required. |
| Render records | `render_jobs`, `render_job_inputs`, `renders`, `render_events` | Read-only/status references or intended payload summaries. No writes. |
| Export records | `final_exports` | Read-only/status references or intended payload summaries. No writes. |
| QA blockers | `qa_reports`, `qa_check_results` | Readiness/blocker references only. No QA execution. |

`exports`, `export_variants`, `preview_reviews`, `review_comments`, and duplicate QA-era tables remain compatibility/future-cleanup concepts and are not primary production targets in Prompt 10.

## Layer Responsibilities

| Layer | Responsibility |
| --- | --- |
| Frontend | Request readiness, show blockers, request preview/export only through backend routes after approval gates. |
| Backend API | Validate auth, project access, idempotency, safe metadata, canonical record references, and fail-closed runtime readiness. |
| Supabase | Source of truth for approved snapshots, credit reservations, media/storage records, render/export records, QA blockers, and audit/event history. |
| Worker/runtime | Future Remotion/FFmpeg/render/export execution only after approved snapshot, credit reservation, worker claim, and QA gates. |
| Storage | Future private preview/export artifact storage. Prompt 10 does not create signed URLs or write artifacts. |

## Lifecycle Boundaries

1. Render readiness checks project access, approved snapshot, credit reservation, source media/storage, timing, and QA blockers.
2. Manifest readiness validates the render manifest DTO shape and required source records.
3. Manifest build validates an idempotent request boundary and returns `backend_required` instead of persisting or rendering.
4. Preview request validates an idempotent request boundary and returns `backend_required` instead of creating a render job.
5. Export readiness checks final export blockers, including render reference and QA state.
6. Export request validates an idempotent request boundary and returns `backend_required` instead of running FFmpeg or writing storage.
7. Render/export read and list routes expose sanitized status summaries only when backend runtime can read records.

## Result Shape

Render foundation routes return a `RenderFoundationResult` with:

- `status`: `ready`, `blocked`, `backend_required`, or `mock_only`
- `canBuildManifest`, `canRequestPreview`, `canRequestExport`, `canRender`, `canExport`
- `blockers`, `warnings`, `requiredRecords`, `nextAction`
- Optional summaries for approved snapshot, credit, media readiness, storage, timing, QA, render manifest, render job, render, render events, export, idempotency, and sanitized audit preview

Readiness may validate records, but `canRender` and `canExport` remain false because Prompt 10 does not enable execution runtime.

## Fail-Closed Behavior

Prompt 10 returns blockers when any of these are missing:

- Auth/project access
- Approved snapshot
- Active credit reservation when credits apply
- Media/storage context
- Timing manifest or approved timing reference
- QA blocker verification
- Render worker runtime
- Remotion runtime
- FFmpeg/export runtime

Request-style routes require idempotency and return `backend_required` until a future reviewed transactional backend and worker runtime exists.

## Validation

Validation is recorded in `docs/prompt-10-validation-results.md`. The SQL/RLS plan is draft-only at `database/test-sql/012_render_preview_export_rls_smoke_tests.draft.sql` because local Supabase validation remains environment-dependent.

## Still Blocked

- Real Remotion execution
- Real FFmpeg execution
- Render/export job creation
- Worker claim/execution
- Provider calls
- Tool execution
- Media analysis or user-media processing
- Credit reserve/spend/refund mutation
- Preview/export artifact storage writes
- Signed URL generation
- Local/staging/remote RLS validation
- Production deployment
