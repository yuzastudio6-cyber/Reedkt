# WORKER-4 Allowed And Blocked Scope

WORKER-4 expected state: `worker_runtime_offline_dry_run_execution_allowed_with_warnings`

## Allowed Future Actions

- Read committed WORKER-2 worker fixture contracts.
- Read committed scoped tool-call manifest fixtures.
- Validate approved plan snapshot placeholders and worker job payload placeholders.
- Run an offline/static harness only if WORKER-4 execution approval exists.
- Write ignored local/offline evidence under a WORKER-4 local artifact directory.
- Commit only sanitized summaries, diagnostics, validation results, and implementation records.

## Blocked Future Actions

- Live worker execution.
- Worker job claim.
- Worker lease mutation.
- Queue execution.
- Route execution.
- Tool execution.
- Route handler import.
- Tool runtime import.
- Worker runtime import.
- Provider/model calls.
- Supabase mutation.
- SQL execution.
- GCS upload or storage transfer.
- Signed URL creation.
- Public artifact creation.
- Browser capture.
- Map rendering.
- Media/audio processing.
- Audio generation.
- SFX/music generation.
- FFmpeg/FFprobe execution.
- DeepFilterNet execution.
- Demucs execution.
- Docker/Cloud Run execution.
- Dependency mutation.
- Raw prompt execution.
- Final render/export.
- Internal beta, external beta, paid production, or production unlock.

Future WORKER-4 must preserve source-of-truth wording: approved plan snapshot + scoped tool-call manifest + private artifact manifest placeholder + checksum/provenance + QA evidence + observability evidence + cleanup evidence. Signed URLs are not source of truth.
