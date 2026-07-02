# Project Edit Brief E2E Audit

RP-EDITBRIEF-12 audits the complete mock/local Edit Brief path for internal testing. Edit Brief is optional, Chat remains default, Marker Chat is marker-scoped, marker attachments are metadata-only, and plan hints are not execution.

Production ready: false. Owner approval pending. No migration created. No Supabase command run.

## Covered Path

The target path is Project Home to Edit Chat to Brief tab, then video/timeline shell, marker creation, marker edit/confirm, Marker Chat intent capture, metadata-only attachment, Export Settings review/save, Marker QA, Brief Plan Hints, application-log summary, and Chat tab return.

## Boundaries

- No real planner executes and no edit plan is created.
- No render, export, progress, worker, provider, model, media processing, sound runtime, Docker, upload, file-byte read, external URL fetch, Supabase write, or credit action starts.
- Marker Chat remains marker-scoped and must not write to the main Edit Chat stream.
- Attachments are metadata-only labels or redacted reference URL metadata.

## Verification Record

RP-EDITBRIEF-12 adds `smoke:project-edit-brief-e2e` and `tests/e2e/project-edit-brief-e2e.spec.ts`. Final pass/fail status is recorded in `implementation-status.md` after verification.

## RP-MEDIA-01 E2E Addendum

RP-MEDIA-01 adds focused coverage in `tests/e2e/project-source-video-brief-playback.spec.ts`. The spec uses mocked browser media metadata instead of a binary video fixture and verifies local file selection, metadata loading, real `<video>` mode, timeline seek, Add Marker playhead defaults, source-dimension Export Settings recommendation, and boundary copy.

This coverage must not be interpreted as backend media readiness: no upload, backend byte read, media worker, provider/model call, render/export, credit action, Supabase command, migration, staging, commit, or cleanup is involved.
