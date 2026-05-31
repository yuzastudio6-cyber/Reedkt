# Phase 45D FFmpeg/FFprobe Final Render Hardening Runbook

Phase 45D validates one bounded private review export for Track A visual/video render hardening. It uses only the approved Phase 32 private source and the approved Phase 45A, 45B, and 45C evidence chain.

## Scope

- Input source: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`
- Hardened input preview: approved Phase 45B Remotion preview.
- Timeline evidence: approved Phase 45C OpenTimelineIO artifact.
- Tooling: FFmpeg and FFprobe only.
- Output: one bounded private review export, not user final delivery.

## Execute

Default CLI mode is static/report-only.

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_FFMPEG_FINAL_RENDER_HARDENING=true \
PROVIDER_EXECUTION_ENABLED=false \
REVIDEO_ENABLED=false \
TRACK_B_TOOLS_ENABLED=false \
PUBLIC_ACCESS_ENABLED=false \
FINAL_DELIVERY_ENABLED=false \
REEDITPRO_PRODUCTION_READY=false \
REEDITPRO_EXTERNAL_BETA_READY=false \
REEDITPRO_PAID_PRODUCTION_READY=false \
REEDITPRO_BROAD_REAL_MEDIA_READY=false \
npm run activation:final-render-hardening -- --execute
```

The runner builds the dedicated CPU worker image, applies only missing prefix-scoped IAM, deploys `reeditpro-staging-final-render-hardening-job`, executes once, and records sanitized evidence.

## Blockers

Stop if the approved source/evidence is missing, FFmpeg export fails, FFprobe validation fails, output privacy fails, or any production/beta/provider/Revideo/Track B/final-delivery gate is enabled.
