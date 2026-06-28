# Production Beta Readiness Runbook

Internal dry-run testing may use static reports and generated mock artifacts. Local-dev fixture testing may use generated fixtures only when explicitly enabled and safe.

Real user media beta requires human approval for deployment, storage, security, cost controls, retention/deletion, model weights, licenses, monitoring, and support.

External beta and paid production remain blocked by default in M17.

## Tools Evidence Handoff

After the local accepted evidence snapshot passes, operators must first deploy or verify the staging API service, then run `npm run beta:readiness:api-deployment-preflight`. The guarded manual workflow `.github/workflows/beta-readiness-api-staging-deploy.yml` is the source-controlled staging deploy path for this step: it runs only through `workflow_dispatch`, requires `DEPLOY_STAGING_BETA_READINESS_API`, locks the service to `reeditpro-api-staging`, rejects `latest` image tags, uses Workload Identity, binds Secret Manager names only, and keeps `--no-allow-unauthenticated`. The preflight verifies the API URL, deployed source SHA, API image, service account, staging-only environment, and Secret Manager binding confirmations without running `gcloud` or touching the deployed backend.

After the API deployment preflight passes, operators must run `npm run beta:readiness:deployed-evidence-input-manifest` before any deployed evidence collector. The manifest binds the operator-supplied deployed source SHA, 14 accepted tool IDs, libass container image, staging-only platform packet, launch owner approvals, and separate idempotency keys into one no-network readiness check.

Only after that manifest, platform evidence preflight, launch approval preflight, and deployed operator inputs all pass should `npm run beta:readiness:external-beta-evidence-collector` be used against staging. That collector records evidence and then requires final operator-status readback; it still does not approve real-user-media beta or paid production.
