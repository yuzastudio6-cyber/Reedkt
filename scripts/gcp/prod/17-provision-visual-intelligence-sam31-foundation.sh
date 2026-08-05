#!/usr/bin/env bash
set -euo pipefail

# Narrow, idempotent WeEditPro Visual Intelligence / SAM 3.1 foundation.
# It intentionally excludes legacy CPU/render/QA identities and unrelated
# media buckets. It creates no secret version, image, build, GPU job, provider
# request, customer charge, delivery authority, or production release.

readonly PROJECT_ID='reeditpro'
readonly PROJECT_NUMBER='390722338345'
readonly REGION='us-central1'
readonly REPOSITORY='reeditpro-workers'
readonly API_SA='reeditpro-api-sa'
readonly IMAGE_BUILDER_SA='reeditpro-image-builder-sa'
readonly IMAGE_SIGNER_SA='reeditpro-image-signer-sa'
readonly GPU_WORKER_SA='reeditpro-gpu-worker-sa'
readonly KEY_RING='weeditpro-image-signing'
readonly SIGNING_KEY='sam31-image-signing'
readonly CONFIRMATION='provision-weeditpro-sam31-foundation-v1'
readonly CLOUD_BUILD_SERVICE_AGENT="service-${PROJECT_NUMBER}@gcp-sa-cloudbuild.iam.gserviceaccount.com"
readonly CLOUD_BUILD_SOURCE_BUCKET='reeditpro_cloudbuild'

readonly MODEL_ARTIFACT_BUCKET='reeditpro-production-reeditpro-model-artifacts'
readonly IMAGE_BUILD_INPUT_BUCKET='reeditpro-production-reeditpro-image-build-inputs'
readonly IMAGE_EVIDENCE_BUCKET='reeditpro-production-reeditpro-image-supply-chain-evidence'
readonly CONTROL_PLANE_BUCKET='reeditpro-production-reeditpro-control-plane-state'
readonly MASK_BUCKET='reeditpro-production-reeditpro-masks'

main() {
  assert_operator_boundary
  enable_required_api cloudkms.googleapis.com
  enable_required_api binaryauthorization.googleapis.com

  create_service_account \
    "${IMAGE_BUILDER_SA}" \
    'WeEditPro private immutable image builder'
  create_service_account \
    "${IMAGE_SIGNER_SA}" \
    'WeEditPro immutable image signer'
  create_service_account \
    "${GPU_WORKER_SA}" \
    'WeEditPro production A100 and L4 GPU worker'

  create_protected_bucket "${MODEL_ARTIFACT_BUCKET}"
  create_protected_bucket "${IMAGE_BUILD_INPUT_BUCKET}"
  create_protected_bucket "${IMAGE_EVIDENCE_BUCKET}"
  create_protected_bucket "${CONTROL_PLANE_BUCKET}"
  create_protected_bucket "${MASK_BUCKET}"

  create_secret_placeholder HUGGINGFACE_TOKEN
  create_secret_placeholder MODEL_WEIGHT_ACCESS_TOKEN
  create_hsm_signing_key
  configure_least_privilege_iam

  printf '%s\n' '{'
  printf '  "operation":"weeditpro_visual_intelligence_sam31_foundation_v1",\n'
  printf '  "projectId":"%s",\n' "${PROJECT_ID}"
  printf '  "region":"%s",\n' "${REGION}"
  printf '  "serviceIdentityCount":3,\n'
  printf '  "privateBucketCount":5,\n'
  printf '  "secretPlaceholderCount":2,\n'
  printf '  "hsmSigningKeyCreatedOrReread":true,\n'
  printf '  "secretVersionCreated":false,\n'
  printf '  "metaTermsAccepted":false,\n'
  printf '  "imageBuilt":false,\n'
  printf '  "gpuJobStarted":false,\n'
  printf '  "customerCreditsMutated":false,\n'
  printf '  "productionAuthorityGranted":false\n'
  printf '%s\n' '}'
}

assert_operator_boundary() {
  if [[ "${WEEDITPRO_CONFIRM_SAM31_FOUNDATION:-}" != "${CONFIRMATION}" ]]; then
    fail 'exact SAM 3.1 foundation confirmation is missing'
  fi
  local active_project
  active_project="$(gcloud config get-value project 2>/dev/null)"
  if [[ "${active_project}" != "${PROJECT_ID}" ]]; then
    fail 'active gcloud project does not match the fixed project'
  fi
  local observed_number
  observed_number="$(gcloud projects describe "${PROJECT_ID}" \
    --format='value(projectNumber)')"
  if [[ "${observed_number}" != "${PROJECT_NUMBER}" ]]; then
    fail 'GCP project number does not match the reviewed project'
  fi
  if ! gcloud iam service-accounts describe \
    "$(service_account_email "${API_SA}")" \
    --project="${PROJECT_ID}" >/dev/null 2>&1; then
    fail 'the canonical API service identity is unavailable'
  fi
  if ! gcloud artifacts repositories describe "${REPOSITORY}" \
    --project="${PROJECT_ID}" \
    --location="${REGION}" >/dev/null 2>&1; then
    fail 'the reviewed Artifact Registry repository is unavailable'
  fi
}

