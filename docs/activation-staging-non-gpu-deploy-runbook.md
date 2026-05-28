# Activation Staging Non-GPU Deploy Runbook

Phase 24B deploys the staging API service and non-GPU Cloud Run jobs only after
Artifact Registry push and digest evidence exists.

Phase 24B must not deploy GPU, run provider calls, download model weights,
process real user media, mount zero-version secrets, expose external beta, or
mark production ready.

Required guards:

- `GCP_PROJECT_ID=reeditpro`
- `GCP_REGION=us-central1`
- `REEDITPRO_ENV=staging`
- `REEDITPRO_IMAGE_TAG=staging-local-001`
- `REEDITPRO_CONFIRM_STAGING_DEPLOY=true`

Deploy targets:

- service `reeditpro-staging-api`
- jobs `reeditpro-staging-tool-readiness-job`,
  `reeditpro-staging-cpu-analysis-job`, `reeditpro-staging-qa-job`, and
  `reeditpro-staging-render-job`

Before deployment, every pushed image must include a `linux/amd64` manifest.
If the pushed images are Apple Silicon `linux/arm64` only, stop and rebuild the
images for `linux/amd64` or multi-arch with `linux/amd64`.
