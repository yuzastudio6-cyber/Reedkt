# Phase 35D Real-Video SAM2 Temporal Mask Runbook

Phase 35D runs exactly one controlled SAM2 temporal mask test on the approved
Phase 32 private export. The segment is fixed at 6.9s-8.9s, extracts 10 frames
at 768x432, derives a box prompt from the approved Phase 33D mask, and emits
private artifacts only.

Execution requires:

- `GCP_PROJECT_ID=reeditpro`
- `GCP_REGION=us-central1`
- `REEDITPRO_ENV=staging`
- `REEDITPRO_CONFIRM_SAM2_REAL_VIDEO_TEMPORAL_MASK=true`

Commands:

- `npm run activation:real-video:sam2-temporal-mask:report`
- `npm run activation:real-video:sam2-temporal-mask:iam-plan`
- `npm run smoke:activation-real-video-sam2-temporal-mask`
- `npm run activation:real-video:sam2-temporal-mask -- --execute`

The default report and IAM commands are non-mutating. The execute command may
build/push the dedicated SAM2 runtime image, update the existing Cloud Run job,
add only missing prefix-scoped IAM bindings, and run one L4 job.

Blocked throughout Phase 35D: arbitrary media, new source videos, full-video
masks, text-behind-subject video, providers, Revideo, FILM, slow motion,
production, external beta, broad real media, public URLs, and public buckets.
