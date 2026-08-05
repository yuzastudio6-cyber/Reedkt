#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/gcloud-common.sh
source "${SCRIPT_DIR}/lib/gcloud-common.sh"

# Requires REEDITPRO_CONFIRM_PROD_SETUP=true through confirm_prod_action.
confirm_prod_action

grant_project_role() {
  local account_id="$1"
  local role="$2"
  run_gcloud projects add-iam-policy-binding "${GCP_PROJECT_ID}" \
    --member="serviceAccount:$(service_account_email "${account_id}")" \
    --role="${role}" \
    --condition=None \
    --quiet
}

grant_bucket_role() {
  local purpose="$1"
  local account_id="$2"
  local role="$3"
  run_gcloud storage buckets add-iam-policy-binding "gs://$(bucket_name "${purpose}")" \
    --project="${GCP_PROJECT_ID}" \
    --member="serviceAccount:$(service_account_email "${account_id}")" \
    --role="${role}" \
    --quiet
}

grant_cloud_build_source_bucket_role() {
  local account_id="$1"
  local role="$2"
  run_gcloud storage buckets add-iam-policy-binding \
    "gs://${GCP_PROJECT_ID}_cloudbuild" \
    --project="${GCP_PROJECT_ID}" \
    --member="serviceAccount:$(service_account_email "${account_id}")" \
    --role="${role}" \
    --quiet
}

grant_secret_access() {
  local secret_name="$1"
  local account_id="$2"
  run_gcloud secrets add-iam-policy-binding "${secret_name}" \
    --project="${GCP_PROJECT_ID}" \
    --member="serviceAccount:$(service_account_email "${account_id}")" \
    --role="roles/secretmanager.secretAccessor" \
    --condition=None \
    --quiet
}

grant_service_account_user() {
  local target_account_id="$1"
  local member_account_id="$2"
  run_gcloud iam service-accounts add-iam-policy-binding \
    "$(service_account_email "${target_account_id}")" \
    --project="${GCP_PROJECT_ID}" \
    --member="serviceAccount:$(service_account_email "${member_account_id}")" \
    --role="roles/iam.serviceAccountUser" \
    --condition=None \
    --quiet
}

grant_artifact_repository_role() {
  local account_id="$1"
  local role="$2"
  run_gcloud artifacts repositories add-iam-policy-binding \
    "${REEDITPRO_ARTIFACT_REPOSITORY}" \
    --project="${GCP_PROJECT_ID}" \
    --location="${GCP_ARTIFACT_REGION}" \
    --member="serviceAccount:$(service_account_email "${account_id}")" \
    --role="${role}" \
    --condition=None \
    --quiet
}

grant_cloud_build_service_agent_token_creator() {
  local target_account_id="$1"
  local project_number
  project_number="$(gcloud projects describe "${GCP_PROJECT_ID}" --format='value(projectNumber)')"
  if [[ ! "${project_number}" =~ ^[0-9]+$ ]]; then
    echo "ERROR: unable to resolve the Cloud Build project number." >&2
    exit 1
  fi
  run_gcloud iam service-accounts add-iam-policy-binding \
    "$(service_account_email "${target_account_id}")" \
    --project="${GCP_PROJECT_ID}" \
    --member="serviceAccount:service-${project_number}@gcp-sa-cloudbuild.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountTokenCreator" \
    --condition=None \
    --quiet
}

grant_image_signing_key_role() {
  local account_id="$1"
  local role="$2"
  run_gcloud kms keys add-iam-policy-binding \
    "${REEDITPRO_IMAGE_SIGNING_KEY}" \
    --project="${GCP_PROJECT_ID}" \
    --location="${GCP_ARTIFACT_REGION}" \
    --keyring="${REEDITPRO_IMAGE_SIGNING_KEY_RING}" \
    --member="serviceAccount:$(service_account_email "${account_id}")" \
    --role="${role}" \
    --condition=None \
    --quiet
}

for account_id in \
  "${REEDITPRO_API_SERVICE_ACCOUNT}" \
  "${REEDITPRO_IMAGE_BUILDER_SERVICE_ACCOUNT}" \
  "${REEDITPRO_IMAGE_SIGNER_SERVICE_ACCOUNT}" \
  "${REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT}"; do
  grant_project_role "${account_id}" roles/logging.logWriter
  grant_project_role "${account_id}" roles/monitoring.metricWriter
done

grant_project_role "${REEDITPRO_API_SERVICE_ACCOUNT}" roles/run.invoker
grant_project_role "${REEDITPRO_API_SERVICE_ACCOUNT}" roles/batch.jobsEditor
grant_project_role "${REEDITPRO_API_SERVICE_ACCOUNT}" roles/cloudbuild.builds.editor
grant_project_role "${REEDITPRO_API_SERVICE_ACCOUNT}" roles/containeranalysis.occurrences.viewer
grant_project_role "${REEDITPRO_API_SERVICE_ACCOUNT}" roles/aiplatform.user
grant_service_account_user \
  "${REEDITPRO_IMAGE_BUILDER_SERVICE_ACCOUNT}" \
  "${REEDITPRO_API_SERVICE_ACCOUNT}"
