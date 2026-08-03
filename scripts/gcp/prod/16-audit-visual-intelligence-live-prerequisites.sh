#!/usr/bin/env bash
set -euo pipefail

# Read-only operator audit for the WeEditPro Visual Intelligence and SAM 3.1
# cloud foundation. This script never reads a secret payload, creates a job,
# enables an API, downloads a model, builds an image, or mutates billing.

PROJECT_ID='reeditpro'
REGION='us-central1'
IMAGE_URI='us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sam31-gpu'

command -v gcloud >/dev/null
command -v jq >/dev/null

configured_project="$(gcloud config get-value project --quiet)"
if [[ "${configured_project}" != "${PROJECT_ID}" ]]; then
  printf 'Configured project must be %s, observed %s.\n' \
    "${PROJECT_ID}" "${configured_project}" >&2
  exit 2
fi

quota_json="$(
  gcloud compute regions describe "${REGION}" \
    --project="${PROJECT_ID}" \
    --format='json(quotas)'
)"
a100_limit="$(jq -r '[.quotas[] | select(.metric == "NVIDIA_A100_80GB_GPUS") | .limit] | first // 0' <<<"${quota_json}")"
l4_limit="$(jq -r '[.quotas[] | select(.metric == "NVIDIA_L4_GPUS") | .limit] | first // 0' <<<"${quota_json}")"

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
  'cloudbuild.googleapis.com'
  'cloudbilling.googleapis.com'
  'compute.googleapis.com'
  'containeranalysis.googleapis.com'
  'containerscanning.googleapis.com'
  'iamcredentials.googleapis.com'
  'run.googleapis.com'
  'secretmanager.googleapis.com'
  'storage-api.googleapis.com'
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

legacy_jobs="$(
  gcloud run jobs list \
    --project="${PROJECT_ID}" \
    --region="${REGION}" \
    --format='value(metadata.name)' \
    | awk 'BEGIN { IGNORECASE=1 } /qwen|sam2|phase39c/ { count += 1 } END { print count + 0 }'
)"
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

missing_services_json="$(
  if ((${#missing_services[@]} == 0)); then
    printf '[]\n'
  else
    printf '%s\n' "${missing_services[@]}" | jq -Rsc 'split("\n") | map(select(length > 0))'
  fi
)"

jq -n \
  --arg audit 'weeditpro-visual-intelligence-live-prerequisites-v1' \
  --arg projectId "${PROJECT_ID}" \
  --arg region "${REGION}" \
  --argjson a100Limit "${a100_limit}" \
  --argjson l4Limit "${l4_limit}" \
  --argjson huggingFaceTokenEnabledVersions "${hugging_face_token_versions}" \
  --argjson modelWeightTokenEnabledVersions "${model_weight_token_versions}" \
  --argjson missingServices "${missing_services_json}" \
  --argjson legacyVisualJobs "${legacy_jobs}" \
  --argjson legacyVisualServices "${legacy_services}" \
  --argjson sam31ImageCount "${sam31_image_count}" \
  --argjson accountPricing "${account_pricing_json}" \
  '{
    audit: $audit,
    projectId: $projectId,
    region: $region,
    gpuQuota: {
      nvidiaA10080Gb: $a100Limit,
      nvidiaL4: $l4Limit,
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
    retiredLegacyVisualRuntime: {
      matchingJobs: $legacyVisualJobs,
      matchingServices: $legacyVisualServices,
      clean: ($legacyVisualJobs == 0 and $legacyVisualServices == 0)
    },
    immutableSam31ImagesObserved: $sam31ImageCount,
    accountEffectiveGeminiPricing: $accountPricing,
    sourceCheckpointCompatibilityReceiptObserved: false,
    liveGeminiQualificationObserved: false,
    liveGpuQualificationObserved: false,
    customerCreditsMutated: false,
    productionReady: false
  }'
