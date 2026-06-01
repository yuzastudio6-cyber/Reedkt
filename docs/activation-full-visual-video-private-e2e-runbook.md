# Phase 45E Full Visual-Video Private E2E Runbook

Phase 45E validates the Track A visual/video private review workflow end to end by assembling a private evidence package for the approved Phase 32 source and the approved Phase 45A, 45B, 45C, and 45D render-hardening artifacts.

## Scope

- Source: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`
- Canonical private review export: `gs://reeditpro-staging-reeditpro-final-exports/activation-render-hardening/phase45d/phase45d-20260531T22235/review/hardened-review-export.mp4`
- Evidence chain: Phase 45A libass, Phase 45B Remotion, Phase 45C OpenTimelineIO, and Phase 45D FFmpeg/FFprobe.
- Output: private JSON evidence, QA, and review manifest only.

## Execute

Default CLI mode is static/report-only.

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_FULL_VISUAL_VIDEO_PRIVATE_E2E=true \
PROVIDER_EXECUTION_ENABLED=false \
REVIDEO_ENABLED=false \
TRACK_B_TOOLS_ENABLED=false \
PUBLIC_ACCESS_ENABLED=false \
FINAL_DELIVERY_ENABLED=false \
REEDITPRO_PRODUCTION_READY=false \
REEDITPRO_EXTERNAL_BETA_READY=false \
REEDITPRO_PAID_PRODUCTION_READY=false \
REEDITPRO_BROAD_REAL_MEDIA_READY=false \
npm run activation:full-visual-video-private-e2e -- --execute
```

The runner verifies private GCS evidence, validates the canonical private review export with FFprobe, uploads the Phase 45E private E2E manifest and QA report, and does not create a new final delivery export.

## Blockers

Stop if any approved evidence object is missing, any prior Phase 45 report has blockers, FFprobe validation fails, a public principal is detected, or a production/beta/provider/Revideo/Track B/final-delivery gate is enabled.
