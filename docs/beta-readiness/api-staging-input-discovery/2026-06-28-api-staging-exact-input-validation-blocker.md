# API Staging Exact Input Validation Blocker - 2026-06-28

Decision: `beta_readiness_api_staging_exact_input_validation_blocked_by_artifact_registry_get_and_runtime_service_account`

This packet records the first read-only exact-input validation run after PR #1374 added targeted probes to the default-branch workflow. It does not deploy Cloud Run, build or push Docker images, mutate IAM, create service accounts, call evidence collectors, run tools, process media, write Supabase/GCS, enable external beta, enable paid production, or change product-ready status.

## Source Evidence

- Tools source SHA: `a5cf6d10ac0f23027cac524291dbbafa6e5af10d`
- Default workflow PR: #1374
- Default workflow merge SHA: `02e1b325f4c62c0e0d92d95d948aaab2052a57e6`
- Exact validation run: [28309751101](https://github.com/yuzastudio6-cyber/Reedkt/actions/runs/28309751101)
- Mode: `read_only_staging_api_exact_input_validation`

The run confirmed Workload Identity auth and setup-gcloud still pass. It also confirmed the exact deployer service account configured in the repository is describable, while the exact Artifact Registry repository and proposed runtime service account are not yet deploy-ready.

## Exact Input Results

Inputs supplied:

- Artifact Registry region: `us-central1`
- Artifact Registry repository: `reeditpro-staging-workers`
- Runtime service account candidate: `reeditpro-api-staging@reeditpro.iam.gserviceaccount.com`
- Service name: `reeditpro-api-staging`

Required exact probe failures:

- `exactArtifactRepository`: `artifactregistry.repositories.get` denied on `projects/reeditpro/locations/us-central1/repositories/reeditpro-staging-workers`
- `exactRuntimeServiceAccount`: `reeditpro-api-staging@reeditpro.iam.gserviceaccount.com` returned `NOT_FOUND`

Non-blocking observations:

- Exact deployer service account describe passed.
- Broad Artifact Registry and service-account list permissions remain denied, as expected from the prior source-truth run.
- Cloud Run service listing still passes and observes `reeditpro-staging-render-canary`.
- `reeditpro-api-staging` does not exist yet, but that is not a required input-validation blocker because a later approved deploy may create the service.

## Blocked Action

Only this action remains blocked:

`staging_api_deploy_until_artifact_registry_repository_access_and_runtime_service_account_are_proven`

This is not a blanket beta-readiness blocker. Source reviews, diagnostics, owner approval packets, exact read-only validation, and other bounded blocker-reduction work remain safe.

## Next Safe Action

The owner should:

- grant or confirm Artifact Registry repository access for `projects/reeditpro/locations/us-central1/repositories/reeditpro-staging-workers`, including read access now and deploy/push permissions before dispatching deploy;
- create or select the staging API runtime service account, preferably `reeditpro-api-staging@reeditpro.iam.gserviceaccount.com` if that remains the approved convention;
- rerun `beta-readiness-api-staging-input-discovery.yml` with exact inputs before dispatching `beta-readiness-api-staging-deploy.yml`.

Supabase classification remains `no write / environment none / SQL none / migration no`.

Product-ready local OSS count remains `0`.
