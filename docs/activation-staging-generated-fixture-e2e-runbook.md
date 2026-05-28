# Activation Staging Generated-Fixture E2E Runbook

Phase 25 validates the staging API, private GCS buckets, and deployed non-GPU
Cloud Run jobs with generated fixture media only.

It does not use real user media, providers, model weights, GPU jobs, public
access, secret values, or production paths.

## Guardrails

- `GCP_PROJECT_ID` must be `reeditpro`.
- `REEDITPRO_ENV` must be `staging`.
- Real execution requires `REEDITPRO_CONFIRM_STAGING_E2E=true`.
- Fixture paths must stay under `activation-fixtures/phase25/<run-id>/`.
- GPU remains deferred and must not be deployed or executed.
- Production, external beta, and real user media testing remain blocked.

## Flow

1. Verify gcloud auth, project, API service, non-GPU jobs, and staging buckets.
2. Run an authenticated API `/health` check.
3. Generate a tiny synthetic MP4 fixture locally.
4. Upload it to the private source-media staging bucket.
5. Execute tool-readiness, CPU, render, and QA jobs in order.
6. Verify private artifacts and write a concise report.
7. Remove local temp media while retaining private GCS artifacts for debugging.

Use `npm.cmd run activation:staging:fixture-e2e -- --mode report` to summarize
the latest run evidence.
