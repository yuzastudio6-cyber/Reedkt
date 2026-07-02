# Production Final Render Runbook

Use `dry_run` to validate payloads, normalize manifests, resolve assets, build Remotion/FFmpeg/libass command plans, write artifact summaries, and emit QA without tools.

Use `local_dev` only with explicit execution flags and safe local paths. FFmpeg, Remotion, and libass all skip safely when unavailable or disabled. No deployment, cloud jobs, provider calls, or arbitrary media paths are part of this runbook.

Use `container_ready` to prepare command/artifact plans only. Use `production_blocked` to refuse execution. `production_ready` remains blocked until approved snapshot, idempotency, private refs, readiness, and QA gates all pass.
