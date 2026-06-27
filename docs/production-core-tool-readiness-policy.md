# Production Core Tool Readiness Policy

Milestone 10 extends production readiness with safe CPU/render checks while preserving the Milestone 5 dry-run behavior.

## Dry-Run Mode

`runProductionToolReadiness({ dryRun: true })` remains spec-only. It does not execute commands, import packages, inspect media, build images, download models, or contact providers.

## Real Check Mode

`realCheckMode: true` is optional and CPU/render-only. It may run:

- FFmpeg and ffprobe version checks;
- safe libass support inspection;
- Python import checks for PyAV, PySceneDetect, OpenCV headless, DuckDB, Polars, OpenTimelineIO, and optional color packages;
- Node package metadata checks for Sharp and Remotion, plus an internal Hyperframe bridge source-boundary check.

Real check mode must not run media processing, frontend/browser runtime, GPU/model packages, model-weight checks, provider calls, or render/export jobs.

## Statuses

Missing local tools should report `missing`, `not_installed`, or `warning` without failing non-strict smoke. FFmpeg LGPL and libass production verification remain `pending_manual_review` until explicitly approved.

## Libass Proof Lane

`npm run beta:tools:libass-container-proof-preflight` is the next safe blocker-reduction lane for libass. It may inspect only `ffmpeg -hide_banner -filters` on the host or inside an explicitly supplied approved render/tool-readiness image with `docker run --rm --network none`.

A passing filter inspection can produce a blocker-reducing evidence packet for `libass`, but it does not prove final caption burn-in, font packaging, safe-zone QA, LGPL/commercial review, beta launch, production launch, or product-ready local OSS status.

After filter proof passes, `npm run beta:tools:libass-synthetic-burnin-qa-preflight` is the bounded current-source QA lane for libass product-ready local OSS acceptance. It uses only temporary synthetic media/captions, verifies safe ASS styling, performs one burn-in/probe, deletes temp artifacts, and refuses accepted evidence unless production-readiness and product-ready local OSS confirmations are explicit. The historical open PR #73 is not duplicated or merged by this lane because it targets an old activation branch and references private GCS artifacts.