enable_required_api() {
  local api="$1"
  if gcloud services list --enabled \
    --project="${PROJECT_ID}" \
    --filter="config.name:${api}" \
    --format='value(config.name)' | grep -qx "${api}"; then
    printf 'API already enabled: %s\n' "${api}"
  else
    run_gcloud services enable "${api}" --project="${PROJECT_ID}"
  fi
}

create_service_account() {
  local account_id="$1"
  local display_name="$2"
  local email
  email="$(service_account_email "${account_id}")"
  if gcloud iam service-accounts describe "${email}" \
    --project="${PROJECT_ID}" >/dev/null 2>&1; then
    printf 'Service account already exists: %s\n' "${email}"
  else
    run_gcloud iam service-accounts create "${account_id}" \
      --project="${PROJECT_ID}" \
      --display-name="${display_name}" \
      --description="${display_name}"
  fi
}

create_protected_bucket() {
  local bucket="$1"
  if gcloud storage buckets describe "gs://${bucket}" \
    --project="${PROJECT_ID}" >/dev/null 2>&1; then
    printf 'Bucket already exists: gs://%s\n' "${bucket}"
  else
    run_gcloud storage buckets create "gs://${bucket}" \
      --project="${PROJECT_ID}" \
      --location="${REGION}" \
      --uniform-bucket-level-access \
      --public-access-prevention \
      --default-storage-class=STANDARD
  fi
  run_gcloud storage buckets update "gs://${bucket}" \
    --project="${PROJECT_ID}" \
    --uniform-bucket-level-access \
    --public-access-prevention \
    --update-labels='app=weeditpro,env=production,scope=sam31'
}

create_secret_placeholder() {
  local secret="$1"
  if gcloud secrets describe "${secret}" \
    --project="${PROJECT_ID}" >/dev/null 2>&1; then
    printf 'Secret placeholder already exists: %s\n' "${secret}"
  else
    run_gcloud secrets create "${secret}" \
      --project="${PROJECT_ID}" \
      --replication-policy=automatic \
      --labels='app=weeditpro,env=production,scope=sam31'
  fi
}

create_hsm_signing_key() {
  if gcloud kms keyrings describe "${KEY_RING}" \
    --project="${PROJECT_ID}" \
    --location="${REGION}" >/dev/null 2>&1; then
    printf 'KMS key ring already exists: %s\n' "${KEY_RING}"
  else
    run_gcloud kms keyrings create "${KEY_RING}" \
      --project="${PROJECT_ID}" \
      --location="${REGION}"
  fi
  if gcloud kms keys describe "${SIGNING_KEY}" \
    --project="${PROJECT_ID}" \
    --location="${REGION}" \
    --keyring="${KEY_RING}" >/dev/null 2>&1; then
    printf 'KMS signing key already exists: %s\n' "${SIGNING_KEY}"
  else
    run_gcloud kms keys create "${SIGNING_KEY}" \
      --project="${PROJECT_ID}" \
      --location="${REGION}" \
      --keyring="${KEY_RING}" \
      --purpose=asymmetric-signing \
      --default-algorithm=ec-sign-p256-sha256 \
      --protection-level=hsm
  fi
}

