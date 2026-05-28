# Activation GCP Staging Resource Map

All resources are staging resources and are not created by Codex.

## Artifact Registry

- Repository: `reeditpro-staging-workers`
- Format: Docker
- Location: `GCP_ARTIFACT_REGION`

## Buckets

- `reeditpro-staging-${GCP_PROJECT_ID}-source-media`
- `reeditpro-staging-${GCP_PROJECT_ID}-proxy-media`
- `reeditpro-staging-${GCP_PROJECT_ID}-analysis-artifacts`
- `reeditpro-staging-${GCP_PROJECT_ID}-transcripts`
- `reeditpro-staging-${GCP_PROJECT_ID}-masks`
- `reeditpro-staging-${GCP_PROJECT_ID}-generated-assets`
- `reeditpro-staging-${GCP_PROJECT_ID}-previews`
- `reeditpro-staging-${GCP_PROJECT_ID}-final-exports`
- `reeditpro-staging-${GCP_PROJECT_ID}-worker-temp`
- `reeditpro-staging-${GCP_PROJECT_ID}-qa-artifacts`

## Service Accounts

- `reeditpro-staging-api-sa`
- `reeditpro-staging-cpu-worker-sa`
- `reeditpro-staging-gpu-worker-sa`
- `reeditpro-staging-render-worker-sa`
- `reeditpro-staging-qa-worker-sa`
- `reeditpro-staging-tool-readiness-sa`

## Secret Placeholders

Names only: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `PROVIDER_GATEWAY_SHARED_SECRET`, `WORKER_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY`, `SFX_PROVIDER_API_KEY`, `MUSIC_PROVIDER_API_KEY`, `MODEL_WEIGHT_ACCESS_TOKEN`, and `HUGGINGFACE_TOKEN`.

## Cloud Run Names

- `reeditpro-staging-api`
- `reeditpro-staging-cpu-analysis-job`
- `reeditpro-staging-gpu-ai-job`
- `reeditpro-staging-render-job`
- `reeditpro-staging-qa-job`
- `reeditpro-staging-tool-readiness-job`

Phase 22 does not deploy these services or jobs.
