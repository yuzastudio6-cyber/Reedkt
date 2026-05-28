# Activation BiRefNet Runtime Runbook

Phase 33C verifies `ZhengPeng7/BiRefNet` runtime loading in staging. It uses the
Phase 33B private model snapshot only and runs one generated synthetic image.

Execution requires:

- `GCP_PROJECT_ID=reeditpro`
- `GCP_REGION=us-central1`
- `REEDITPRO_ENV=staging`
- `REEDITPRO_CONFIRM_BIREFNET_RUNTIME=true`
- image tag `staging-birefnet-runtime-001`

The runtime must copy model files from:

`gs://reeditpro-staging-reeditpro-generated-assets/model-weights/birefnet/main/`

and verify revision `e2bf8e4460fc8fa32bba5ea4d94b3233d367b0e4` plus aggregate
SHA-256 `1e4044aa39d94e3f9c07e2e73d7ff78883c4838e90d678bcb8f3fc075db811e7`.

Outputs remain private under `activation-mask-runtime/phase33c/<runId>/`.

Phase 33C does not process real video, run SAM2, execute text-behind-subject,
call providers, create public URLs, or approve production/external beta/broad
real media.
