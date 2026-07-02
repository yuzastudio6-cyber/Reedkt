# ReeditPro Worker Runtime

This folder is the server-only worker/runtime readiness layer for RP-E2E-READY-01. It prepares job loading, gate checks, tool readiness, job events, worker claims, and mock-safe handlers without calling providers, rendering, deploying, or processing production media.

## Current Workers

- `noop_worker`: safe claim/event/release smoke worker.
- `approved_snapshot_readiness_worker`: verifies an approved snapshot exists and contains no obvious secret-like fields.
- `source_media_readiness_worker`: verifies canonical storage metadata shape.
- `media_probe_worker`: local-only `ffprobe` metadata read for finalized local objects.

## Tool Checks

Tool checks run safe version/package/import checks only:

- Required for real media readiness: `ffmpeg`, `ffprobe`.
- Render-only readiness: `remotion`.
- Optional until future milestones: `sharp_libvips`, `audioflux`, `signalsmith_stretch`, `opencv`, `vapoursynth`, `playwright`.

No check calls AI providers, reads secrets, renders, opens browsers, or processes user media.

## Gates

Workers must use approved records and canonical storage references. Generation/render/export/provider jobs require approved snapshot and reserved credits before execution.