configure_least_privilege_iam() {
  local account
  for account in \
    "${IMAGE_BUILDER_SA}" \
    "${IMAGE_SIGNER_SA}" \
    "${GPU_WORKER_SA}"; do
    grant_project_role "${account}" roles/logging.logWriter
    grant_project_role "${account}" roles/monitoring.metricWriter
  done

  grant_project_role "${API_SA}" roles/batch.jobsEditor
  grant_project_role "${API_SA}" roles/cloudbuild.builds.editor
  grant_project_role \
    "${API_SA}" roles/containeranalysis.occurrences.viewer

  grant_service_account_user "${IMAGE_BUILDER_SA}" "${API_SA}"
  grant_service_account_user "${IMAGE_SIGNER_SA}" "${API_SA}"
  grant_service_account_user "${GPU_WORKER_SA}" "${API_SA}"
  grant_cloud_build_token_creator "${IMAGE_BUILDER_SA}"
  grant_cloud_build_token_creator "${IMAGE_SIGNER_SA}"

  grant_bucket_role \
    "${CONTROL_PLANE_BUCKET}" "${API_SA}" roles/storage.objectCreator
  grant_bucket_role \
    "${CONTROL_PLANE_BUCKET}" "${API_SA}" roles/storage.objectViewer
  grant_bucket_role \
    "${IMAGE_BUILD_INPUT_BUCKET}" "${API_SA}" roles/storage.objectCreator
  grant_bucket_role \
    "${IMAGE_BUILD_INPUT_BUCKET}" "${API_SA}" roles/storage.objectViewer
  grant_bucket_role \
    "${IMAGE_BUILD_INPUT_BUCKET}" \
    "${IMAGE_BUILDER_SA}" roles/storage.objectViewer
  grant_bucket_role \
    "${IMAGE_BUILD_INPUT_BUCKET}" \
    "${IMAGE_BUILDER_SA}" roles/storage.objectCreator
  grant_bucket_role \
    "${CLOUD_BUILD_SOURCE_BUCKET}" \
    "${IMAGE_BUILDER_SA}" roles/storage.objectViewer
  grant_bucket_role \
    "${IMAGE_EVIDENCE_BUCKET}" \
    "${IMAGE_SIGNER_SA}" roles/storage.objectCreator
  grant_bucket_role \
    "${IMAGE_EVIDENCE_BUCKET}" "${API_SA}" roles/storage.objectViewer
  grant_bucket_role \
    "${MODEL_ARTIFACT_BUCKET}" \
    "${GPU_WORKER_SA}" roles/storage.objectViewer
  grant_bucket_role \
    "${MASK_BUCKET}" "${API_SA}" roles/storage.objectCreator
  grant_bucket_role \
    "${MASK_BUCKET}" "${API_SA}" roles/storage.objectViewer
  grant_bucket_role \
    "${MASK_BUCKET}" "${GPU_WORKER_SA}" roles/storage.objectCreator
  grant_bucket_role \
    "${MASK_BUCKET}" "${GPU_WORKER_SA}" roles/storage.objectViewer

  grant_artifact_role \
    "${IMAGE_BUILDER_SA}" roles/artifactregistry.writer
  grant_artifact_role \
    "${IMAGE_SIGNER_SA}" roles/artifactregistry.writer
  grant_artifact_role "${API_SA}" roles/artifactregistry.reader
  grant_artifact_role "${GPU_WORKER_SA}" roles/artifactregistry.reader

  run_gcloud kms keys add-iam-policy-binding "${SIGNING_KEY}" \
    --project="${PROJECT_ID}" \
    --location="${REGION}" \
    --keyring="${KEY_RING}" \
    --member="serviceAccount:$(service_account_email "${IMAGE_SIGNER_SA}")" \
    --role=roles/cloudkms.signerVerifier \
    --condition=None \
    --quiet
  run_gcloud kms keys add-iam-policy-binding "${SIGNING_KEY}" \
    --project="${PROJECT_ID}" \
    --location="${REGION}" \
    --keyring="${KEY_RING}" \
    --member="serviceAccount:$(service_account_email "${IMAGE_SIGNER_SA}")" \
    --role=roles/cloudkms.viewer \
    --condition=None \
    --quiet
}

grant_project_role() {
  local account_id="$1"
  local role="$2"
  run_gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:$(service_account_email "${account_id}")" \
    --role="${role}" \
    --condition=None \
    --quiet
}

grant_bucket_role() {
  local bucket="$1"
  local account_id="$2"
  local role="$3"
  run_gcloud storage buckets add-iam-policy-binding "gs://${bucket}" \
    --project="${PROJECT_ID}" \
    --member="serviceAccount:$(service_account_email "${account_id}")" \
    --role="${role}" \
    --quiet
}

grant_artifact_role() {
  local account_id="$1"
  local role="$2"
  run_gcloud artifacts repositories add-iam-policy-binding "${REPOSITORY}" \
    --project="${PROJECT_ID}" \
    --location="${REGION}" \
    --member="serviceAccount:$(service_account_email "${account_id}")" \
    --role="${role}" \
    --condition=None \
    --quiet
}

grant_service_account_user() {
  local target_account="$1"
  local member_account="$2"
  run_gcloud iam service-accounts add-iam-policy-binding \
    "$(service_account_email "${target_account}")" \
    --project="${PROJECT_ID}" \
    --member="serviceAccount:$(service_account_email "${member_account}")" \
    --role=roles/iam.serviceAccountUser \
    --condition=None \
    --quiet
}

grant_cloud_build_token_creator() {
  local target_account="$1"
  run_gcloud iam service-accounts add-iam-policy-binding \
    "$(service_account_email "${target_account}")" \
    --project="${PROJECT_ID}" \
    --member="serviceAccount:${CLOUD_BUILD_SERVICE_AGENT}" \
    --role=roles/iam.serviceAccountTokenCreator \
    --condition=None \
    --quiet
}

service_account_email() {
  printf '%s@%s.iam.gserviceaccount.com' "$1" "${PROJECT_ID}"
}

run_gcloud() {
  printf '\n+ gcloud'
  printf ' %q' "$@"
  printf '\n'
  gcloud "$@"
}

fail() {
  printf 'ERROR: %s.\n' "$1" >&2
  exit 1
}

main "$@"
