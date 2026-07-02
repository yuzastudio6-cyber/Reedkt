# Production Real Color Execution Runbook

Modes:

- `dry_run`: validates inputs, builds analysis, plans, command metadata, artifacts, and QA without executing tools.
- `local_dev`: may run FFmpeg preview only when explicitly enabled, FFmpeg is available, paths are safe, and source/proxy is not overwritten.
- `container_ready`: emits command and artifact plans only. It does not run Docker.
- `production_blocked`: refuses real production color execution.
- `production_ready`: remains gated by approved snapshots, readiness, private refs, OpenColorIO/OpenImageIO manual review, and color QA.

Human local-dev checks may use already-installed FFmpeg and generated temp media fixtures. Do not deploy, call providers, final export, download models, or process arbitrary user media.
