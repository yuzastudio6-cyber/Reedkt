# Phase 40D Pro Color/Image Feature E2E Runbook

Phase 40D is a Track A private feature E2E readiness gate. It runs the approved
Phase 32 private export through the Phase 40C-proven FFprobe, FFmpeg,
OpenImageIO, OpenColorIO, and Kornia CPU stack on three bounded frames only.

Default commands are report-only:

- `npm run activation:pro-color-image-feature-e2e:report`
- `npm run activation:pro-color-image-feature-e2e:iam-plan`
- `npm run smoke:activation-pro-color-image-feature-e2e`

Execution is allowed only with:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_PRO_COLOR_IMAGE_FEATURE_E2E=true \
npm run activation:pro-color-image-feature-e2e -- --execute
```

The execution must create a Phase 40D approved plan snapshot, source validation,
bounded sample manifest, private contact sheet or review package, private review
manifest, QA JSON, and `phase40d-report.json`.

Do not process arbitrary media, the full video, full 4K frames, final delivery,
providers, Revideo, Track B tools, public URLs, production, external beta, paid
production, or broad real media.
