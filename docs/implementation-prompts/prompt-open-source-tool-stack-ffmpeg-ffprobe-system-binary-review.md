# OPEN_SOURCE_TOOL_STACK_FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW

Start from the source-of-truth branch after the DuckDB native rebuild QA review lands.

This is a review phase only unless a later prompt explicitly approves binary checks or installation. Do not install FFmpeg or FFprobe, mutate Dockerfiles or container images, process media, run version probes, execute workers/routes/providers, mutate Supabase/GCS, create public artifacts, create signed URLs, run raw prompts, merge PRs, or unlock beta/production.

Source evidence to preserve:
- DuckDB accepted as installed/proven: true
- Polars accepted as installed/proven: true
- FFmpeg remains missing/unproven.
- FFprobe remains missing/unproven.

Coordinate with Track A Render/Export, Sound/Music/Audio, and Worker Runtime Jobs owners before any future system-binary or worker-container approval.
