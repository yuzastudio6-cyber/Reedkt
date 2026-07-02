# Production Real Enhancement Slowmotion Runbook

Use `dry_run` to validate inputs, build enhancement and slow-motion plans, create private artifact summaries, and emit QA without tools.

Use `local_dev` only with explicit execution flags and safe local artifact paths. Real-ESRGAN, FILM, FFmpeg, OpenCV, and Sharp all skip safely when unavailable; no package install or model download is part of this runbook.

Use `container_ready` for command/artifact plans only. Use `production_blocked` to refuse execution. `production_ready` remains blocked until approved snapshots, idempotency, private refs, readiness, model-weight manifests, and QA gates all pass. M15D never final renders or exports.
