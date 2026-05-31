# Phase 40C Real-Video Pro Color/Image Runbook

Phase 40C verifies the Track A pro color/image runtime on a bounded sample from
the approved Phase 32 private export only.

## Scope

- Source: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`
- Sample: three frames at `0.5s`, `7.7335s`, and `14.5s`
- Bound: `768x432`, max `5` frames
- Tools: FFprobe, FFmpeg, OpenColorIO, OpenImageIO, Kornia CPU

## Execution

Execution requires:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_REAL_VIDEO_PRO_COLOR_IMAGE_SAMPLE=true \
npm run activation:real-video:pro-color-image -- --execute
```

Default CLI/report/IAM modes are static and do not build Docker images, deploy
Cloud Run jobs, mutate GCP, or process media.

## Boundaries

Phase 40C must not process arbitrary media, the full video, full 4K frames, a
final delivery export, providers, Revideo, Track B tools, public URLs, public
buckets, production, external beta, paid production, or broad real media.