grant_service_account_user \
  "${REEDITPRO_IMAGE_SIGNER_SERVICE_ACCOUNT}" \
  "${REEDITPRO_API_SERVICE_ACCOUNT}"
grant_cloud_build_service_agent_token_creator \
  "${REEDITPRO_IMAGE_BUILDER_SERVICE_ACCOUNT}"
grant_cloud_build_service_agent_token_creator \
  "${REEDITPRO_IMAGE_SIGNER_SERVICE_ACCOUNT}"
grant_service_account_user \
  "${REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT}" \
  "${REEDITPRO_API_SERVICE_ACCOUNT}"

for secret_name in \
  "${REEDITPRO_SECRET_PREFIX}-supabase-url" \
  "${REEDITPRO_SECRET_PREFIX}-supabase-anon-key" \
  "${REEDITPRO_SECRET_PREFIX}-supabase-service-role-key" \
  "${REEDITPRO_SECRET_PREFIX}-api-internal-service-token"; do
  grant_secret_access "${secret_name}" "${REEDITPRO_API_SERVICE_ACCOUNT}"
done

grant_bucket_role source-media "${REEDITPRO_API_SERVICE_ACCOUNT}" roles/storage.objectViewer
grant_bucket_role previews "${REEDITPRO_API_SERVICE_ACCOUNT}" roles/storage.objectViewer
grant_bucket_role final-exports "${REEDITPRO_API_SERVICE_ACCOUNT}" roles/storage.objectViewer
grant_bucket_role masks "${REEDITPRO_API_SERVICE_ACCOUNT}" roles/storage.objectCreator
grant_bucket_role masks "${REEDITPRO_API_SERVICE_ACCOUNT}" roles/storage.objectViewer
grant_bucket_role control-plane-state "${REEDITPRO_API_SERVICE_ACCOUNT}" roles/storage.objectCreator
grant_bucket_role control-plane-state "${REEDITPRO_API_SERVICE_ACCOUNT}" roles/storage.objectViewer
grant_bucket_role image-build-inputs "${REEDITPRO_API_SERVICE_ACCOUNT}" roles/storage.objectCreator
grant_bucket_role image-build-inputs "${REEDITPRO_API_SERVICE_ACCOUNT}" roles/storage.objectViewer

grant_bucket_role image-build-inputs "${REEDITPRO_IMAGE_BUILDER_SERVICE_ACCOUNT}" roles/storage.objectViewer
grant_bucket_role image-build-inputs "${REEDITPRO_IMAGE_BUILDER_SERVICE_ACCOUNT}" roles/storage.objectCreator
grant_cloud_build_source_bucket_role \
  "${REEDITPRO_IMAGE_BUILDER_SERVICE_ACCOUNT}" roles/storage.objectViewer
grant_artifact_repository_role "${REEDITPRO_IMAGE_BUILDER_SERVICE_ACCOUNT}" roles/artifactregistry.writer
# The dedicated signer uploads only the digest-bound cosign OCI signature and
# attestation referrers into this one repository. Artifact Registry has no
# predefined append-only referrer role, so repository-scoped writer is the
# narrowest predefined role that can perform signing without project admin or
# artifact-removal policy authority.
grant_artifact_repository_role "${REEDITPRO_IMAGE_SIGNER_SERVICE_ACCOUNT}" roles/artifactregistry.writer
grant_bucket_role image-supply-chain-evidence "${REEDITPRO_IMAGE_SIGNER_SERVICE_ACCOUNT}" roles/storage.objectCreator
grant_bucket_role image-supply-chain-evidence "${REEDITPRO_API_SERVICE_ACCOUNT}" roles/storage.objectViewer
grant_artifact_repository_role "${REEDITPRO_API_SERVICE_ACCOUNT}" roles/artifactregistry.reader
grant_artifact_repository_role "${REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT}" roles/artifactregistry.reader
grant_image_signing_key_role \
  "${REEDITPRO_IMAGE_SIGNER_SERVICE_ACCOUNT}" \
  roles/cloudkms.signerVerifier
# Cosign must read the asymmetric-key algorithm before asking KMS to sign.
# Scope metadata read to this one key; it grants no key mutation or signing.
grant_image_signing_key_role \
  "${REEDITPRO_IMAGE_SIGNER_SERVICE_ACCOUNT}" \
  roles/cloudkms.viewer

for purpose in \
  source-media proxy-media worker-temp model-artifacts generated-assets masks \
  transcripts analysis-artifacts previews final-exports qa-artifacts; do
  grant_bucket_role "${purpose}" "${REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT}" roles/storage.objectViewer
done
for purpose in \
  proxy-media transcripts masks generated-assets analysis-artifacts \
  worker-temp previews final-exports qa-artifacts; do
  grant_bucket_role "${purpose}" "${REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT}" roles/storage.objectCreator
done
