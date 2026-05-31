# Phase 45B Remotion Render Validation Runbook

Phase 45B validates a bounded private Remotion render preview using only the approved Phase 32 source and Phase 45A libass burn-in evidence.

Default CLI/report mode is static. Execution requires `GCP_PROJECT_ID=reeditpro`, `GCP_REGION=us-central1`, `REEDITPRO_ENV=staging`, and `REEDITPRO_CONFIRM_REMOTION_RENDER_VALIDATION=true`.

Execution builds the dedicated CPU validation worker, pushes `staging-remotion-render-validation-001`, deploys `reeditpro-staging-remotion-render-validation-job`, renders a private preview of 5 seconds or less, validates it with FFprobe, and uploads private QA/report artifacts.

Final delivery, production, external beta, paid production, broad real media, arbitrary media, providers, Revideo, public access, and Track B tools remain blocked.
