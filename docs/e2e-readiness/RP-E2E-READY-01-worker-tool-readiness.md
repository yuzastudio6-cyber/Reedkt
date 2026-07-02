# RP-E2E-READY-01 Worker Queue + Tool Readiness

This milestone adds a server-only worker readiness layer. It prepares ReeditPro to move from backend records and uploaded media into worker-claimed jobs and verified tool checks without providers, Stripe, Cloud Run deployment, real rendering, or production media processing.

## Worker Runtime

The new `server/workers/` layer loads jobs, runs gates, claims jobs through `worker_job_claims`, emits sanitized `job_events`, runs a selected worker handler, heartbeats where possible, and releases the claim.

Workers execute records and approved snapshots, not raw chat. Expensive jobs such as generation, render, export, and provider work require an approved snapshot and credit reservation before execution.

## Tool Readiness

Tool checks are safe version/package/import checks only:

| Tool | Required For | Behavior |
| --- | --- | --- |
| `ffmpeg` | real editing/media tests | Runs `ffmpeg -version` only. |
| `ffprobe` | media readiness/probe tests | Runs `ffprobe -version`; media probe uses ffprobe metadata only. |
| `remotion` | future render tests | Checks package availability; no render. |
| `sharp_libvips` | future thumbnails/assets | Checks package availability. |
| `audioflux` | future SoundSync analysis | Checks Python import only. |
| `signalsmith_stretch` | future stretch/pitch | Reports unavailable until configured. |
| `opencv` | future visual QA | Checks Python import only. |
| `vapoursynth` | future frame pipeline | Checks Python import only. |
| `playwright` | future browser capture | Checks package availability; no browser opens. |

Missing optional tools are recorded as warnings unless `STRICT_TOOL_READINESS=true`.

## Prompt 5 Result And Prompt 5.5 Bootstrap

The first local readiness report found the host missing `ffmpeg`, `ffprobe`, Remotion, Sharp/libvips, Playwright, Signalsmith Stretch, and Python-backed optional tools. Prompt 5.5 adds a reproducible Docker worker path so Prompt 6 can verify the required FFmpeg/FFprobe tools even when the host remains unconfigured.

Use:

```bash
npm run tools:summary
npm run smoke:prompt6-ready
npm run docker:worker:build
npm run docker:worker:tools
npm run docker:worker:smoke
```

Prompt 6 is ready only when `ffmpeg` and `ffprobe` are available. Optional tools should stay marked unavailable until their own milestones install and verify them.

## Routes And CLI

- `GET /health/tool-readiness?run=true`
- `POST /v1/workers/tool-readiness/check`
- `POST /v1/workers/jobs/:jobId/run`
- `POST /v1/workers/jobs/:jobId/probe-media`

CLI commands:

```bash
npm run tools:check
npm run tools:summary
npm run smoke:prompt6-ready
npm run worker:run -- --job-id job_123 --worker-type noop_worker
npm run worker:probe-media -- --job-id job_123 --storage-object-id storage_object_123
```

## Docker Skeleton

`docker/worker/Dockerfile` is a readiness-only worker image base with Node, FFmpeg, FFprobe, Python 3, pip, and small shell utilities. It does not deploy, install optional tools, install Remotion, install Sharp/libvips, or call providers. Production FFmpeg and codec usage still needs LGPL-safe build/configuration review.

## Still Not Implemented

- Cloud Run worker dispatch.
- Durable queue polling.
- Full transactional worker claims/RPCs.
- Production media transforms.
- Remotion rendering.
- Provider execution.
- Stripe or real credit spend.
