# Prompt 9 - Media Readiness, Probe, Transcript, And Timing Foundation

## Small Context

Prompt 9 follows Prompt 8 job/worker/idempotency boundaries and creates the media readiness foundation needed before planning, transcript, timing, render, and worker systems depend on source media facts.

## Allowed Scope

- Media readiness route/service boundaries.
- Source media metadata validation.
- Storage object dependency checks.
- Source sequence readiness summaries.
- Probe readiness and request blockers.
- Transcript, visual observation, audio observation, and timing seed placeholders.
- Route metadata, diagnostics, docs, and draft SQL/RLS tests.

## Forbidden Scope

- Real user-media processing.
- FFmpeg/ffprobe production route execution.
- AI transcription, OCR, VLM, object/face detection, or audio analysis.
- Job creation, worker claims, or worker execution.
- Provider calls, rendering, tool execution, Stripe, deployment, remote Supabase, migrations, real credit mutation, storage upload/download execution beyond Prompt 4, planning generation, or approved snapshot mutation beyond Prompt 5.

## Canonical Concepts

Use `projects`, `workspaces`, `workspace_members`, `media_assets`, `uploaded_clips`, `source_sequence_items`, `storage_object_records`, `upload_intents`, `jobs`/worker records as blockers only, and `master_timing_maps` as future readiness references.

Avoid `source_clip_sequences`, `source_clip_sequence_items`, `source_sequence_maps`, provider/generation/render/tool tables, noncanonical transcript/observation tables, and StoryTiming execution records beyond placeholders.

## Deliverables

- Media readiness service, routes, validation schemas, and API route metadata.
- Media readiness foundation report, route contract, gate contract, and validation results.
- Draft SQL/RLS smoke test plan.
- Media readiness static diagnostics and foundation validation runner coverage.
- Source-of-truth status, milestone plan, and implementation prompt tracker updates.

## Validation Checklist

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-08-job-orchestration-worker-claims-idempotency...HEAD`
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
- `npm run foundation:validate`
- `npm run foundation:validate:with-build`

If full local build remains environment-blocked, classify it accurately and rely on GitHub Foundation Validation for Linux evidence. SQL/RLS remains draft-only unless local Supabase is repaired.

## GitHub Requirement

Create branch `codex/rp-foundation-09-media-readiness-probe-transcript-timing`, commit changes, push, open PR `[foundation] Prompt 9 media readiness probe transcript timing` against `codex/rp-foundation-08-job-orchestration-worker-claims-idempotency`, and do not merge.

## Acceptance Criteria

- Media readiness lifecycle is documented and implemented as fail-closed route/service boundaries.
- Probe/transcript/observation/timing placeholders do not execute real analysis.
- Media readiness diagnostics exist and pass.
- Draft SQL/RLS test exists and remains honest about execution status.
- Prompt 9 is tracked in implementation prompts.
- No provider, render, tool, worker, job execution, media analysis, remote Supabase, migration, Stripe, storage execution beyond Prompt 4, credit mutation beyond Prompt 6, or approved snapshot mutation beyond Prompt 5 is enabled.
