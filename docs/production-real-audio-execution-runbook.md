# Production Real Audio Execution Runbook

Modes:

- `dry_run`: validates inputs, builds execution plans, command plans, artifacts, and QA without executing tools.
- `local_dev`: may run FFmpeg loudness/normalization only when explicitly enabled, FFmpeg is available, paths are safe, and source is not overwritten.
- `container_ready`: emits command and artifact plans only. It does not run Docker.
- `production_blocked`: refuses real cleanup/separation.
- `production_ready`: remains gated by approved snapshot IDs, readiness, private refs, model-weight approval, and QA.

Human local-dev checks may use already-installed FFmpeg and generated temp audio fixtures. Do not download models, run providers, deploy, final mux/export, or process arbitrary user media.
