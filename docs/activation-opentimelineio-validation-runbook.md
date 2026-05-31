# Phase 45C OpenTimelineIO Validation Runbook

Phase 45C validates OpenTimelineIO-compatible timeline metadata for the controlled private render chain. It references only the approved Phase 32 source, Phase 45A libass burn-in evidence, and Phase 45B Remotion render evidence.

Default CLI/report mode is static. Execution requires `GCP_PROJECT_ID=reeditpro`, `GCP_REGION=us-central1`, `REEDITPRO_ENV=staging`, and `REEDITPRO_CONFIRM_OTIO_TIMELINE_VALIDATION=true`.

Execution creates a bounded private timeline document, source validation JSON, timeline validation JSON, QA report, and Phase 45C report. It does not process media, invoke providers, use Revideo, use Track B tools, create final delivery, or unlock production/beta/broad real media.

Artifacts are written only under:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-render-hardening/phase45c/<runId>/`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45c/<runId>/`
