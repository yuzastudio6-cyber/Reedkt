# Phase 45F Track A Visual-Video Readiness Closure Runbook

Phase 45F is an evidence-audit/readiness-closure phase only. It verifies the completed Track A visual-video chain, uploads private JSON readiness artifacts, and marks readiness only for internal private visual-video testing when every mandatory gate passes.

## Inputs

- Phase 45E run: `phase45e-20260531T23580`
- Phase 45E review manifest: `gs://reeditpro-staging-reeditpro-generated-assets/activation-render-hardening/phase45e/phase45e-20260531T23580/review/e2e-review-manifest.json`
- Phase 45E report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45e/phase45e-20260531T23580/reports/phase45e-report.json`
- Canonical private review export: `gs://reeditpro-staging-reeditpro-final-exports/activation-render-hardening/phase45d/phase45d-20260531T22235/review/hardened-review-export.mp4`

## Execution

Default CLI behavior is static/report-only. Execution requires:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_TRACK_A_VISUAL_READINESS_CLOSURE=true \
PROVIDER_EXECUTION_ENABLED=false \
REVIDEO_ENABLED=false \
TRACK_B_TOOLS_ENABLED=false \
PUBLIC_ACCESS_ENABLED=false \
FINAL_DELIVERY_ENABLED=false \
REEDITPRO_PRODUCTION_READY=false \
REEDITPRO_EXTERNAL_BETA_READY=false \
REEDITPRO_PAID_PRODUCTION_READY=false \
REEDITPRO_BROAD_REAL_MEDIA_READY=false \
npm run activation:track-a-visual-readiness-closure -- --execute
```

The runner verifies private GCS evidence and uploads JSON-only closure artifacts. It does not process media, render/export video, run Docker, run Cloud Run, call providers, use Revideo, or use Track B tools.

## Validation

Run the Phase 45F smoke, report, IAM plan, prior Track A reports, production readiness summaries, lint, build, server build, and `git diff --check` before and after execution.
