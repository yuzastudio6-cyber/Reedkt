# OPEN_SOURCE_TOOL_STACK_FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL

Use the central source-of-truth branch after the Track A FFmpeg/FFprobe reconciliation lands.

Decision from reconciliation: `tracka_ffmpeg_ffprobe_source_of_truth_reconciliation_passed_ready_for_version_probe_approval`.

Goal: approve a future bounded FFmpeg/FFprobe version-probe packet only. Do not run the probes in the approval phase.

Allowed future command candidates after a separate approval:
- `ffmpeg -version`
- `ffprobe -version`
- Docker or worker-container equivalent only if the source path remains container-only and that container scope is separately approved.

Blocked:
- media input files
- file probing
- decode/encode
- caption burn-in
- render/export
- Docker build unless separately approved
- Supabase, SQL, GCS, public artifacts, signed URLs
- raw prompts
- beta or production unlock

Stop on the first source-of-truth, scope, or safety drift.
