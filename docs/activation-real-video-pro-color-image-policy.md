# Phase 40C Real-Video Pro Color/Image Policy

Phase 40C is a Track A controlled real-video sample. It may run only after
Phase 40B generated-fixture runtime evidence passes.

## Approved Inputs

- Phase 40B run: `phase40b-20260531T10390`
- Phase 40B report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-pro-color-image/phase40b/phase40b-20260531T10390/reports/phase40b-report.json`
- Phase 32 source: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`

## Runtime Policy

- Runtime mode: `real_video_sample`
- Runtime image tag: `staging-pro-color-image-real-video-001`
- Cloud Run job: `reeditpro-staging-pro-color-image-runtime-job`
- Compute: CPU-only, 4 CPU, 8Gi, parallelism 1, max retries 0
- Service account: `reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com`

## Required Gates

All execution gates must remain false for full-video processing, final delivery,
providers, Revideo, production, external beta, paid production, and broad real
media.

