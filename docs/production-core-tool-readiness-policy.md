# Production Core Tool Readiness Policy

Milestone 10 extends production readiness with safe CPU/render checks while preserving the Milestone 5 dry-run behavior.

## Dry-Run Mode

`runProductionToolReadiness({ dryRun: true })` remains spec-only. It does not execute commands, import packages, inspect media, build images, download models, or contact providers.

## Real Check Mode

`realCheckMode: true` is optional and CPU/render-only. It may run:

- FFmpeg and ffprobe version checks;
- safe libass support inspection;
- Python import checks for PyAV, PySceneDetect, OpenCV headless, DuckDB, Polars, OpenTimelineIO, and optional color packages;
- Node package metadata checks for Sharp, Remotion, and Hyperframe if present.

Real check mode must not run media processing, frontend/browser runtime, GPU/model packages, model-weight checks, provider calls, or render/export jobs.

## Statuses

Missing local tools should report `missing`, `not_installed`, or `warning` without failing non-strict smoke. FFmpeg LGPL and libass production verification remain `pending_manual_review` until explicitly approved.
