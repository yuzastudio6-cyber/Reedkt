# Production Media Analysis Runbook

Milestone 6 media foundation is local/dev only for real media commands.

## Modes

- `dry_run`: validates media foundation intent and expected tasks without FFmpeg or FFprobe.
- `local_dev`: runs FFprobe/FFmpeg only on local files and safe temp output roots.
- `production_blocked`: returns a policy block and does not execute commands.

## Smoke Test

Run:

```powershell
npm.cmd run smoke:prod-media-foundation
```

The smoke always validates adapter contracts, path safety, signed URL rejection, private artifact records, partial report building, dry-run mode, production-blocked mode, and optional CPU worker routing.

If FFmpeg or FFprobe is unavailable, the generated fixture portion skips gracefully and reports the skip reason. If both are available, the smoke creates a tiny temp video, probes it, creates a proxy, extracts audio, extracts representative frames, builds a partial `MediaAnalysisReport`, and cleans up temp files.

## Boundary

Do not use customer media, cloud storage, providers, GPU tools, Revideo, final render, model downloads, deployment, or secrets in Milestone 6.
