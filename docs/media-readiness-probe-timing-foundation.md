# Media Readiness Probe Timing Foundation

Prompt 9 adds a limited media readiness route and service foundation. It does not process real user media, run FFmpeg or ffprobe from production routes, execute workers, create jobs, call providers, render, execute tools, mutate credits, deploy, run migrations, or use remote Supabase.

## Current Implementation Found

- Prompt 4 storage/upload boundaries create upload intents, storage object records, and media asset metadata.
- Prompt 8 job/worker boundaries are fail-closed and do not execute jobs or claim workers.
- Existing local worker helpers can probe fixture media in local worker contexts, but those helpers are not production route execution paths.
- StoryTiming and video-understanding docs exist, but transcript, observation, and timing execution remain future worker/provider/tool milestones.

## Canonical Concepts Used

- `projects`, `workspaces`, and `workspace_members` for access checks.
- `media_assets` for source media metadata.
- `storage_object_records` and `upload_intents` for canonical private storage references.
- `uploaded_clips` and `source_sequence_items` for source order readiness.
- `jobs` and worker records only as future blockers, not execution targets.
- `master_timing_maps` as a future timing readiness reference only.

Prompt 9 avoids `source_clip_sequences`, `source_clip_sequence_items`, `source_sequence_maps`, provider/generation/render/tool tables, credit tables, approved snapshot mutation, and StoryTiming execution records as production write targets.

## Layer Responsibilities

| Layer | Responsibility | Hard limit |
| --- | --- | --- |
| Frontend | Request readiness summaries and display blockers. | Must not process media, run tools, call providers, or infer readiness from signed URLs. |
| Backend API | Validate auth/project access, summarize canonical records, return blockers. | Must not execute media tools, create jobs, claim workers, mutate credits, render, or call providers. |
| Supabase | Store canonical media/storage/source/timing records in future. | Prompt 9 performs no schema-changing migration and no remote validation. |
| Workers | Future media probe, transcript, observation, and timing work. | No worker execution is enabled by Prompt 9. |

## Lifecycles

- Source media readiness: upload finalization creates canonical bucket/path and media metadata; Prompt 9 checks that metadata is present and private-path scoped.
- Media probe readiness: checks whether storage and metadata prerequisites exist, then blocks execution until future worker/tool runtime exists.
- Transcript readiness: returns placeholder readiness and blocks real transcription/alignment.
- Visual/audio observation readiness: returns placeholder readiness and blocks OCR, VLM, object/face detection, and audio analysis.
- Timing seed readiness: validates duration/frame-rate prerequisites and blocks persistence or frame-accurate timing validation until a future timing runtime exists.
- Source sequence readiness: reads `uploaded_clips` and `source_sequence_items` only when backend runtime is available; it never changes order or starts planning.

## Readiness Result

Routes return `MediaReadinessResult` with:

- `status`: `ready`, `blocked`, `backend_required`, or `mock_only`
- `canProceed`, `canProbe`, `canPlan`, `canRender`
- `blockers`, `warnings`, `requiredRecords`, `nextAction`
- optional media, storage, source sequence, probe, transcript, observation, timing, idempotency, and audit-event summaries

## Idempotency And Audit

- `media.probe.request` requires an idempotency key because it represents a future mutation/request boundary.
- Readiness-only checks do not require idempotency.
- Audit event payloads are sanitized previews only; Prompt 9 writes no audit rows.

## Fail-Closed Behavior

If backend service-role runtime, canonical records, worker runtime, media probe tools, or timing runtime are unavailable, routes return explicit blockers. Prompt 9 never treats a missing runtime as success.

## Validation Results

See `docs/prompt-09-validation-results.md`.

## Still Blocked

- Real media probe execution.
- Real transcript alignment.
- Real visual/audio observation.
- Master timing persistence and frame-accurate timing validation.
- Job creation, worker claims, provider calls, rendering, tool execution, credit mutation, storage upload/download execution beyond Prompt 4, and approved snapshot mutation beyond Prompt 5.
