#!/usr/bin/env bash
set -euo pipefail

# Read-only operator audit for the WeEditPro Visual Intelligence and SAM 3.1
# cloud foundation. This script never reads a secret payload, creates a job,
# enables an API, downloads a model, builds an image, or mutates billing.

PROJECT_ID='reeditpro'
REGION='us-central1'
ARTIFACT_REPOSITORY='reeditpro-workers'
IMAGE_URI='us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu'
QUALIFICATION_IMAGE_URI='us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-qualification'
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
SAM31_PRIVATE_ARTIFACT_INGEST_PREFIX="gs://${CONTROL_PLANE_STATE_BUCKET}/private/sam3_1/private-artifact-ingest/v3"
SAM31_IMAGE_SUPPLY_CHAIN_RELEASE_PREFIX="gs://${CONTROL_PLANE_STATE_BUCKET}/private/sam3_1/qualification-image-supply-chain-release/v1/qualified-releases"
MASK_BUCKET='reeditpro-production-reeditpro-masks'
PRIVATE_SEARCH_SERVICE='reeditpro-staging-private-searxng'
PRIVATE_SEARCH_IDENTITY='reeditpro-private-search-sa@reeditpro.iam.gserviceaccount.com'
PRIVATE_SEARCH_IMAGE='us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-private-searxng@sha256:7f56a77c442601d249389e4cb4101da2046fd62c04818c69eabf8caa7f6957ee'
A100_QUOTA_PREFERENCE_ID='reeditpro-a100-80gb-us-central1-1'
VERTEX_A100_QUOTA_PREFERENCE_ID='weeditpro-vertex-a100-80gb-us-central1-1'
VERTEX_A100_QUOTA_ID='CustomModelTrainingA10080GBGPUsPerProjectPerRegion'
readonly -a VERTEX_A100_ROUTE_ARCHITECTURE_SOURCE_BINDINGS=(
  '7e1db29add1cdb9b14760322899614b046cdc99733055e28003bfd3082716cb3|server/services/canonical-sam3_1-source-checkpoint-qualification-vertex-runtime.ts'
  '7c0e862d3a8a2cb6a9a0de25e866acb18a52af873c9b4763aab483eccdbb6d04|server/services/canonical-sam3_1-source-checkpoint-qualification-vertex-runtime-repository.ts'
  '86c50ad418cb8fe89b1bbb601203e8f4c16c9a5452ab236d37abe40ffd1928db|server/services/canonical-sam3_1-source-checkpoint-qualification-vertex-launch-port.ts'
  'bd733a8c308ec0c89f4654cb2300f9debab66fe6d9d41e7e8f94d64c1c48a509|server/services/canonical-sam3_1-source-checkpoint-qualification-vertex-terminal-reconciliation.ts'
  '19534cd84230a9991b3011feef8fbedca1bd532409d21e98899f13b9a805ffc4|server/tool-cost-metering/canonical-a100-vertex-attempt-cost-authority.ts'
  '0cd836d80f101e723e4fe7e7d18ef84cced34b4a843a469566c3c81cd0adef14|server/smoke/canonical-sam3_1-source-checkpoint-qualification-vertex-runtime-smoke.ts'
  'baf12ad5139b1f78ad75a02e261501e48701e559b1631653a3661e6f64e527f7|server/cli/canonical-sam3_1-source-checkpoint-qualification-vertex-operator.ts'
  '12f2ae01e9d0ceb8ba0d6853845b4bab8b513b030c1b24b95fcfd551b7fb73c6|server/cli/start-canonical-sam3_1-source-checkpoint-qualification-vertex.ts'
  '6bdcf10f1cb7c76c980c9fee23d625fdc224f7b0fec85796a4a4c339a6c0a77e|server/cli/reconcile-canonical-sam3_1-source-checkpoint-qualification-vertex.ts'
  'a406645710420cc1c726b94d4731b7d13f54c33190e15ce49d2fb3fdb8e374ae|server/smoke/canonical-sam3_1-source-checkpoint-qualification-vertex-operator-smoke.ts'
)
readonly -a A100_CAPACITY_CANDIDATE_REGIONS=(
  'us-central1'
  'us-east4'
  'us-east5'
)
readonly -a A100_CAPACITY_CANDIDATE_PREFERENCE_IDS=(
  'reeditpro-a100-80gb-us-central1-1'
  'weeditpro-a100-80gb-us-east4-1'
  'weeditpro-a100-80gb-us-east5-1'
)
A100_QUALIFICATION_SERVICE_ACCOUNT='weeditpro-sam31-qual-sa@reeditpro.iam.gserviceaccount.com'
A100_QUALIFICATION_BUCKET='reeditpro-production-sam31-qualification-private'
A100_QUALIFICATION_KEY_RING='weeditpro-private-artifacts'
A100_QUALIFICATION_KEY='sam31-qualification'
A100_QUALIFICATION_INSTANCE_TEMPLATE='weeditpro-sam31-qualification-a100-v1'
A100_QUALIFICATION_NETWORK='weeditpro-gpu-private'
A100_QUALIFICATION_SUBNET='weeditpro-gpu-private-us-central1'
A100_QUALIFICATION_SUBNET_CIDR='10.42.0.0/24'
A100_QUALIFICATION_BATCH_IMAGE_PROJECT='batch-custom-image'
A100_QUALIFICATION_BATCH_IMAGE='batch-debian-11-official-20260730-00-p01'
A100_QUALIFICATION_BATCH_IMAGE_ID='2466381682817372572'
readonly -a LEGACY_CPU_PROCESSING_IDENTITIES=(
  'reeditpro-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  'reeditpro-stg-render-sa@reeditpro.iam.gserviceaccount.com'
  'reeditpro-stg-qa-sa@reeditpro.iam.gserviceaccount.com'
  'reeditpro-stg-tool-ready-sa@reeditpro.iam.gserviceaccount.com'
)

