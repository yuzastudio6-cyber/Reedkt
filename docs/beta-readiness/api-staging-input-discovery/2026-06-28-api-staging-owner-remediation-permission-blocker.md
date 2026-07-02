# API Staging Owner Remediation Permission Blocker - 2026-06-28

Decision: `beta_readiness_api_staging_owner_remediation_blocked_by_artifact_registry_iam_policy_permission`

The guarded owner-remediation workflow was dispatched once from the default branch workflow at `.github/workflows/beta-readiness-api-staging-owner-remediation.yml`.

- Run: `28310493040`
- URL: `https://github.com/yuzastudio6-cyber/Reedkt/actions/runs/28310493040`
- Workflow head: `e818b5c6cdd200b6e6c06c517f5f2e3f557388f6`
- Result: failed in `Apply staging API IAM and runtime account prerequisites`

WIF authentication and `gcloud` setup succeeded. The first mutation command failed while trying to grant `roles/artifactregistry.writer` on the exact staging repository.

## Exact Blocker

The deployer identity lacks `artifactregistry.repositories.getIamPolicy` on:

`projects/reeditpro/locations/us-central1/repositories/reeditpro-staging-workers`

Because it cannot read the repository IAM policy, it cannot safely add the repository-level writer binding itself. This is not a blanket blocker. It blocks only the unsafe staging API deploy path that depends on repository writer access, runtime service-account readiness, Cloud Run deploy authority, and runtime secret access.

## Safe Forward Lane

A higher-privilege owner or repository IAM admin should apply or confirm the exact staging IAM prerequisites:

- `roles/artifactregistry.writer` for `sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com` on `us-central1/reeditpro-staging-workers`.
- `reeditpro-api-staging@reeditpro.iam.gserviceaccount.com` exists or is created.
- `roles/iam.serviceAccountUser` allows the deployer to act as the staging API runtime service account.
- `roles/run.admin` allows the deployer to update the staging API Cloud Run service.
- `roles/secretmanager.secretAccessor` allows the runtime service account to read only the fixed staging API secret names.

After owner-side remediation, rerun the exact read-only input validation workflow before any staging API deploy.

## Boundaries Preserved

No Cloud Run deploy, Docker build, Artifact Registry push, runtime service-account creation, evidence collector, tool execution, media processing, Supabase/GCS write, external beta, or paid production action completed in this phase.

Supabase classification remains `no write / environment none / SQL none / migration no`.

Product-ready local OSS count remains `0`.
