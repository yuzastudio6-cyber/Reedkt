# API Deployment Preflight - 2026-06-28

Decision: `beta_readiness_api_deployment_preflight_blocked_missing_staging_api_deployment_inputs`

The 14-tool local accepted evidence snapshot is ready for deployed evidence recording, but the deployed beta-readiness API service is not yet proven/configured in this source truth.

Live GitHub readback found repository variables for `GCP_PROJECT_ID`, `GCP_REGION`, render-canary URLs, and `STAGING_SUPABASE_PROJECT_REF`. It did not find a beta-readiness API base URL, deployed source SHA, API image tag/repository inputs, or API service account inputs. The repository also has no `.github/workflows` directory in this checkout and no GitHub deployment records were returned.

## Required Next Gate

Run `npm run beta:readiness:api-deployment-preflight` with the staging API deployment inputs before any deployed evidence collector. It must pass before:

- `npm run beta:readiness:deployed-evidence-input-manifest`
- `npm run beta:readiness:external-beta-evidence-collector`
- `npm run beta:readiness:operator-status-api`

## Boundaries

This phase did not run `gcloud`, deploy Cloud Run, build images, read secrets, call the deployed backend, record evidence, write Supabase, write GCS, dispatch workers, call providers, process media, enable external beta, enable real-user-media beta, or enable paid production.

Supabase classification remains `no write / environment none / SQL none / migration no`.
