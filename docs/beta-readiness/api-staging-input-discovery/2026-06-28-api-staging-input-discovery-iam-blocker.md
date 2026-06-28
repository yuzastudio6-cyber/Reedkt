# API Staging Input Discovery IAM Blocker - 2026-06-28

Decision: `beta_readiness_api_staging_input_discovery_blocked_by_wif_read_only_iam`

This packet records the guarded default-branch read-only staging input discovery run for the beta API deploy lane. It does not deploy Cloud Run, build or push images, run Docker, run tools, process media, call deployed evidence collectors, write Supabase/GCS, enable external beta, enable paid production, or change product-ready status.

## Source Evidence

- Tools source SHA: `9fee82aeba313dd238e3de75c8137ce4f11a07c6`
- Default branch workflow: `.github/workflows/beta-readiness-api-staging-input-discovery.yml`
- Default branch: `codex/reeditpro-web-ui-shell`
- Workflow PRs: #1365 added the read-only discovery workflow, #1369 changed it to report all probe statuses before failing.
- Latest run: [28309436736](https://github.com/yuzastudio6-cyber/Reedkt/actions/runs/28309436736), head `acd5e423fdb5308a7c92b1cb794d7a823f03e44d`, conclusion `failure`

The workflow confirmation gate passed, Workload Identity auth succeeded, and setup-gcloud succeeded. The failure happened only in read-only discovery probes.

## Probe Results

Failed probes:

- `artifactRepositoriesUsCentral1`: missing `artifactregistry.repositories.list` on `projects/reeditpro/locations/us-central1`
- `artifactRepositoriesUsEast1`: missing `artifactregistry.repositories.list` on `projects/reeditpro/locations/us-east1`
- `serviceAccounts`: missing `iam.serviceAccounts.list` on `projects/reeditpro`

Passing probe:

- `cloudRunServices`: Cloud Run service listing succeeded for `us-east1` and observed `reeditpro-staging-render-canary`.

## Blocked Action

The blocked action is only:

`staging_api_deploy_until_owner_approved_artifact_registry_and_service_account_inputs_are_proven`

This is not a blanket blocker. Bounded source reviews, diagnostics, read-only discovery, owner approval packets, and exact input collection remain safe forward progress.

## Next Safe Action

The project owner should either grant the GitHub Actions WIF/deployer identity read-only discovery permissions for the selected staging locations, or provide exact owner-approved values for:

- Artifact Registry region
- Artifact Registry repository
- deployer service account
- runtime API service account

After that, rerun:

```bash
gh workflow run beta-readiness-api-staging-input-discovery.yml --repo yuzastudio6-cyber/Reedkt --ref codex/reeditpro-web-ui-shell --field confirm_staging_api_input_discovery=READ_STAGING_BETA_API_DEPLOY_INPUTS
```

Only after read-only discovery or owner-supplied inputs prove the staging values should operators dispatch `beta-readiness-api-staging-deploy.yml`.

## Boundaries

Blocked scopes remain: Cloud Run deploy, Docker build, Artifact Registry push, evidence collectors, external beta, and paid production.

Supabase classification remains `no write / environment none / SQL none / migration no`.

Product-ready local OSS count remains `0`.
