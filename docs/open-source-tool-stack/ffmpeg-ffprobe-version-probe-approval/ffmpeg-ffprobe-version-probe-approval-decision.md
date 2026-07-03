# FFmpeg/FFprobe Version-Probe Approval Decision

Decision: `ffmpeg_ffprobe_version_probe_approval_passed_ready_for_tracka_container_probe_execution`

Selected future runtime path: `tracka_repo_owned_render_worker_container`.

Approved future command shape:
- `ffmpeg -version`
- `ffprobe -version`

FFmpeg and FFprobe are not installed/proven by this packet, and no probe ran in this phase. Local host probing, Docker build/run, media processing, render/export, package mutation, Supabase/GCS mutation, public artifacts, signed URLs, raw prompt execution, beta, and production remain blocked.

Next prompt: `OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION`

Supabase classification: no write / none / none / no.
