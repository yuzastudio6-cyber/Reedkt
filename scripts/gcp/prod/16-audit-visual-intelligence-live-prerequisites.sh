#!/usr/bin/env bash
set -euo pipefail

# Read-only operator audit for the WeEditPro Visual Intelligence and SAM 3.1
# cloud foundation. This script never reads a secret payload, creates a job,
# enables an API, downloads a model, builds an image, or mutates billing.

PROJECT_ID='reeditpro'
REGION='us-central1'
ARTIFACT_REPOSITORY='reeditpro-workers'
IMAGE_URI='us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu'
TRACK_ALL_L4_TASK_QA_IMAGE_URI='us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-track-all-l4-task-qa'
IMAGE_BUILDER_SERVICE_ACCOUNT='reeditpro-image-builder-sa@reeditpro.iam.gserviceaccount.com'
IMAGE_SIGNER_SERVICE_ACCOUNT='reeditpro-image-signer-sa@reeditpro.iam.gserviceaccount.com'
GPU_WORKER_SERVICE_ACCOUNT='reeditpro-gpu-worker-sa@reeditpro.iam.gserviceaccount.com'
API_SERVICE_ACCOUNT='reeditpro-api-sa@reeditpro.iam.gserviceaccount.com'
IMAGE_SIGNING_KEY_RING='weeditpro-image-signing'
IMAGE_SIGNING_KEY='sam31-image-signing'
MODEL_ARTIFACT_BUCKET='reeditpro-production-reeditpro-model-artifacts'
IMAGE_BUILD_INPUT_BUCKET='reeditpro-production-reeditpro-image-build-inputs'
IMAGE_SUPPLY_CHAIN_EVIDENCE_BUCKET='reeditpro-production-reeditpro-image-supply-chain-evidence'
CONTROL_PLANE_STATE_BUCKET='reeditpro-production-reeditpro-control-plane-state'
MASK_BUCKET='reeditpro-production-reeditpro-masks'
PRIVATE_SEARCH_SERVICE='reeditpro-staging-private-searxng'
PRIVATE_SEARCH_IDENTITY='reeditpro-private-search-sa@reeditpro.iam.gserviceaccount.com'
PRIVATE_SEARCH_IMAGE='us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-private-searxng@sha256:7f56a77c442601d249389e4cb4101da2046fd62c04818c69eabf8caa7f6957ee'
A100_QUOTA_PREFERENCE_ID='reeditpro-a100-80gb-us-central1-1'
readonly -a LEGACY_CPU_PROCESSING_IDENTITIES=(
  'reeditpro-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  'reeditpro-stg-render-sa@reeditpro.iam.gserviceaccount.com'
  'reeditpro-stg-qa-sa@reeditpro.iam.gserviceaccount.com'
  'reeditpro-stg-tool-ready-sa@reeditpro.iam.gserviceaccount.com'
)

command -v gcloud >/dev/null
command -v jq >/dev/null

PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')"
CLOUD_BUILD_SERVICE_AGENT="service-${PROJECT_NUMBER}@gcp-sa-cloudbuild.iam.gserviceaccount.com"

configured_project="$(gcloud config get-value project --quiet)"
if [[ "${configured_project}" != "${PROJECT_ID}" ]]; then
  printf 'Configured project must be %s, observed %s.\n' \
    "${PROJECT_ID}" "${configured_project}" >&2
  exit 2
fi
if [[ ! "${PROJECT_NUMBER}" =~ ^[0-9]+$ ]]; then
  printf 'Could not resolve the numeric project identity for %s.\n' \
    "${PROJECT_ID}" >&2
  exit 2
fi

read_json_or_empty() {
  if ! "$@" 2>/dev/null; then
    printf '{}\n'
  fi
}

policy_has_member_role() {
  local policy_json="$1"
  local role="$2"
  local member="$3"
  if jq -e \
    --arg role "${role}" \
    --arg member "${member}" \
    'any(.bindings[]?; .role == $role and any(.members[]?; . == $member))' \
    <<<"${policy_json}" >/dev/null; then
    printf 'true\n'
  else
    printf 'false\n'
  fi
}

