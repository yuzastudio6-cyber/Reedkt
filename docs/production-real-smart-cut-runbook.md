# Production Real Smart Cut Runbook

Modes:

- `dry_run`: validates smart cut inputs, builds execution plan, command plan, timeline metadata, artifacts, and QA without FFmpeg.
- `local_dev`: may run proxy preview only when explicitly enabled and safe.
- `container_ready`: prepares command and artifact plans for a future container run, but does not run Docker.
- `production_blocked`: refuses production cutting/rendering.
- `production_ready`: requires approved snapshot, tool execution plan, idempotency, private storage refs, passing cut QA, and readiness gates.

Validation:

```powershell
npm.cmd run smoke:prod-real-smart-cut-timeline
```

M14 does not deploy, run `gcloud`, call providers, run GPU tools, do color/audio/mask work, use Revideo, or final export.
