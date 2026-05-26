# Production Smart Cut Runbook

Milestone 8 can be validated without FFmpeg, OpenTimelineIO, Hyperframe, Remotion, providers, model files, or GPU tools.

## Modes

1. `dry_run`: builds candidates, scores, smart cut plan, timeline manifests, artifacts, and QA gates from structured/mock evidence.
2. `local_dev`: may write JSON metadata under a safe output root. It does not cut media.
3. `production_blocked`: refuses real cutting, rendering, or export.

Run:

```powershell
npm.cmd run smoke:prod-smart-cut-timeline
```

The smoke validates candidate building, deterministic scoring, silence/filler/repeated-take planning, boundary and meaning policies, timeline manifest generation, bridge metadata, private artifacts, worker routes, raw prompt/signed URL rejection, production-blocked behavior, and no Revideo usage.
