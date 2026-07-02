# API Staging Owner Remediation Workflow Ready - 2026-06-28

Decision: `beta_readiness_api_staging_owner_remediation_workflow_ready_for_owner_dispatch`

PR #1382 added the guarded default-branch owner-remediation workflow:

`.github/workflows/beta-readiness-api-staging-owner-remediation.yml`

The workflow is ready for owner dispatch only. Codex did not dispatch it in this phase, and no IAM mutation, service-account creation, Cloud Run deploy, Docker build/push, evidence collector, tool execution, media processing, Supabase/GCS write, external beta, or production action ran.

## Locked Scope

- Project: `reeditpro`
- Region: `us-east1`
- Artifact Registry repository: `us-central1/reeditpro-staging-workers`
- Runtime service account: `reeditpro-api-staging@reeditpro.iam.gserviceaccount.com`
- Service name: `reeditpro-api-staging`

The workflow requires both exact confirmations:

- `APPLY_STAGING_BETA_API_OWNER_REMEDIATION`
- `MUTATE_STAGING_IAM_ONLY`

## Owner Dispatch Command

```bash
gh workflow run beta-readiness-api-staging-owner-remediation.yml \
  --repo yuzastudio6-cyber/Reedkt \
  --ref codex/reeditpro-web-ui-shell \
  --field confirm_staging_api_owner_remediation=APPLY_STAGING_BETA_API_OWNER_REMEDIATION \
  --field confirm_iam_mutation_scope=MUTATE_STAGING_IAM_ONLY \
  --field artifact_region=us-central1 \
  --field artifact_repository=reeditpro-staging-workers \
  --field deployer_service_account=<repo-configured-gcp-service-account> \
  --field runtime_service_account=reeditpro-api-staging@reeditpro.iam.gserviceaccount.com \
  --field service_name=reeditpro-api-staging
```

After the owner workflow passes, rerun the exact read-only input validation workflow before dispatching the staging API deploy workflow.

Supabase classification remains `no write / environment none / SQL none / migration no`.

Product-ready local OSS count remains `0`.
