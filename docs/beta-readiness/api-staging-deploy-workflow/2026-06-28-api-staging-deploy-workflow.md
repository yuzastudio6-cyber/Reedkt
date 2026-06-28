# API Staging Deploy Workflow - 2026-06-28

Decision: `beta_readiness_api_staging_deploy_workflow_passed_ready_for_manual_operator_dispatch`

This packet adds a guarded manual GitHub Actions workflow for the staging API deployment gap. It does not run the workflow, deploy Cloud Run, read secrets, call the deployed backend, record evidence, enable external beta, enable real-user-media beta, enable paid production, or change product-ready status.

PR #1360 landed the same workflow path on the repository default branch `codex/reeditpro-web-ui-shell` at `363a5b69d0b09e296b4471593776b3bca0a6a871`, so `gh workflow view beta-readiness-api-staging-deploy.yml --repo yuzastudio6-cyber/Reedkt --yaml` now succeeds. Operators must dispatch the workflow from the default branch while supplying the tools source ref `codex/sound-music-audio-1abc-checkpoint` and exact deployed source SHA.

## Workflow

- Path: `.github/workflows/beta-readiness-api-staging-deploy.yml`
- Trigger: `workflow_dispatch` only
- Required confirmation: `DEPLOY_STAGING_BETA_READINESS_API`
- Staging service name: `reeditpro-api-staging`
- Runtime env: `REEDITPRO_ENV=staging`
- Access: `--no-allow-unauthenticated`
- API image template: `<artifact_region>-docker.pkg.dev/<project_id>/<artifact_repository>/reeditpro-api:<image_tag>`

The workflow requires an exact source SHA, immutable image tag, artifact region, artifact repository, Workload Identity deployer service account, Cloud Run runtime service account, and the staging service name. It rejects `latest` image tags and keeps the service name locked to `reeditpro-api-staging`.

Secret Manager bindings are by name only:

- `SUPABASE_URL=SUPABASE_URL:latest`
- `SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest`
- `PROVIDER_GATEWAY_SHARED_SECRET=PROVIDER_GATEWAY_SHARED_SECRET:latest`
- `WORKER_WEBHOOK_SECRET=WORKER_WEBHOOK_SECRET:latest`

## Next Safe Action

An authorized operator can manually dispatch the workflow after confirming the deployer service account, runtime service account, Artifact Registry repository, and source SHA. After it finishes, run `npm run beta:readiness:api-deployment-preflight` with the deployed staging URL and matching source SHA before any deployed evidence collector.

## Boundaries

External beta remains blocked until the deployed evidence collector and final operator-status readback pass. Real-user-media beta and paid production remain separate later gates. Public launch claims remain blocked until final operator status proves the exact scope.

Supabase classification remains `no write / environment none / SQL none / migration no`.