service_account_observation() {
  local email="$1"
  local metadata
  metadata="$(read_json_or_empty gcloud iam service-accounts describe \
    "${email}" --project="${PROJECT_ID}" --format=json)"
  jq -n \
    --arg email "${email}" \
    --argjson metadata "${metadata}" \
    '{
      email: $email,
      exists: ($metadata.email == $email),
      enabled: ($metadata.email == $email and (($metadata.disabled // false) == false)),
      ready: ($metadata.email == $email and (($metadata.disabled // false) == false))
    }'
}

retired_service_account_observation() {
  local email="$1"
  local metadata
  metadata="$(read_json_or_empty gcloud iam service-accounts describe \
    "${email}" --project="${PROJECT_ID}" --format=json)"
  jq -n \
    --arg email "${email}" \
    --argjson metadata "${metadata}" \
    '{
      email: $email,
      exists: ($metadata.email == $email),
      disabled: ($metadata.email == $email and (($metadata.disabled // false) == true)),
      retired: ($metadata.email != $email or (($metadata.disabled // false) == true))
    }'
}

bucket_observation() {
  local bucket_name="$1"
  local metadata
  metadata="$(read_json_or_empty gcloud storage buckets describe \
    "gs://${bucket_name}" --project="${PROJECT_ID}" --format=json)"
  jq -n \
    --arg bucketName "${bucket_name}" \
    --arg expectedLocation "${REGION}" \
    --argjson metadata "${metadata}" \
    '{
      bucketName: $bucketName,
      exists: ($metadata.name == $bucketName),
      location: ($metadata.location // null),
      uniformBucketLevelAccess: ($metadata.uniform_bucket_level_access == true),
      publicAccessPreventionEnforced: ($metadata.public_access_prevention == "enforced"),
      ready: (
        $metadata.name == $bucketName
        and (($metadata.location // "") | ascii_downcase) == ($expectedLocation | ascii_downcase)
        and $metadata.uniform_bucket_level_access == true
        and $metadata.public_access_prevention == "enforced"
      )
    }'
}

quota_json="$(
  gcloud compute regions describe "${REGION}" \
    --project="${PROJECT_ID}" \
    --format='json(quotas)'
)"
a100_limit="$(jq -r '[.quotas[] | select(.metric == "NVIDIA_A100_80GB_GPUS") | .limit] | first // 0' <<<"${quota_json}")"
l4_limit="$(jq -r '[.quotas[] | select(.metric == "NVIDIA_L4_GPUS") | .limit] | first // 0' <<<"${quota_json}")"
a100_quota_preference_metadata="$(read_json_or_empty \
  gcloud beta quotas preferences describe "${A100_QUOTA_PREFERENCE_ID}" \
  --project="${PROJECT_ID}" --format=json)"
a100_quota_preference="$(jq -n \
  --arg preferenceId "${A100_QUOTA_PREFERENCE_ID}" \
  --arg expectedName "projects/${PROJECT_ID}/locations/global/quotaPreferences/${A100_QUOTA_PREFERENCE_ID}" \
  --arg expectedRegion "${REGION}" \
  --argjson metadata "${a100_quota_preference_metadata}" \
  'def number_or_zero: (tonumber? // 0);
  (($metadata.quotaConfig.preferredValue // "0") | number_or_zero) as $preferred
  | (($metadata.quotaConfig.grantedValue // "0") | number_or_zero) as $granted
  | (($metadata.quotaConfig.stateDetail // "") | tostring) as $stateDetail
  | (($metadata.reconciling // false) == true) as $reconciling
  | {
      preferenceId: $preferenceId,
      exists: ($metadata.name == $expectedName),
      region: ($metadata.dimensions.region // null),
      preferredValue: $preferred,
      grantedValue: $granted,
      reconciling: $reconciling,
      stateDetail: (if $stateDetail == "" then null else $stateDetail end),
      disposition: (
        if $metadata.name != $expectedName then "not_found"
        elif ($metadata.dimensions.region // "") != $expectedRegion then "scope_mismatch"
        elif $granted >= 1 then "granted"
        elif $reconciling then "pending"
        elif ($stateDetail | ascii_downcase | contains("denied")) then "denied"
        else "not_granted"
        end
      ),
      capacityGranted: (
        $metadata.name == $expectedName
        and ($metadata.dimensions.region // "") == $expectedRegion
        and $granted >= 1
      )
    }')"

enabled_secret_version_count() {
  local secret_name="$1"
  {
    gcloud secrets versions list "${secret_name}" \
      --project="${PROJECT_ID}" \
      --filter='state=ENABLED' \
      --format='value(name)' 2>/dev/null || true
  } | sed '/^[[:space:]]*$/d' | wc -l | tr -d ' '
}

hugging_face_token_versions="$(enabled_secret_version_count 'HUGGINGFACE_TOKEN')"
model_weight_token_versions="$(enabled_secret_version_count 'MODEL_WEIGHT_ACCESS_TOKEN')"

required_services=(
  'aiplatform.googleapis.com'
  'artifactregistry.googleapis.com'
  'batch.googleapis.com'
  'binaryauthorization.googleapis.com'
  'cloudbilling.googleapis.com'
  'cloudbuild.googleapis.com'
  'cloudkms.googleapis.com'
  'cloudtasks.googleapis.com'
  'compute.googleapis.com'
  'containeranalysis.googleapis.com'
  'containerscanning.googleapis.com'
  'eventarc.googleapis.com'
  'iam.googleapis.com'
  'iamcredentials.googleapis.com'
  'logging.googleapis.com'
  'monitoring.googleapis.com'
  'pubsub.googleapis.com'
  'run.googleapis.com'
  'secretmanager.googleapis.com'
  'serviceusage.googleapis.com'
  'storage.googleapis.com'
)
enabled_services="$(
  gcloud services list --enabled \
    --project="${PROJECT_ID}" \
    --format='value(config.name)'
)"

billing_account_resource="$(
  gcloud billing projects describe "${PROJECT_ID}" \
    --format='value(billingAccountName)' 2>/dev/null || true
)"
account_pricing_json="$(
  WEEDITPRO_BILLING_ACCOUNT_RESOURCE_NAME="${billing_account_resource}" \
    node scripts/gcp/prod/read-visual-intelligence-account-price-readiness.mjs
)"
missing_services=()
for service in "${required_services[@]}"; do
  if ! grep -Fxq "${service}" <<<"${enabled_services}"; then
    missing_services+=("${service}")
  fi
done

active_run_job_names="$(
  gcloud run jobs list \
    --project="${PROJECT_ID}" \
    --region="${REGION}" \
    --format='value(metadata.name)'
)"
legacy_jobs="$(
  awk 'BEGIN { IGNORECASE=1 } /qwen|sam2|phase39c/ { count += 1 } END { print count + 0 }' \
    <<<"${active_run_job_names}"
)"
readonly -a legacy_cpu_runtime_job_names=(
  'reeditpro-sound-audio-metadata-worker'
  'reeditpro-sound-cpu-analysis-worker'
  'reeditpro-staging-cpu-analysis-job'
  'reeditpro-staging-deepfilternet-runtime-job'
  'reeditpro-staging-film-runtime-job'
  'reeditpro-staging-final-render-hardening-job'
  'reeditpro-staging-libass-burnin-validation-job'
  'reeditpro-staging-pro-color-image-runtime-job'
  'reeditpro-staging-qa-job'
  'reeditpro-staging-remotion-render-validation-job'
  'reeditpro-staging-render-job'
  'reeditpro-staging-speech-runtime-job'
  'reeditpro-staging-tool-readiness-job'
  'reeditpro-stg-deepfilternet-runtime-phase36h'
  'reeditpro-stg-signalsmith-controlled-runtime-phase36j'
)
legacy_cpu_runtime_jobs=0
for job_name in "${legacy_cpu_runtime_job_names[@]}"; do
  if grep -Fxq "${job_name}" <<<"${active_run_job_names}"; then
    legacy_cpu_runtime_jobs=$((legacy_cpu_runtime_jobs + 1))
  fi
done

private_search_service_metadata="$(read_json_or_empty gcloud run services describe \
  "${PRIVATE_SEARCH_SERVICE}" --project="${PROJECT_ID}" --region="${REGION}" \
  --format=json)"
private_search_service_policy="$(read_json_or_empty gcloud run services get-iam-policy \
  "${PRIVATE_SEARCH_SERVICE}" --project="${PROJECT_ID}" --region="${REGION}" \
  --format=json)"
private_search_identity="$(service_account_observation "${PRIVATE_SEARCH_IDENTITY}")"
if jq -e 'any(.bindings[]?.members[]?;
  . == "allUsers" or . == "allAuthenticatedUsers")' \
  <<<"${private_search_service_policy}" >/dev/null; then
  private_search_public_invoker=true
else
  private_search_public_invoker=false
fi
private_search_control_plane="$(jq -n \
  --arg serviceName "${PRIVATE_SEARCH_SERVICE}" \
  --arg serviceIdentity "${PRIVATE_SEARCH_IDENTITY}" \
  --arg image "${PRIVATE_SEARCH_IMAGE}" \
  --argjson metadata "${private_search_service_metadata}" \
  --argjson identity "${private_search_identity}" \
  --argjson publicInvoker "${private_search_public_invoker}" \
  '{
    serviceName: $serviceName,
    exists: ($metadata.metadata.name == $serviceName),
    serviceIdentity: ($metadata.spec.template.spec.serviceAccountName // null),
    expectedServiceIdentity: $serviceIdentity,
    identity: $identity,
    immutableImage: ($metadata.spec.template.spec.containers[0].image // null),
    exactImageRetained: ($metadata.spec.template.spec.containers[0].image == $image),
    cpu: ($metadata.spec.template.spec.containers[0].resources.limits.cpu // null),
    memory: ($metadata.spec.template.spec.containers[0].resources.limits.memory // null),
    gpu: ($metadata.spec.template.spec.containers[0].resources.limits["nvidia.com/gpu"] // "0"),
    minimumInstances: ($metadata.spec.template.metadata.annotations["autoscaling.knative.dev/minScale"] // "0"),
    maximumInstances: ($metadata.spec.template.metadata.annotations["autoscaling.knative.dev/maxScale"] // null),
    publicInvoker: $publicInvoker,
    substantiveMediaOrModelProcessingAllowed: false,
    ready: (
      $metadata.metadata.name == $serviceName
      and $metadata.spec.template.spec.serviceAccountName == $serviceIdentity
      and $identity.ready
      and $metadata.spec.template.spec.containers[0].image == $image
      and $metadata.spec.template.spec.containers[0].resources.limits.cpu == "1"
      and $metadata.spec.template.spec.containers[0].resources.limits.memory == "1Gi"
      and (($metadata.spec.template.spec.containers[0].resources.limits["nvidia.com/gpu"] // "0") == "0")
      and (($metadata.spec.template.metadata.annotations["autoscaling.knative.dev/minScale"] // "0") == "0")
      and $metadata.spec.template.metadata.annotations["autoscaling.knative.dev/maxScale"] == "1"
      and ($publicInvoker | not)
    )
  }')"
legacy_cpu_identity_observations='[]'
for identity in "${LEGACY_CPU_PROCESSING_IDENTITIES[@]}"; do
  observation="$(retired_service_account_observation "${identity}")"
  legacy_cpu_identity_observations="$(jq -n \
    --argjson observations "${legacy_cpu_identity_observations}" \
    --argjson observation "${observation}" \
    '$observations + [$observation]')"
done
legacy_cpu_identities_retired="$(jq -r \
  'length == 5 and all(.[]; .retired)' \
  <<<"${legacy_cpu_identity_observations}")"
legacy_services="$(
  gcloud run services list \
    --project="${PROJECT_ID}" \
    --region="${REGION}" \
    --format='value(metadata.name)' \
    | awk 'BEGIN { IGNORECASE=1 } /qwen|sam2|phase39c/ { count += 1 } END { print count + 0 }'
)"

sam31_image_count="$(
  {
    gcloud artifacts docker images list "${IMAGE_URI}" \
      --project="${PROJECT_ID}" \
      --include-tags \
      --format='value(version)' 2>/dev/null || true
  } | sed '/^[[:space:]]*$/d' | wc -l | tr -d ' '
)"
track_all_l4_task_qa_image_count="$(
  {
    gcloud artifacts docker images list "${TRACK_ALL_L4_TASK_QA_IMAGE_URI}" \
      --project="${PROJECT_ID}" \
      --include-tags \
      --format='value(version)' 2>/dev/null || true
  } | sed '/^[[:space:]]*$/d' | wc -l | tr -d ' '
)"

missing_services_json="$(
  if ((${#missing_services[@]} == 0)); then
    printf '[]\n'
  else
    printf '%s\n' "${missing_services[@]}" \
      | jq -Rsc 'split("\n") | map(select(length > 0))'
  fi
)"

image_builder_identity="$(service_account_observation "${IMAGE_BUILDER_SERVICE_ACCOUNT}")"
image_signer_identity="$(service_account_observation "${IMAGE_SIGNER_SERVICE_ACCOUNT}")"
gpu_worker_identity="$(service_account_observation "${GPU_WORKER_SERVICE_ACCOUNT}")"

model_artifact_bucket="$(bucket_observation "${MODEL_ARTIFACT_BUCKET}")"
image_build_input_bucket="$(bucket_observation "${IMAGE_BUILD_INPUT_BUCKET}")"
image_supply_chain_evidence_bucket="$(bucket_observation "${IMAGE_SUPPLY_CHAIN_EVIDENCE_BUCKET}")"
control_plane_state_bucket="$(bucket_observation "${CONTROL_PLANE_STATE_BUCKET}")"
mask_bucket="$(bucket_observation "${MASK_BUCKET}")"

repository_metadata="$(read_json_or_empty gcloud artifacts repositories describe \
  "${ARTIFACT_REPOSITORY}" --project="${PROJECT_ID}" \
  --location="${REGION}" --format=json)"
repository_policy="$(read_json_or_empty gcloud artifacts repositories get-iam-policy \
  "${ARTIFACT_REPOSITORY}" --project="${PROJECT_ID}" \
  --location="${REGION}" --format=json)"
image_builder_repository_writer="$(policy_has_member_role \
  "${repository_policy}" 'roles/artifactregistry.writer' \
  "serviceAccount:${IMAGE_BUILDER_SERVICE_ACCOUNT}")"
image_signer_repository_writer="$(policy_has_member_role \
  "${repository_policy}" 'roles/artifactregistry.writer' \
  "serviceAccount:${IMAGE_SIGNER_SERVICE_ACCOUNT}")"
api_repository_reader="$(policy_has_member_role \
  "${repository_policy}" 'roles/artifactregistry.reader' \
  "serviceAccount:${API_SERVICE_ACCOUNT}")"
gpu_worker_repository_reader="$(policy_has_member_role \
  "${repository_policy}" 'roles/artifactregistry.reader' \
  "serviceAccount:${GPU_WORKER_SERVICE_ACCOUNT}")"

model_artifact_bucket_policy="$(read_json_or_empty gcloud storage buckets get-iam-policy \
  "gs://${MODEL_ARTIFACT_BUCKET}" --project="${PROJECT_ID}" --format=json)"
image_build_input_bucket_policy="$(read_json_or_empty gcloud storage buckets get-iam-policy \
  "gs://${IMAGE_BUILD_INPUT_BUCKET}" --project="${PROJECT_ID}" --format=json)"
image_supply_chain_evidence_bucket_policy="$(read_json_or_empty gcloud storage buckets get-iam-policy \
  "gs://${IMAGE_SUPPLY_CHAIN_EVIDENCE_BUCKET}" --project="${PROJECT_ID}" --format=json)"
control_plane_state_bucket_policy="$(read_json_or_empty gcloud storage buckets get-iam-policy \
  "gs://${CONTROL_PLANE_STATE_BUCKET}" --project="${PROJECT_ID}" --format=json)"
mask_bucket_policy="$(read_json_or_empty gcloud storage buckets get-iam-policy \
  "gs://${MASK_BUCKET}" --project="${PROJECT_ID}" --format=json)"
gpu_worker_model_artifact_reader="$(policy_has_member_role \
  "${model_artifact_bucket_policy}" 'roles/storage.objectViewer' \
  "serviceAccount:${GPU_WORKER_SERVICE_ACCOUNT}")"
image_builder_build_input_reader="$(policy_has_member_role \
  "${image_build_input_bucket_policy}" 'roles/storage.objectViewer' \
  "serviceAccount:${IMAGE_BUILDER_SERVICE_ACCOUNT}")"
api_build_input_creator="$(policy_has_member_role \
  "${image_build_input_bucket_policy}" 'roles/storage.objectCreator' \
  "serviceAccount:${API_SERVICE_ACCOUNT}")"
api_build_input_reader="$(policy_has_member_role \
  "${image_build_input_bucket_policy}" 'roles/storage.objectViewer' \
  "serviceAccount:${API_SERVICE_ACCOUNT}")"
image_signer_supply_chain_evidence_creator="$(policy_has_member_role \
  "${image_supply_chain_evidence_bucket_policy}" 'roles/storage.objectCreator' \
  "serviceAccount:${IMAGE_SIGNER_SERVICE_ACCOUNT}")"
api_supply_chain_evidence_reader="$(policy_has_member_role \
  "${image_supply_chain_evidence_bucket_policy}" 'roles/storage.objectViewer' \
  "serviceAccount:${API_SERVICE_ACCOUNT}")"
api_control_plane_creator="$(policy_has_member_role \
  "${control_plane_state_bucket_policy}" 'roles/storage.objectCreator' \
  "serviceAccount:${API_SERVICE_ACCOUNT}")"
api_control_plane_reader="$(policy_has_member_role \
  "${control_plane_state_bucket_policy}" 'roles/storage.objectViewer' \
  "serviceAccount:${API_SERVICE_ACCOUNT}")"
gpu_worker_mask_reader="$(policy_has_member_role \
  "${mask_bucket_policy}" 'roles/storage.objectViewer' \
  "serviceAccount:${GPU_WORKER_SERVICE_ACCOUNT}")"
gpu_worker_mask_creator="$(policy_has_member_role \
  "${mask_bucket_policy}" 'roles/storage.objectCreator' \
  "serviceAccount:${GPU_WORKER_SERVICE_ACCOUNT}")"
api_mask_reader="$(policy_has_member_role \
  "${mask_bucket_policy}" 'roles/storage.objectViewer' \
  "serviceAccount:${API_SERVICE_ACCOUNT}")"
api_mask_creator="$(policy_has_member_role \
  "${mask_bucket_policy}" 'roles/storage.objectCreator' \
  "serviceAccount:${API_SERVICE_ACCOUNT}")"

signing_key_metadata="$(read_json_or_empty gcloud kms keys describe \
  "${IMAGE_SIGNING_KEY}" --project="${PROJECT_ID}" --location="${REGION}" \
  --keyring="${IMAGE_SIGNING_KEY_RING}" --format=json)"
signing_key_versions="$(read_json_or_empty gcloud kms keys versions list \
  --key="${IMAGE_SIGNING_KEY}" --project="${PROJECT_ID}" \
  --location="${REGION}" --keyring="${IMAGE_SIGNING_KEY_RING}" \
  --filter='state=ENABLED' --format=json)"
signing_key_policy="$(read_json_or_empty gcloud kms keys get-iam-policy \
  "${IMAGE_SIGNING_KEY}" --project="${PROJECT_ID}" --location="${REGION}" \
  --keyring="${IMAGE_SIGNING_KEY_RING}" --format=json)"
image_signer_key_access="$(policy_has_member_role \
  "${signing_key_policy}" 'roles/cloudkms.signerVerifier' \
  "serviceAccount:${IMAGE_SIGNER_SERVICE_ACCOUNT}")"

image_builder_policy="$(read_json_or_empty gcloud iam service-accounts get-iam-policy \
  "${IMAGE_BUILDER_SERVICE_ACCOUNT}" --project="${PROJECT_ID}" --format=json)"
image_signer_policy="$(read_json_or_empty gcloud iam service-accounts get-iam-policy \
  "${IMAGE_SIGNER_SERVICE_ACCOUNT}" --project="${PROJECT_ID}" --format=json)"
cloud_build_can_use_builder="$(policy_has_member_role \
  "${image_builder_policy}" 'roles/iam.serviceAccountTokenCreator' \
  "serviceAccount:${CLOUD_BUILD_SERVICE_AGENT}")"
cloud_build_can_use_signer="$(policy_has_member_role \
  "${image_signer_policy}" 'roles/iam.serviceAccountTokenCreator' \
  "serviceAccount:${CLOUD_BUILD_SERVICE_AGENT}")"

artifact_repository="$(jq -n \
  --arg expectedName "projects/${PROJECT_ID}/locations/${REGION}/repositories/${ARTIFACT_REPOSITORY}" \
  --argjson metadata "${repository_metadata}" \
  --argjson imageBuilderWriter "${image_builder_repository_writer}" \
  --argjson imageSignerWriter "${image_signer_repository_writer}" \
  --argjson apiReader "${api_repository_reader}" \
  --argjson gpuReader "${gpu_worker_repository_reader}" \
  '{
    resourceName: ($metadata.name // null),
    exists: ($metadata.name == $expectedName),
    dockerStandardRepository: (
      $metadata.format == "DOCKER"
      and $metadata.mode == "STANDARD_REPOSITORY"
    ),
    vulnerabilityScanningActive: (
      $metadata.vulnerabilityScanningConfig.enablementState == "SCANNING_ACTIVE"
    ),
    imageBuilderWriter: $imageBuilderWriter,
    imageSignerWriter: $imageSignerWriter,
    apiSupplyChainReader: $apiReader,
    gpuWorkerImageReader: $gpuReader,
    ready: (
      $metadata.name == $expectedName
      and $metadata.format == "DOCKER"
      and $metadata.mode == "STANDARD_REPOSITORY"
      and $metadata.vulnerabilityScanningConfig.enablementState == "SCANNING_ACTIVE"
      and $imageBuilderWriter
      and $imageSignerWriter
      and $apiReader
      and $gpuReader
    )
  }')"

signing_key="$(jq -n \
  --arg expectedName "projects/${PROJECT_ID}/locations/${REGION}/keyRings/${IMAGE_SIGNING_KEY_RING}/cryptoKeys/${IMAGE_SIGNING_KEY}" \
  --argjson metadata "${signing_key_metadata}" \
  --argjson versions "${signing_key_versions}" \
  --argjson signerAccess "${image_signer_key_access}" \
  '($versions | if type == "array" then . else [] end) as $enabledVersions
  | ([$enabledVersions[]? | select(
      .state == "ENABLED"
      and .algorithm == "EC_SIGN_P256_SHA256"
      and .protectionLevel == "HSM"
    )]) as $eligibleVersions
  | {
    resourceName: ($metadata.name // null),
    exists: ($metadata.name == $expectedName),
    purpose: ($metadata.purpose // null),
    enabledVersionCount: ($enabledVersions | length),
    eligibleHsmP256VersionCount: ($eligibleVersions | length),
    eligibleHsmP256VersionResources: ($eligibleVersions | map(.name)),
    imageSignerCanSignAndVerify: $signerAccess,
    ready: (
      $metadata.name == $expectedName
      and $metadata.purpose == "ASYMMETRIC_SIGN"
      and $metadata.versionTemplate.algorithm == "EC_SIGN_P256_SHA256"
      and $metadata.versionTemplate.protectionLevel == "HSM"
      and ($eligibleVersions | length) >= 1
      and $signerAccess
    )
  }')"

jq -n \
  --arg audit 'weeditpro-visual-intelligence-live-prerequisites-v8' \
  --arg projectId "${PROJECT_ID}" \
  --arg region "${REGION}" \
  --argjson a100Limit "${a100_limit}" \
  --argjson l4Limit "${l4_limit}" \
  --argjson a100QuotaPreference "${a100_quota_preference}" \
  --argjson huggingFaceTokenEnabledVersions "${hugging_face_token_versions}" \
  --argjson modelWeightTokenEnabledVersions "${model_weight_token_versions}" \
  --argjson missingServices "${missing_services_json}" \
  --argjson legacyVisualJobs "${legacy_jobs}" \
  --argjson legacyVisualServices "${legacy_services}" \
  --argjson legacyCpuMediaRuntimeJobs "${legacy_cpu_runtime_jobs}" \
  --argjson privateSearchControlPlane "${private_search_control_plane}" \
  --argjson legacyCpuIdentityObservations "${legacy_cpu_identity_observations}" \
  --argjson legacyCpuIdentitiesRetired "${legacy_cpu_identities_retired}" \
  --argjson sam31ImageCount "${sam31_image_count}" \
  --argjson trackAllL4TaskQaImageCount "${track_all_l4_task_qa_image_count}" \
  --argjson accountPricing "${account_pricing_json}" \
  --argjson imageBuilderIdentity "${image_builder_identity}" \
  --argjson imageSignerIdentity "${image_signer_identity}" \
  --argjson gpuWorkerIdentity "${gpu_worker_identity}" \
  --argjson modelArtifactBucket "${model_artifact_bucket}" \
  --argjson imageBuildInputBucket "${image_build_input_bucket}" \
  --argjson imageSupplyChainEvidenceBucket "${image_supply_chain_evidence_bucket}" \
  --argjson controlPlaneStateBucket "${control_plane_state_bucket}" \
  --argjson maskBucket "${mask_bucket}" \
  --argjson gpuWorkerModelArtifactReader "${gpu_worker_model_artifact_reader}" \
  --argjson imageBuilderBuildInputReader "${image_builder_build_input_reader}" \
  --argjson apiBuildInputCreator "${api_build_input_creator}" \
  --argjson apiBuildInputReader "${api_build_input_reader}" \
  --argjson imageSignerSupplyChainEvidenceCreator "${image_signer_supply_chain_evidence_creator}" \
  --argjson apiSupplyChainEvidenceReader "${api_supply_chain_evidence_reader}" \
  --argjson apiControlPlaneCreator "${api_control_plane_creator}" \
  --argjson apiControlPlaneReader "${api_control_plane_reader}" \
  --argjson gpuWorkerMaskReader "${gpu_worker_mask_reader}" \
  --argjson gpuWorkerMaskCreator "${gpu_worker_mask_creator}" \
  --argjson apiMaskReader "${api_mask_reader}" \
  --argjson apiMaskCreator "${api_mask_creator}" \
  --argjson artifactRepository "${artifact_repository}" \
  --argjson signingKey "${signing_key}" \
  --argjson cloudBuildCanUseBuilder "${cloud_build_can_use_builder}" \
  --argjson cloudBuildCanUseSigner "${cloud_build_can_use_signer}" \
  '{
    audit: $audit,
    projectId: $projectId,
    region: $region,
    gpuQuota: {
      nvidiaA10080Gb: $a100Limit,
      nvidiaL4: $l4Limit,
      a100QuotaPreference: $a100QuotaPreference,
      capacityPrerequisitesReady: ($a100Limit >= 1 and $l4Limit >= 1)
    },
    privateArtifactAccess: {
      huggingFaceTokenEnabledVersions: $huggingFaceTokenEnabledVersions,
      modelWeightTokenEnabledVersions: $modelWeightTokenEnabledVersions,
      ready: ($huggingFaceTokenEnabledVersions >= 1 and $modelWeightTokenEnabledVersions >= 1)
    },
    cloudApis: {
      missing: $missingServices,
      ready: ($missingServices | length == 0)
    },
    serviceIdentities: {
      imageBuilder: $imageBuilderIdentity,
      imageSigner: $imageSignerIdentity,
      gpuWorker: $gpuWorkerIdentity,
      cloudBuildCanUseImageBuilder: $cloudBuildCanUseBuilder,
      cloudBuildCanUseImageSigner: $cloudBuildCanUseSigner,
      ready: (
        $imageBuilderIdentity.ready
        and $imageSignerIdentity.ready
        and $gpuWorkerIdentity.ready
        and $cloudBuildCanUseBuilder
        and $cloudBuildCanUseSigner
      )
    },
    privateBuckets: {
      modelArtifacts: $modelArtifactBucket,
      imageBuildInputs: $imageBuildInputBucket,
      imageSupplyChainEvidence: $imageSupplyChainEvidenceBucket,
      controlPlaneState: $controlPlaneStateBucket,
      access: {
        gpuWorkerModelArtifactReader: $gpuWorkerModelArtifactReader,
        imageBuilderBuildInputReader: $imageBuilderBuildInputReader,
        apiBuildInputCreator: $apiBuildInputCreator,
        apiBuildInputReader: $apiBuildInputReader,
        imageSignerSupplyChainEvidenceCreator: $imageSignerSupplyChainEvidenceCreator,
        apiSupplyChainEvidenceReader: $apiSupplyChainEvidenceReader,
        apiControlPlaneCreator: $apiControlPlaneCreator,
        apiControlPlaneReader: $apiControlPlaneReader
      },
      ready: (
        $modelArtifactBucket.ready
        and $imageBuildInputBucket.ready
        and $imageSupplyChainEvidenceBucket.ready
        and $controlPlaneStateBucket.ready
        and $gpuWorkerModelArtifactReader
        and $imageBuilderBuildInputReader
        and $apiBuildInputCreator
        and $apiBuildInputReader
        and $imageSignerSupplyChainEvidenceCreator
        and $apiSupplyChainEvidenceReader
        and $apiControlPlaneCreator
        and $apiControlPlaneReader
      )
    },
    artifactRepository: $artifactRepository,
    imageSigningKey: $signingKey,
    trackAllMaskQaPrivateObjectTransport: {
      bucket: $maskBucket,
      gpuWorkerObjectReader: $gpuWorkerMaskReader,
      gpuWorkerObjectCreator: $gpuWorkerMaskCreator,
      apiObjectReader: $apiMaskReader,
      apiObjectCreator: $apiMaskCreator,
      mountPath: "/mnt/reeditpro",
      ready: (
        $maskBucket.ready
        and $gpuWorkerMaskReader
        and $gpuWorkerMaskCreator
        and $apiMaskReader
        and $apiMaskCreator
      )
    },
    retiredLegacyVisualRuntime: {
      matchingJobs: $legacyVisualJobs,
      matchingServices: $legacyVisualServices,
      clean: ($legacyVisualJobs == 0 and $legacyVisualServices == 0)
    },
    retiredLegacyCpuMediaRuntime: {
      fixedAllowlistCount: 15,
      matchingJobs: $legacyCpuMediaRuntimeJobs,
      clean: ($legacyCpuMediaRuntimeJobs == 0)
    },
    privateSearchControlPlaneIdentityIsolation: {
      privateSearch: $privateSearchControlPlane,
      legacyIdentityAllowlistCount: 5,
      legacyIdentities: $legacyCpuIdentityObservations,
      legacyIdentitiesRetired: $legacyCpuIdentitiesRetired,
      clean: ($privateSearchControlPlane.ready and $legacyCpuIdentitiesRetired)
    },
    immutableSam31ImagesObserved: $sam31ImageCount,
    immutableTrackAllL4TaskQaImagesObserved: $trackAllL4TaskQaImageCount,
    immutableGpuWorkerImageSetReady: (
      $sam31ImageCount >= 1 and $trackAllL4TaskQaImageCount >= 1
    ),
    accountEffectiveGeminiPricing: $accountPricing,
    sourceCheckpointCompatibilityReceiptObserved: false,
    imageSupplyChainReleaseObserved: false,
    liveGeminiQualificationObserved: false,
    liveGpuQualificationObserved: false,
    customerCreditsMutated: false,
    productionReady: false
  }'
