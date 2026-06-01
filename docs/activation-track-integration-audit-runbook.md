# Phase 47A Track Integration Audit Runbook

Phase 47A is a private JSON-only audit. It does not process media, build images, deploy jobs, or execute providers.

Pre-execution validation:

```sh
npm run smoke:activation-track-integration-audit
npm run activation:track-integration-audit:report
npm run activation:track-integration-audit:iam-plan
npm run activation:track-a-visual-readiness-closure:report
npm run prod:readiness:summary
npm run prod:beta:summary
npm run lint
npm run build
npm run build:server
git diff --check
```

Run available Track B reports:

```sh
npm run activation:audio-system-readiness:report
npm run activation:audio-stack-demucs:report
npm run activation:deepfilternet-feature-e2e:report
npm run activation:ocr-caption-render-qa:report
npm run activation:ocr-runtime:report
npm run activation:ocr-model-download:report
npm run activation:vlm-runtime:report
npm run activation:vlm-runtime:cost-summary
npm run activation:vlm-model-download:report
npm run activation:vlm-model-approval:report
```

Execute once:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_TRACK_INTEGRATION_AUDIT=true \
PROVIDER_EXECUTION_ENABLED=false \
REVIDEO_ENABLED=false \
PUBLIC_ACCESS_ENABLED=false \
FINAL_DELIVERY_ENABLED=false \
MEDIA_PROCESSING_ENABLED=false \
DOCKER_EXECUTION_ENABLED=false \
CLOUD_RUN_EXECUTION_ENABLED=false \
REEDITPRO_PRODUCTION_READY=false \
REEDITPRO_EXTERNAL_BETA_READY=false \
REEDITPRO_PAID_PRODUCTION_READY=false \
REEDITPRO_BROAD_REAL_MEDIA_READY=false \
npm run activation:track-integration-audit -- --execute
```

Expected private outputs:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-track-integration/phase47a/<runId>/integration/integration-readiness-manifest.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-track-integration/phase47a/<runId>/evidence/track-a-evidence.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-track-integration/phase47a/<runId>/evidence/track-b-evidence.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-track-integration/phase47a/<runId>/ownership/ownership-matrix.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-track-integration/phase47a/<runId>/reconciliation/registry-reconciliation.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-track-integration/phase47a/<runId>/reconciliation/docs-reconciliation.json`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-track-integration/phase47a/<runId>/qa/track-integration-audit-qa.json`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-track-integration/phase47a/<runId>/reports/phase47a-report.json`
