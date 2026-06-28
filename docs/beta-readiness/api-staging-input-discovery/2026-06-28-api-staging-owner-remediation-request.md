# API Staging Owner Remediation Request - 2026-06-28

Decision: `beta_readiness_api_staging_owner_remediation_request_passed_ready_for_owner_iam_runtime_service_account_action`

This packet turns the exact-input validation failure into the smallest owner action set needed before the staging API deploy workflow can safely run. It is metadata only. It does not mutate IAM, create service accounts, deploy Cloud Run, build or push images, call evidence collectors, run tools, process media, write Supabase/GCS, enable external beta, or enable paid production.

Current supersession note: later read-only owner prerequisite audits proved Cloud Run deploy permissions already pass, so Cloud Run role mutation is no longer part of the active remediation set. The current owner command packet and repaired workflow use only Artifact Registry writer, runtime service-account creation/confirmation, deployer act-as-runtime, deployer metadata-only fixed secret viewer, and runtime fixed secret accessor.

## Source Evidence

- Exact validation run: [28309751101](https://github.com/yuzastudio6-cyber/Reedkt/actions/runs/28309751101)
- Exact validation decision: `beta_readiness_api_staging_exact_input_validation_blocked_by_artifact_registry_get_and_runtime_service_account`
- Workflow support PR: #1374
- Source-truth blocker PR: #1375

The run proved the deployer identity exists, but it could not read `projects/reeditpro/locations/us-central1/repositories/reeditpro-staging-workers`, and `reeditpro-api-staging@reeditpro.iam.gserviceaccount.com` does not exist.

## Owner Actions

The owner should grant or confirm Artifact Registry repository access for the repo-configured GCP service account:

```bash
gcloud artifacts repositories add-iam-policy-binding reeditpro-staging-workers \
  --project=reeditpro \
  --location=us-central1 \
  --member=serviceAccount:<repo-configured-gcp-service-account> \
  --role=roles/artifactregistry.writer
```

The owner should create or select the staging API runtime service account:

```bash
gcloud iam service-accounts create reeditpro-api-staging \
  --project=reeditpro \
  --display-name='ReEditPro API staging runtime'
```

The owner should allow the deployer to use that runtime service account:

```bash
gcloud iam service-accounts add-iam-policy-binding reeditpro-api-staging@reeditpro.iam.gserviceaccount.com \
  --project=reeditpro \
  --member=serviceAccount:<repo-configured-gcp-service-account> \
  --role=roles/iam.serviceAccountUser
```

The owner should allow the deployer to describe only the fixed staging API Secret Manager entries without granting secret payload access:

```bash
for secret in <fixed-staging-api-secret-name-1> <fixed-staging-api-secret-name-2> <fixed-staging-api-secret-name-3> <fixed-staging-api-secret-name-4>; do
  gcloud secrets add-iam-policy-binding "$secret" \
    --project=reeditpro \
    --member=serviceAccount:<repo-configured-gcp-service-account> \
    --role=roles/secretmanager.viewer
done
```

The owner should allow the runtime service account to read only the deploy workflow's bound fixed Secret Manager names:

```bash
for secret in <fixed-staging-api-secret-name-1> <fixed-staging-api-secret-name-2> <fixed-staging-api-secret-name-3> <fixed-staging-api-secret-name-4>; do
  gcloud secrets add-iam-policy-binding "$secret" \
    --project=reeditpro \
    --member=serviceAccount:reeditpro-api-staging@reeditpro.iam.gserviceaccount.com \
    --role=roles/secretmanager.secretAccessor
done
```

If the owner has narrower custom roles for staging deploy, they can use those instead of broad predefined roles, as long as the read-only prerequisite audit and guarded deploy workflow requirements pass. Do not add a Cloud Run project role from this packet unless a later audit contradicts the proven Cloud Run deploy permissions.

## Post-Remediation Validation

After owner action, rerun exact read-only validation:

```bash
gh workflow run beta-readiness-api-staging-input-discovery.yml \
  --repo yuzastudio6-cyber/Reedkt \
  --ref codex/reeditpro-web-ui-shell \
  --field confirm_staging_api_input_discovery=READ_STAGING_BETA_API_DEPLOY_INPUTS \
  --field artifact_region=us-central1 \
  --field artifact_repository=reeditpro-staging-workers \
  --field deployer_service_account=<repo-configured-gcp-service-account> \
  --field runtime_service_account=reeditpro-api-staging@reeditpro.iam.gserviceaccount.com \
  --field service_name=reeditpro-api-staging
```

Only after exact validation passes should the guarded staging deploy workflow be dispatched.

Supabase classification remains `no write / environment none / SQL none / migration no`.

Product-ready local OSS count remains `0`.
