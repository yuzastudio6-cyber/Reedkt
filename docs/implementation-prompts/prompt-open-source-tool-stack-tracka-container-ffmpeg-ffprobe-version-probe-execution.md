# OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_EXECUTION

Use central source-of-truth branch `codex/rp-github-merge-hygiene-open-pr-stack-audit` after this approval packet lands.

Approval decision: `ffmpeg_ffprobe_version_probe_approval_passed_ready_for_tracka_container_probe_execution`.

Future execution target:
- Runtime path: `tracka_repo_owned_render_worker_container`
- Source path: `docker/prod/render-worker/Dockerfile`
- Commands: `ffmpeg -version` and `ffprobe -version`
- Timeout: 15 seconds

This future phase must remain version-output-only. Do not process media, probe files, decode, encode, caption burn-in, render/export, use local host binaries as source of truth, mutate Docker/container files, install packages, rebuild packages, run DuckDB/Polars proofs, execute workers/routes/providers, mutate Supabase/GCS, create public artifacts or signed URLs, run raw prompts, or unlock beta/production.

Stop on any source-of-truth, runtime path, command boundary, artifact policy, or safety drift.