command -v gcloud >/dev/null
command -v jq >/dev/null
observed_at="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"

sha256_file() {
  local path="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "${path}" | awk '{print $1}'
  else
    shasum -a 256 "${path}" | awk '{print $1}'
  fi
}

PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')"
CLOUD_BUILD_SERVICE_AGENT="service-${PROJECT_NUMBER}@gcp-sa-cloudbuild.iam.gserviceaccount.com"
STORAGE_SERVICE_AGENT="service-${PROJECT_NUMBER}@gs-project-accounts.iam.gserviceaccount.com"

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

read_bounded_json_record_set() {
  local prefix="$1"
  local maximum_records="$2"
  local records='[]'
  local object=''
  local record=''
  local observed_count=0

  while IFS= read -r object; do
    [[ -z "${object}" ]] && continue
    if ((observed_count >= maximum_records)); then
      break
    fi
    record="$(read_json_or_empty gcloud storage cat "${object}")"
    if jq -e 'type == "object"' <<<"${record}" >/dev/null; then
      records="$(jq -c --argjson record "${record}" \
        '. + [$record]' <<<"${records}")"
      observed_count=$((observed_count + 1))
    fi
  done < <(gcloud storage ls --recursive "${prefix}/**" 2>/dev/null || true)

  printf '%s\n' "${records}"
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

a100_capacity_candidates='[]'
for index in "${!A100_CAPACITY_CANDIDATE_REGIONS[@]}"; do
  candidate_region="${A100_CAPACITY_CANDIDATE_REGIONS[${index}]}"
  candidate_preference_id="${A100_CAPACITY_CANDIDATE_PREFERENCE_IDS[${index}]}"
  candidate_quota_json="$(read_json_or_empty gcloud compute regions describe \
    "${candidate_region}" --project="${PROJECT_ID}" --format='json(quotas)')"
  candidate_quota_limit="$(jq -r \
    '[.quotas[]? | select(.metric == "NVIDIA_A100_80GB_GPUS") | .limit]
      | first // 0' <<<"${candidate_quota_json}")"
  candidate_preference_metadata="$(read_json_or_empty \
    gcloud beta quotas preferences describe "${candidate_preference_id}" \
    --project="${PROJECT_ID}" --format=json)"
  candidate_observation="$(jq -n \
    --arg projectId "${PROJECT_ID}" \
    --arg foundationRegion "${REGION}" \
    --arg preferenceId "${candidate_preference_id}" \
    --arg region "${candidate_region}" \
    --argjson regionalQuotaLimit "${candidate_quota_limit}" \
    --argjson metadata "${candidate_preference_metadata}" \
    'def number_or_zero: (tonumber? // 0);
    (($metadata.quotaConfig.preferredValue // "0") | number_or_zero) as $preferred
    | (($metadata.quotaConfig.grantedValue // "0") | number_or_zero) as $granted
    | (($metadata.quotaConfig.stateDetail // "") | tostring) as $stateDetail
    | (($metadata.reconciling // false) == true) as $reconciling
    | ("projects/" + $projectId + "/locations/global/quotaPreferences/" +
       $preferenceId) as $expectedName
    | {
        region: $region,
        quotaMetric: "NVIDIA_A100_80GB_GPUS",
        regionalQuotaLimit: $regionalQuotaLimit,
        preferenceId: $preferenceId,
        preferenceExists: ($metadata.name == $expectedName),
        preferredValue: $preferred,
        grantedValue: $granted,
        reconciling: $reconciling,
        stateDetail: (if $stateDetail == "" then null else $stateDetail end),
        disposition: (
          if $metadata.name != $expectedName then "not_found"
          elif ($metadata.dimensions.region // "") != $region then "scope_mismatch"
          elif $granted >= 1 then "granted"
          elif $reconciling then "pending"
          elif ($stateDetail | ascii_downcase | contains("denied")) then "denied"
          else "not_granted"
          end
        ),
        capacityGranted: ($regionalQuotaLimit >= 1 and $granted >= 1),
        resourceFoundationObserved: ($region == $foundationRegion),
        dispatchCapacityReady: (
          $region == $foundationRegion
          and $regionalQuotaLimit >= 1
          and $granted >= 1
          and ($reconciling == false)
        )
      }')"
  a100_capacity_candidates="$(jq -c \
    --argjson candidate "${candidate_observation}" \
    '. + [$candidate]' <<<"${a100_capacity_candidates}")"
done

vertex_a100_quota_info="$(read_json_or_empty gcloud beta quotas info describe \
  "${VERTEX_A100_QUOTA_ID}" --project="${PROJECT_ID}" \
  --service='aiplatform.googleapis.com' --format=json)"
vertex_a100_quota_limit="$(jq -r --arg region "${REGION}" \
  '[.dimensionsInfos[]? | select(.dimensions.region == $region)
    | (.details.value // "0") | tonumber?] | first // 0' \
  <<<"${vertex_a100_quota_info}")"
vertex_a100_quota_preference_metadata="$(read_json_or_empty \
  gcloud beta quotas preferences describe \
  "${VERTEX_A100_QUOTA_PREFERENCE_ID}" --project="${PROJECT_ID}" \
  --format=json)"
vertex_a100_route_architecture_qualified='true'
for binding in "${VERTEX_A100_ROUTE_ARCHITECTURE_SOURCE_BINDINGS[@]}"; do
  expected_source_hash="${binding%%|*}"
  source_path="${binding#*|}"
  if [[ ! -f "${source_path}" ]] \
    || [[ "$(sha256_file "${source_path}")" != "${expected_source_hash}" ]]; then
    vertex_a100_route_architecture_qualified='false'
    break
  fi
done
vertex_a100_route_architecture_source_binding_count="${#VERTEX_A100_ROUTE_ARCHITECTURE_SOURCE_BINDINGS[@]}"
vertex_a100_custom_job_capacity="$(jq -n \
  --arg expectedName "projects/${PROJECT_ID}/locations/global/quotaPreferences/${VERTEX_A100_QUOTA_PREFERENCE_ID}" \
  --arg expectedQuotaId "${VERTEX_A100_QUOTA_ID}" \
  --arg expectedRegion "${REGION}" \
  --argjson regionalQuotaLimit "${vertex_a100_quota_limit}" \
  --argjson routeArchitectureQualified "${vertex_a100_route_architecture_qualified}" \
  --argjson routeArchitectureSourceBindingCount "${vertex_a100_route_architecture_source_binding_count}" \
  --argjson metadata "${vertex_a100_quota_preference_metadata}" \
  'def number_or_zero: (tonumber? // 0);
  (($metadata.quotaConfig.preferredValue // "0") | number_or_zero) as $preferred
  | (($metadata.quotaConfig.grantedValue // "0") | number_or_zero) as $granted
  | (($metadata.quotaConfig.stateDetail // "") | tostring) as $stateDetail
  | (($metadata.reconciling // false) == true) as $reconciling
  | {
      service: "aiplatform.googleapis.com",
      quotaId: $expectedQuotaId,
      region: $expectedRegion,
      regionalQuotaLimit: $regionalQuotaLimit,
      quotaPreferenceId: ($expectedName | split("/")[-1]),
      quotaPreferenceExists: (
        $metadata.name == $expectedName
        and ($metadata.quotaId // "") == $expectedQuotaId
        and ($metadata.dimensions.region // "") == $expectedRegion
      ),
      preferredValue: $preferred,
      grantedValue: $granted,
      reconciling: $reconciling,
      stateDetail: (if $stateDetail == "" then null else $stateDetail end),
      disposition: (
        if $metadata.name != $expectedName then "not_found"
        elif ($metadata.quotaId // "") != $expectedQuotaId then "quota_mismatch"
        elif ($metadata.dimensions.region // "") != $expectedRegion then "scope_mismatch"
        elif $granted >= 1 then "granted"
        elif $reconciling then "pending"
        elif ($stateDetail | ascii_downcase | contains("denied")) then "denied"
        else "not_granted"
        end
      ),
      capacityGranted: ($regionalQuotaLimit >= 1 and $granted >= 1),
      userTriggeredCustomJobOnly: true,
      persistentEndpointAllowed: false,
      restrictedImageTrainingQuotaMayBeUsed: false,
      routeArchitectureQualified: $routeArchitectureQualified,
      routeArchitectureSourceBindingCount: $routeArchitectureSourceBindingCount,
      dispatchCapacityReady: (
        $regionalQuotaLimit >= 1
        and $granted >= 1
        and ($reconciling == false)
        and $routeArchitectureQualified
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
sam31_qualification_image_count="$(
  {
    gcloud artifacts docker images list "${QUALIFICATION_IMAGE_URI}" \
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

private_artifact_ingest_records="$(read_bounded_json_record_set \
  "${SAM31_PRIVATE_ARTIFACT_INGEST_PREFIX}" 128)"
private_artifact_ingest_observation="$(jq -n \
  --argjson records "${private_artifact_ingest_records}" \
  'def raw_sha: test("^[a-f0-9]{64}$");
  def prefixed_sha: test("^sha256:[a-f0-9]{64}$");
  [$records[] | select(
    .schemaVersion == "canonical-sam3_1-private-artifact-ingest-receipt-v3"
    and .source == "canonical_sam3_1_private_artifact_ingest_owner"
    and .status == "ready_for_immutable_image_build_review"
    and .operationId == "tool.sam3_1.segment_and_track_subject.v1"
    and (.ingestReceiptHash | type == "string" and raw_sha)
    and .sourceArchive.repository == "https://github.com/facebookresearch/sam3.git"
    and (.sourceArchive.coordinate.sha256 | type == "string" and raw_sha)
    and .sourceArchive.artifactRef.contentHash ==
      ("sha256:" + .sourceArchive.coordinate.sha256)
    and .sourceArchive.exactStreamedByteLengthAndSha256Verified == true
    and .sourceArchive.generationAndEtagStableBeforeAndAfterRead == true
    and .sourceArchive.unsignedSourceRevisionAcceptedBySecurityReview == true
    and .checkpoint.repository == "facebook/sam3.1"
    and .checkpoint.fileName == "sam3.1_multiplex.pt"
    and (.checkpoint.coordinate.sha256 | type == "string" and raw_sha)
    and .checkpoint.artifactRef.contentHash ==
      ("sha256:" + .checkpoint.coordinate.sha256)
    and .checkpoint.exactStreamedByteLengthAndSha256Verified == true
    and .checkpoint.generationAndEtagStableBeforeAndAfterRead == true
    and .checkpoint.torchWeightsOnlyLoadRequired == true
    and .authority.canonicalTermsAcceptanceObserved == true
    and .authority.exactSourceAndCheckpointReread == true
    and .authority.imageBuildReviewEligible == true
    and .authority.artifactIngestEvidenceOnly == true
    and .authority.imageBuildStarted == false
    and .authority.runtimeExecuted == false
    and .authority.workDispatched == false
    and .authority.costOrCreditMutationCreated == false
    and .authority.publicDeliveryAuthorized == false
    and .authority.productionReady == false
    and (.sourceArchive.artifactRef.contentHash | prefixed_sha)
    and (.checkpoint.artifactRef.contentHash | prefixed_sha)
  )] as $ready
  | ($ready | sort_by(.preparedAt) | last // null) as $latest
  | {
      recordsObserved: ($records | length),
      readyReceiptsObserved: ($ready | length),
      latestReadyReceipt: (
        if $latest == null then null else {
          ingestReceiptId: $latest.ingestReceiptId,
          ingestReceiptHash: $latest.ingestReceiptHash,
          sourceRevision: $latest.sourceArchive.revision,
          sourceSha256: $latest.sourceArchive.coordinate.sha256,
          checkpointRevision: $latest.checkpoint.revision,
          checkpointSha256: $latest.checkpoint.coordinate.sha256,
          preparedAt: $latest.preparedAt
        } end
      ),
      ready: (($ready | length) >= 1)
    }')"

qualification_image_supply_chain_release_records="$(
  read_bounded_json_record_set "${SAM31_IMAGE_SUPPLY_CHAIN_RELEASE_PREFIX}" 128
)"
qualification_image_supply_chain_release_observation="$(jq -n \
  --argjson records "${qualification_image_supply_chain_release_records}" \
  'def raw_sha: test("^[a-f0-9]{64}$");
  def prefixed_sha: test("^sha256:[a-f0-9]{64}$");
  [$records[] | select(
    .schemaVersion ==
      "canonical-sam3_1-qualification-image-supply-chain-release-v1"
    and .source == "canonical_sam3_1_cloud_image_supply_chain_owner"
    and .buildPurpose == "source_checkpoint_qualification"
    and .imageRole == "qualification_image"
    and .evidenceClass == "canonical_private_reread"
    and .status == "image_supply_chain_qualified"
    and .operationId == "tool.sam3_1.segment_and_track_subject.v1"
    and (.releaseHash | type == "string" and raw_sha)
    and (.immutableImageDigest | type == "string" and prefixed_sha)
    and .immutableImageUri ==
      ("us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/" +
       "reeditpro-sam31-qualification@" + .immutableImageDigest)
    and .artifactRegistryPackage ==
      ("projects/reeditpro/locations/us-central1/repositories/" +
       "reeditpro-workers/packages/reeditpro-sam31-qualification/versions/" +
       .immutableImageDigest)
    and .sbom.completeOsAndApplicationPackageInventory == true
    and .sbom.exactArtifactReread == true
    and .vulnerabilityScan.criticalCount == 0
    and .vulnerabilityScan.highCount == 0
    and .vulnerabilityScan.unknownSeverityCount == 0
    and .vulnerabilityScan.exactOccurrencesReread == true
    and .vulnerabilityScan.securityReviewApprovedForPrivateGpuQualification == true
    and .signature.exactSignatureVerificationPassed == true
    and .provenance.exactAttestationRereadAndVerified == true
    and .authority.exactImmutableImageReread == true
    and .authority.exactSupplyChainBuildReread == true
    and .authority.exactThreeArtifactSetReread == true
    and .authority.exactSbomReread == true
    and .authority.vulnerabilityScanPassed == true
    and .authority.imageSignatureVerified == true
    and .authority.buildProvenanceVerified == true
    and .authority.qualificationImageSupplyChainQualified == true
    and .authority.sourceCheckpointQualificationImageAdmissible == true
    and .authority.sourceCheckpointQualificationGranted == false
    and .authority.gpuQualificationJobDispatched == false
    and .authority.a100RuntimeQualified == false
    and .authority.l4RuntimeQualified == false
    and .authority.runtimeReleaseGranted == false
    and .authority.customerCreditMutationAllowed == false
    and .authority.publicDeliveryAuthorized == false
    and .authority.productionReady == false
  )] as $qualified
  | ($qualified | sort_by(.qualifiedAt) | last // null) as $latest
  | {
      recordsObserved: ($records | length),
      qualifiedReleasesObserved: ($qualified | length),
      latestQualifiedRelease: (
        if $latest == null then null else {
          releaseId: $latest.releaseId,
          releaseHash: $latest.releaseHash,
          immutableImageDigest: $latest.immutableImageDigest,
          immutableImageUri: $latest.immutableImageUri,
          qualifiedAt: $latest.qualifiedAt,
          vulnerabilityCounts: {
            critical: $latest.vulnerabilityScan.criticalCount,
            high: $latest.vulnerabilityScan.highCount,
            medium: $latest.vulnerabilityScan.mediumCount,
            low: $latest.vulnerabilityScan.lowCount,
            unknown: $latest.vulnerabilityScan.unknownSeverityCount
          },
          exactSignatureVerificationPassed:
            $latest.signature.exactSignatureVerificationPassed,
          exactAttestationRereadAndVerified:
            $latest.provenance.exactAttestationRereadAndVerified
        } end
      ),
      ready: (($qualified | length) >= 1)
    }')"

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

project_policy="$(read_json_or_empty gcloud projects get-iam-policy \
  "${PROJECT_ID}" --format=json)"
a100_qualification_identity="$(service_account_observation \
  "${A100_QUALIFICATION_SERVICE_ACCOUNT}")"
a100_qualification_identity_policy="$(read_json_or_empty \
  gcloud iam service-accounts get-iam-policy \
  "${A100_QUALIFICATION_SERVICE_ACCOUNT}" --project="${PROJECT_ID}" \
  --format=json)"
a100_qualification_bucket="$(bucket_observation \
  "${A100_QUALIFICATION_BUCKET}")"
a100_qualification_bucket_metadata="$(read_json_or_empty \
  gcloud storage buckets describe "gs://${A100_QUALIFICATION_BUCKET}" \
  --project="${PROJECT_ID}" --format=json)"
a100_qualification_bucket_policy="$(read_json_or_empty \
  gcloud storage buckets get-iam-policy "gs://${A100_QUALIFICATION_BUCKET}" \
  --project="${PROJECT_ID}" --format=json)"
a100_qualification_key_metadata="$(read_json_or_empty gcloud kms keys describe \
  "${A100_QUALIFICATION_KEY}" --project="${PROJECT_ID}" \
  --location="${REGION}" --keyring="${A100_QUALIFICATION_KEY_RING}" \
  --format=json)"
a100_qualification_key_policy="$(read_json_or_empty gcloud kms keys get-iam-policy \
  "${A100_QUALIFICATION_KEY}" --project="${PROJECT_ID}" \
  --location="${REGION}" --keyring="${A100_QUALIFICATION_KEY_RING}" \
  --format=json)"
a100_qualification_template="$(read_json_or_empty \
  gcloud compute instance-templates describe \
  "${A100_QUALIFICATION_INSTANCE_TEMPLATE}" --project="${PROJECT_ID}" \
  --format=json)"
a100_qualification_network="$(read_json_or_empty gcloud compute networks describe \
  "${A100_QUALIFICATION_NETWORK}" --project="${PROJECT_ID}" --format=json)"
a100_qualification_subnet="$(read_json_or_empty \
  gcloud compute networks subnets describe "${A100_QUALIFICATION_SUBNET}" \
  --project="${PROJECT_ID}" --region="${REGION}" --format=json)"
a100_qualification_routers="$(read_json_or_empty gcloud compute routers list \
  --project="${PROJECT_ID}" --regions="${REGION}" --format=json)"
a100_qualification_batch_image="$(read_json_or_empty gcloud compute images describe \
  "${A100_QUALIFICATION_BATCH_IMAGE}" \
  --project="${A100_QUALIFICATION_BATCH_IMAGE_PROJECT}" --format=json)"
a100_qualification_batch_job_count="$({
  gcloud batch jobs list --project="${PROJECT_ID}" --location="${REGION}" \
    --format='value(name)' 2>/dev/null || true
  } | awk '/weeditpro-sam31-q-/ { count += 1 } END { print count + 0 }')"
a100_qualification_instance_count="$({
  gcloud compute instances list --project="${PROJECT_ID}" \
    --format='value(name)' 2>/dev/null || true
  } | awk '/weeditpro-sam31-q-/ { count += 1 } END { print count + 0 }')"

a100_qualification_project_roles="$(jq -n \
  --arg member "serviceAccount:${A100_QUALIFICATION_SERVICE_ACCOUNT}" \
  --argjson policy "${project_policy}" '
  [$policy.bindings[]?
    | select(any(.members[]?; . == $member))
    | .role] | sort
')"
a100_qualification_attach_roles="$(jq -n \
  --arg member "serviceAccount:${API_SERVICE_ACCOUNT}" \
  --argjson policy "${a100_qualification_identity_policy}" '
  [$policy.bindings[]?
    | select(any(.members[]?; . == $member))
    | .role] | sort
')"
a100_qualification_worker_bucket_roles="$(jq -n \
  --arg member "serviceAccount:${A100_QUALIFICATION_SERVICE_ACCOUNT}" \
  --argjson policy "${a100_qualification_bucket_policy}" '
  [$policy.bindings[]?
    | select(any(.members[]?; . == $member))
    | .role] | sort
')"
a100_qualification_api_bucket_roles="$(jq -n \
  --arg member "serviceAccount:${API_SERVICE_ACCOUNT}" \
  --argjson policy "${a100_qualification_bucket_policy}" '
  [$policy.bindings[]?
    | select(any(.members[]?; . == $member))
    | .role] | sort
')"
a100_qualification_repository_roles="$(jq -n \
  --arg member "serviceAccount:${A100_QUALIFICATION_SERVICE_ACCOUNT}" \
  --argjson policy "${repository_policy}" '
  [$policy.bindings[]?
    | select(any(.members[]?; . == $member))
    | .role] | sort
')"
a100_qualification_storage_key_roles="$(jq -n \
  --arg member "serviceAccount:${STORAGE_SERVICE_AGENT}" \
  --argjson policy "${a100_qualification_key_policy}" '
  [$policy.bindings[]?
    | select(any(.members[]?; . == $member))
    | .role] | sort
')"

a100_qualification_foundation="$(jq -n \
  --arg projectId "${PROJECT_ID}" \
  --arg region "${REGION}" \
  --arg serviceAccount "${A100_QUALIFICATION_SERVICE_ACCOUNT}" \
  --arg bucketName "${A100_QUALIFICATION_BUCKET}" \
  --arg keyName "projects/${PROJECT_ID}/locations/${REGION}/keyRings/${A100_QUALIFICATION_KEY_RING}/cryptoKeys/${A100_QUALIFICATION_KEY}" \
  --arg templateName "${A100_QUALIFICATION_INSTANCE_TEMPLATE}" \
  --arg networkName "${A100_QUALIFICATION_NETWORK}" \
  --arg subnetName "${A100_QUALIFICATION_SUBNET}" \
  --arg subnetCidr "${A100_QUALIFICATION_SUBNET_CIDR}" \
  --arg batchImage "${A100_QUALIFICATION_BATCH_IMAGE}" \
  --arg batchImageId "${A100_QUALIFICATION_BATCH_IMAGE_ID}" \
  --argjson identity "${a100_qualification_identity}" \
  --argjson bucket "${a100_qualification_bucket}" \
  --argjson bucketMetadata "${a100_qualification_bucket_metadata}" \
  --argjson keyMetadata "${a100_qualification_key_metadata}" \
  --argjson template "${a100_qualification_template}" \
  --argjson network "${a100_qualification_network}" \
  --argjson subnet "${a100_qualification_subnet}" \
  --argjson routers "${a100_qualification_routers}" \
  --argjson image "${a100_qualification_batch_image}" \
  --argjson projectRoles "${a100_qualification_project_roles}" \
  --argjson attachRoles "${a100_qualification_attach_roles}" \
  --argjson workerBucketRoles "${a100_qualification_worker_bucket_roles}" \
  --argjson apiBucketRoles "${a100_qualification_api_bucket_roles}" \
  --argjson repositoryRoles "${a100_qualification_repository_roles}" \
  --argjson storageKeyRoles "${a100_qualification_storage_key_roles}" \
  --argjson activeBatchJobs "${a100_qualification_batch_job_count}" \
  --argjson activeInstances "${a100_qualification_instance_count}" '
  (["roles/batch.agentReporter", "roles/logging.logWriter",
    "roles/monitoring.metricWriter"] | sort) as $expectedProjectRoles
  | (["roles/storage.objectCreator", "roles/storage.objectViewer"] | sort)
    as $expectedBucketRoles
  | {
      schemaVersion:
        "weeditpro-sam31-a100-qualification-foundation-observation-v1",
      projectId: $projectId,
      region: $region,
      serviceIdentity: $identity,
      exactProjectRoles: ($projectRoles == $expectedProjectRoles),
      projectRoles: $projectRoles,
      exactApiAttachRole: ($attachRoles == ["roles/iam.serviceAccountUser"]),
      apiAttachRoles: $attachRoles,
      privateBucket: $bucket,
      bucketCmekAndRetentionReady: (
        $bucketMetadata.name == $bucketName
        and $bucketMetadata.default_kms_key == $keyName
        and $bucketMetadata.default_storage_class == "STANDARD"
        and $bucketMetadata.soft_delete_policy.retentionDurationSeconds == "1209600"
      ),
      exactWorkerBucketRoles: ($workerBucketRoles == $expectedBucketRoles),
      exactApiBucketRoles: ($apiBucketRoles == $expectedBucketRoles),
      exactRepositoryRole:
        ($repositoryRoles == ["roles/artifactregistry.reader"]),
      hsmCmekReady: (
        $keyMetadata.name == $keyName
        and $keyMetadata.purpose == "ENCRYPT_DECRYPT"
        and $keyMetadata.primary.protectionLevel == "HSM"
        and $keyMetadata.primary.state == "ENABLED"
        and $keyMetadata.rotationPeriod == "7776000s"
        and $storageKeyRoles == ["roles/cloudkms.cryptoKeyEncrypterDecrypter"]
      ),
      pinnedBatchImageReady: (
        $image.name == $batchImage
        and ($image.id | tostring) == $batchImageId
        and $image.status == "READY"
        and $image.deprecated == null
      ),
      privateNetworkReady: (
        $network.name == $networkName
        and $network.autoCreateSubnetworks == false
        and $network.mtu == 1460
        and $network.routingConfig.routingMode == "REGIONAL"
        and $subnet.name == $subnetName
        and $subnet.ipCidrRange == $subnetCidr
        and $subnet.privateIpGoogleAccess == true
        and $subnet.purpose == "PRIVATE"
        and $subnet.stackType == "IPV4_ONLY"
        and ($routers | type == "array" and length == 0)
      ),
      exactA100TemplateReady: (
        $template.name == $templateName
        and $template.properties.machineType == "a2-ultragpu-1g"
        and $template.properties.canIpForward == false
        and $template.properties.scheduling.onHostMaintenance == "TERMINATE"
        and $template.properties.scheduling.provisioningModel == "STANDARD"
        and $template.properties.serviceAccounts[0].email == $serviceAccount
        and $template.properties.serviceAccounts[0].scopes ==
          ["https://www.googleapis.com/auth/cloud-platform"]
        and $template.properties.networkInterfaces[0].accessConfigs == null
        and ($template.properties.networkInterfaces[0].network
          | endswith("/" + $networkName))
        and ($template.properties.networkInterfaces[0].subnetwork
          | endswith("/" + $subnetName))
        and ($template.properties.disks[0].initializeParams.sourceImage
          | endswith("/" + $batchImage))
        and $template.properties.disks[0].initializeParams.diskSizeGb == "200"
        and $template.properties.disks[0].initializeParams.diskType == "pd-balanced"
        and $template.properties.shieldedInstanceConfig.enableSecureBoot == true
        and $template.properties.shieldedInstanceConfig.enableVtpm == true
        and $template.properties.shieldedInstanceConfig.enableIntegrityMonitoring == true
        and ($template.properties.metadata.items
          | any(.key == "block-project-ssh-keys" and .value == "true"))
        and ($template.properties.metadata.items
          | any(.key == "enable-oslogin" and .value == "true"))
      ),
      activeQualificationBatchJobs: $activeBatchJobs,
      activeQualificationInstances: $activeInstances,
      scaleFromZeroClean: ($activeBatchJobs == 0 and $activeInstances == 0),
      modelOrCheckpointDownloaded: false,
      gpuJobStartedByAudit: false,
      customerCreditsMutated: false,
      productionAuthorityGranted: false,
      ready: (
        $identity.ready
        and $projectRoles == $expectedProjectRoles
        and $attachRoles == ["roles/iam.serviceAccountUser"]
        and $bucket.ready
        and $bucketMetadata.default_kms_key == $keyName
        and $bucketMetadata.default_storage_class == "STANDARD"
        and $bucketMetadata.soft_delete_policy.retentionDurationSeconds == "1209600"
        and $workerBucketRoles == $expectedBucketRoles
        and $apiBucketRoles == $expectedBucketRoles
        and $repositoryRoles == ["roles/artifactregistry.reader"]
        and $keyMetadata.name == $keyName
        and $keyMetadata.purpose == "ENCRYPT_DECRYPT"
        and $keyMetadata.primary.protectionLevel == "HSM"
        and $keyMetadata.primary.state == "ENABLED"
        and $keyMetadata.rotationPeriod == "7776000s"
        and $storageKeyRoles == ["roles/cloudkms.cryptoKeyEncrypterDecrypter"]
        and $image.name == $batchImage
        and ($image.id | tostring) == $batchImageId
        and $image.status == "READY"
        and $image.deprecated == null
        and $network.name == $networkName
        and $network.autoCreateSubnetworks == false
        and $network.mtu == 1460
        and $network.routingConfig.routingMode == "REGIONAL"
        and $subnet.name == $subnetName
        and $subnet.ipCidrRange == $subnetCidr
        and $subnet.privateIpGoogleAccess == true
        and $subnet.purpose == "PRIVATE"
        and $subnet.stackType == "IPV4_ONLY"
        and ($routers | type == "array" and length == 0)
        and $template.name == $templateName
        and $template.properties.machineType == "a2-ultragpu-1g"
        and $template.properties.canIpForward == false
        and $template.properties.networkInterfaces[0].accessConfigs == null
        and $activeBatchJobs == 0
        and $activeInstances == 0
      )
    }
')"
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
image_signer_supply_chain_bucket_viewer="$(policy_has_member_role \
  "${image_supply_chain_evidence_bucket_policy}" 'roles/storage.bucketViewer' \
  "serviceAccount:${IMAGE_SIGNER_SERVICE_ACCOUNT}")"
image_signer_supply_chain_evidence_reader="$(policy_has_member_role \
  "${image_supply_chain_evidence_bucket_policy}" 'roles/storage.objectViewer' \
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
  --arg audit 'weeditpro-visual-intelligence-live-prerequisites-v18' \
  --arg observedAt "${observed_at}" \
  --arg projectId "${PROJECT_ID}" \
  --arg region "${REGION}" \
  --argjson a100Limit "${a100_limit}" \
  --argjson l4Limit "${l4_limit}" \
  --argjson a100QuotaPreference "${a100_quota_preference}" \
  --argjson a100CapacityCandidates "${a100_capacity_candidates}" \
  --argjson vertexA100CustomJobCapacity "${vertex_a100_custom_job_capacity}" \
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
  --argjson sam31QualificationImageCount "${sam31_qualification_image_count}" \
  --argjson trackAllL4TaskQaImageCount "${track_all_l4_task_qa_image_count}" \
  --argjson privateArtifactIngest "${private_artifact_ingest_observation}" \
  --argjson imageSupplyChainRelease "${qualification_image_supply_chain_release_observation}" \
  --argjson accountPricing "${account_pricing_json}" \
  --argjson a100QualificationFoundation "${a100_qualification_foundation}" \
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
  --argjson imageSignerSupplyChainBucketViewer "${image_signer_supply_chain_bucket_viewer}" \
  --argjson imageSignerSupplyChainEvidenceReader "${image_signer_supply_chain_evidence_reader}" \
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
    observedAt: $observedAt,
    projectId: $projectId,
    region: $region,
    gpuQuota: {
      nvidiaA10080Gb: $a100Limit,
      nvidiaL4: $l4Limit,
      a100QuotaPreference: $a100QuotaPreference,
      a100CapacityCandidates: $a100CapacityCandidates,
      a100CandidateRequestCount: ($a100CapacityCandidates | length),
      a100PendingReviewCount: (
        [$a100CapacityCandidates[] | select(.disposition == "pending")] | length
      ),
      a100GrantedCandidateCount: (
        [$a100CapacityCandidates[] | select(.capacityGranted)] | length
      ),
      a100DispatchReadyCandidateCount: (
        [$a100CapacityCandidates[] | select(.dispatchCapacityReady)] | length
      ),
      vertexA100CustomJobCapacity: $vertexA100CustomJobCapacity,
      capacityPrerequisitesReady: (
        $l4Limit >= 1
        and (
          $a100Limit >= 1
          or $vertexA100CustomJobCapacity.capacityGranted
        )
      )
    },
    a100QualificationFoundation: $a100QualificationFoundation,
    privateArtifactAccess: {
      huggingFaceTokenEnabledVersions: $huggingFaceTokenEnabledVersions,
      modelWeightTokenEnabledVersions: $modelWeightTokenEnabledVersions,
      historicalFreshAccessTokenSecretObserved:
        ($huggingFaceTokenEnabledVersions >= 1),
      legacyModelWeightTokenSecretRequired: false,
      freshAccessTokenCurrentlyRequired: false,
      officialPrivateArtifactIngest: $privateArtifactIngest,
      ready: $privateArtifactIngest.ready
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
        imageSignerSupplyChainBucketViewer: $imageSignerSupplyChainBucketViewer,
        imageSignerSupplyChainEvidenceReader: $imageSignerSupplyChainEvidenceReader,
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
        and $imageSignerSupplyChainBucketViewer
        and $imageSignerSupplyChainEvidenceReader
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
    immutableSam31ImagesObserved: (
      $sam31ImageCount + $sam31QualificationImageCount
    ),
    immutableSam31ProductionImagesObserved: $sam31ImageCount,
    immutableSam31QualificationImagesObserved:
      $sam31QualificationImageCount,
    immutableTrackAllL4TaskQaImagesObserved: $trackAllL4TaskQaImageCount,
    immutableGpuWorkerImageSetReady: (
      $sam31ImageCount >= 1 and $trackAllL4TaskQaImageCount >= 1
    ),
    accountEffectiveGeminiPricing: $accountPricing,
    sourceCheckpointCompatibilityReceiptObserved: false,
    qualificationImageSupplyChainRelease: $imageSupplyChainRelease,
    imageSupplyChainReleaseObserved: $imageSupplyChainRelease.ready,
    liveGeminiQualificationObserved: false,
    liveGpuQualificationObserved: false,
    customerCreditsMutated: false,
    productionReady: false
  }'
