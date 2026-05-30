# Phase 35F SAM2 Feature E2E Runbook

Phase 35F runs one private SAM2 text-behind-subject feature E2E gate on the approved controlled real-video chain only.

The preferred scope is the full Phase 32 private color-corrected export at 768x432, 5 fps, with a hard cap of 125 frames. If that scope cannot complete safely, the flow must fall back to the already approved 6.9s-8.9s segment and report segment-only readiness.

Execution requires:

- `GCP_PROJECT_ID=reeditpro`
- `GCP_REGION=us-central1`
- `REEDITPRO_ENV=staging`
- `REEDITPRO_CONFIRM_SAM2_FEATURE_E2E=true`

Default plan/report commands are static and non-mutating. Actual execution may build/push the dedicated SAM2 image, update the existing SAM2 Cloud Run job, run one L4 GPU job, compose private preview frames, and write private GCS artifacts.

Phase 35F does not approve external beta, paid production, broad real media, providers, Revideo, FILM, slow motion, Real-ESRGAN, public URLs, final delivery export, or arbitrary user media.
