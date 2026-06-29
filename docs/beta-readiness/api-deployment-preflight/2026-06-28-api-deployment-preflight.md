# API Deployment Preflight - 2026-06-28

Decision: `beta_readiness_api_deployment_preflight_blocked_missing_staging_api_deployment_inputs`

Current status: historical. The current-source `d997d567d40853f59741763c8e9ca8b2c361148a` API deployment preflight is now recorded in `docs/beta-readiness/api-deployment-preflight/2026-06-28-d997-api-deployment-preflight-passed.md` with decision `beta_readiness_api_deployment_preflight_passed_ready_for_deployed_evidence_input_manifest`.

The 14-tool local accepted evidence snapshot is ready for deployed evidence recording, but the deployed beta-readiness API service is not yet proven/configured in this source truth.

Live GitHub readback found repository variables for `GCP_PROJECT_ID`, `GCP_REGION`, render-canary URLs, and `STAGING_SUPABASE_PROJECT_REF`. It did not find a beta-readiness API base URL, deployed source SHA, API image tag/repository inputs, or API service account inputs. The original preflight checkout had no `.github/workflows` directory and no GitHub deployment records were returned.

A later source-truth packet adds `.github/workflows/beta-readiness-api-staging-deploy.yml` as a guarded manual staging deploy path. That workflow must be manually dispatched with the exact confirmation phrase and immutable source SHA/image tag before this preflight can pass against a deployed staging URL.

## Required Next Gate

Use the guarded manual staging deploy workflow, or an equivalent owner-approved staging deploy path, to create or verify the staging API first. Then run `npm run beta:readiness:api-deployment-preflight` and `npm run beta:readiness:source-freshness-preflight` with the staging API deployment inputs before any deployed evidence collector. Both must pass before:

- `npm run beta:readiness:source-freshness-preflight`
- `npm run beta:readiness:deployed-evidence-input-manifest`
- `npm run beta:readiness:external-beta-evidence-collector`
- `npm run beta:readiness:operator-status-api`

## Boundaries

This phase did not run `gcloud`, deploy Cloud Run, build images, read secrets, call the deployed backend, record evidence, write Supabase, write GCS, dispatch workers, call providers, process media, enable external beta, enable real-user-media beta, or enable paid production.

Supabase classification remains `no write / environment none / SQL none / migration no`.
