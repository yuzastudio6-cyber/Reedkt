# Preview, Revision, And QA Architecture

## Purpose

This document defines how ReeditPro should store preview renders, reviews, revision requests, approvals, and quality checks. It is documentation only and does not implement rendering, uploads, storage, migrations, or APIs.

## Preview Principle

The system must know when a preview is good enough to show the user. Preview is not final export. A preview can be ready while final export still requires additional approval, render settings, or QA.

## RP-DB-10 Migration Shape

`supabase/migrations/202605130008_render_preview_export_revision_qa.sql` creates the first full render, preview, export, revision, and QA database layer. It stores records only and does not run FFmpeg, Remotion, Cloud Run, GPU workers, provider APIs, uploads, or exports.

Render pipeline tables:

- `render_jobs`: render work requested by orchestration after approval and credit reservation.
- `render_job_inputs`: source media, generated assets, captions, music, SFX, transitions, Stroke Motion, Graphic Design, Real Motion, SoundSync, and timeline layers used by a render.
- `renders`: preview, revision preview, final, export variant, or test render outputs.
- `render_events`: append-style progress and audit events.

Export tables:

- `exports`: export requests/results from a ready render.
- `export_variants`: platform or format variants such as Shorts, Reels, website, captions, audio, or client review packages.
- `can_export_render(render_id)`: read-only helper that returns true only when a render is ready, preview review is not blocking, and QA has passed or has only non-blocking warnings.

Preview and revision tables:

- `preview_reviews`: preview approval, rejection, or changes requested inside chat.
- `review_comments`: timestamped review comments linked to chat messages when available.
- `revision_requests`: structured revision requests from chat/review, including whether new generation or rendering is required and whether extra credits need estimating.
- `revision_request_items`: affected segments, signature routes, generated assets, Stroke Motion plans, render inputs, or timecodes.

QA tables:

- `qa_reports`: render/export readiness summaries.
- `qa_report_items`: individual checks for speech clarity, cuts, captions, caption collisions, music, SFX, transitions, ambience, story flow, signature timing, Stroke Motion timing, Real Motion face safety, Graphic Design readability, render integrity, export settings, credit compliance, user instructions, and professional standard.

`project_latest_preview_view` exposes the latest non-archived preview or revision preview per project for chat/dashboard reads.

## Required Tables

The older table sketches below are superseded by the RP-DB-10 migration shape above, but remain as conceptual context.

### `render_jobs`

Worker job for preview or final render.

Fields:

- `id`
- `workspace_id`
- `project_id`
- `edit_plan_id`
- `job_id`
- `render_type`: `preview`, `final`, `revision_preview`
- `status`
- `input_manifest_json`
- `output_media_asset_id`
- `credit_reservation_id`
- `started_at`
- `completed_at`

### `renders`

Rendered output record.

Fields:

- `id`
- `project_id`
- `render_job_id`
- `media_asset_id`
- `render_type`
- `status`: `draft`, `qa_checking`, `preview_ready`, `revision_requested`, `export_ready`, `failed`
- `duration_seconds`
- `aspect_ratio`
- `platform`
- `qa_report_id`
- `created_at`

### `exports`

Export package for a platform.

Fields:

- `id`
- `project_id`
- `render_id`
- `platform`
- `format`
- `status`: `draft`, `queued`, `exporting`, `completed`, `failed`, `cancelled`
- `export_metadata_json`
- `created_at`

### `preview_reviews`

User or system review of a preview.

Fields:

- `id`
- `project_id`
- `render_id`
- `chat_session_id`
- `reviewer_user_id`
- `status`: `pending`, `approved`, `revision_requested`, `rejected`
- `summary`
- `created_at`

### `review_comments`

Timestamped comments.

Fields:

- `id`
- `preview_review_id`
- `chat_message_id`
- `timecode`
- `comment_text`
- `comment_type`
- `resolved`
- `created_at`

### `revision_requests`

Structured revision request from chat.

Fields:

- `id`
- `project_id`
- `chat_session_id`
- `source_chat_message_id`
- `preview_review_id`
- `requested_change`
- `affected_segment_ids_json`
- `affected_systems_json`
- `requires_generation`
- `estimated_extra_credits`
- `credit_estimate_id`
- `status`: `requested`, `triaging`, `estimate_required`, `awaiting_approval`, `approved`, `queued`, `completed`, `rejected`, `cancelled`, `failed`
- `created_at`

### `approval_records`

Approval audit record.

Fields:

- `id`
- `project_id`
- `chat_session_id`
- `record_type`: `edit_plan`, `credit_estimate`, `revision`, `preview`, `export`
- `target_table`
- `target_id`
- `approved_by`
- `approval_message_id`
- `approved_at`
- `status`

### `qa_reports`

Structured QA results.

Fields:

- `id`
- `project_id`
- `edit_plan_id`
- `render_id`
- `qa_type`
- `overall_status`: `pass`, `warning`, `fail`
- `summary`
- `checks_json`
- `blocking_issues_json`
- `created_at`

## QA Checks

QA should include:

- Speech clarity.
- Cut smoothness.
- Caption readability.
- Music balance.
- SFX balance.
- Transition quality.
- Ambient consistency.
- Story flow.
- Signature timing.
- Credit compliance.
- User instruction compliance.

## Preview Readiness

A preview can be shown when:

- Required render job completed.
- QA status is pass or non-blocking warning.
- Captions are readable.
- Audio is not broken.
- No blocked signature asset is missing.
- Credit usage matches approval.
- User instructions are not obviously violated.

If these fail, create a QA report and repair recommendation instead of showing a broken preview as successful.

RP-DB-10 stores this with `renders.status`, `preview_reviews.status`, `qa_reports.status`, `qa_reports.requires_retry`, and detailed `qa_report_items`.

## Revision Flow

1. User types revision request in chat.
2. AI maps request to affected segments and systems.
3. ReeditPro decides whether new generation is required.
4. If credits are needed, create a new estimate.
5. User approves extra credits.
6. Jobs run.
7. New preview is rendered and QA checked.
8. Preview appears in chat.

RP-DB-10 links revisions back to chat messages/actions, preview reviews/comments, renders, edit plans, credit estimates/reservations, and affected items. A revision is not automatically free if it requires expensive generation; it should move through estimate and approval when needed.

## Revision Examples

- "Make captions smaller." Usually local metadata and render preview only.
- "Remove Real Motion." May avoid future generation and lower cost.
- "Make Real Motion smaller." May require overlay adjustment and preview render.
- "Make it more premium." Requires planning, estimate, and possibly new generation.
- "Keep original clip order." Requires edit plan revision and preview rebuild.

## Final Export Boundary

Preview approval is not publishing approval. Export should require:

- Approved preview.
- Export settings.
- Any required credit estimate.
- Render/export job.
- Final QA check.

This task does not implement export or social posting.

RP-DB-10 stores export records and variants, but export execution remains future backend/worker work. Final export should wait for a ready render, non-blocking QA, preview approval when required, and any needed credit approval.
