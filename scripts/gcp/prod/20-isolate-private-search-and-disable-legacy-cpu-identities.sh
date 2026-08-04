#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/gcloud-common.sh
source "${SCRIPT_DIR}/lib/gcloud-common.sh"

confirm_prod_action

readonly EXPECTED_PROJECT_ID='reeditpro'
readonly EXPECTED_REGION='us-central1'
readonly SEARCH_SERVICE='reeditpro-staging-private-searxng'
readonly SEARCH_IMAGE='us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-private-searxng@sha256:7f56a77c442601d249389e4cb4101da2046fd62c04818c69eabf8caa7f6957ee'
readonly OLD_SHARED_CPU_IDENTITY='reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'
readonly SEARCH_IDENTITY_ID='reeditpro-private-search-sa'
readonly SEARCH_IDENTITY='reeditpro-private-search-sa@reeditpro.iam.gserviceaccount.com'
readonly MIGRATION_CONFIRMATION='isolate-weeditpro-private-search-and-disable-cpu-identities-v1'
readonly -a LEGACY_CPU_PROCESSING_IDENTITIES=(
  'reeditpro-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  'reeditpro-stg-render-sa@reeditpro.iam.gserviceaccount.com'
  'reeditpro-stg-qa-sa@reeditpro.iam.gserviceaccount.com'
  'reeditpro-stg-tool-ready-sa@reeditpro.iam.gserviceaccount.com'
)

if [[ "${GCP_PROJECT_ID}" != "${EXPECTED_PROJECT_ID}" \
  || "${GCP_REGION}" != "${EXPECTED_REGION}" ]]; then
  echo 'ERROR: project or region does not match the fixed private-search migration.' >&2
  exit 1
fi
if [[ "${WEEDITPRO_ISOLATE_PRIVATE_SEARCH_AND_DISABLE_CPU_IDENTITIES:-}" \
  != "${MIGRATION_CONFIRMATION}" ]]; then
  echo 'ERROR: refusing private-search identity migration without the exact confirmation.' >&2
  exit 1
fi

service_json="$(gcloud run services describe "${SEARCH_SERVICE}" \
  --project="${EXPECTED_PROJECT_ID}" --region="${EXPECTED_REGION}" \
  --format=json)"
service_policy="$(gcloud run services get-iam-policy "${SEARCH_SERVICE}" \
  --project="${EXPECTED_PROJECT_ID}" --region="${EXPECTED_REGION}" \
  --format=json)"

if ! jq -e \
  --arg name "${SEARCH_SERVICE}" \
  --arg image "${SEARCH_IMAGE}" \
  --arg oldIdentity "${OLD_SHARED_CPU_IDENTITY}" \
  --arg newIdentity "${SEARCH_IDENTITY}" \
  '(
    .metadata.name == $name
    and .spec.template.spec.containers[0].image == $image
    and (.spec.template.spec.serviceAccountName == $oldIdentity
      or .spec.template.spec.serviceAccountName == $newIdentity)
    and .spec.template.spec.containers[0].resources.limits.cpu == "1"
    and .spec.template.spec.containers[0].resources.limits.memory == "1Gi"
    and ((.spec.template.spec.containers[0].resources.limits["nvidia.com/gpu"] // "0") == "0")
    and ((.spec.template.metadata.annotations["autoscaling.knative.dev/minScale"] // "0") == "0")
    and .spec.template.metadata.annotations["autoscaling.knative.dev/maxScale"] == "1"
  )' <<<"${service_json}" >/dev/null; then
  echo 'ERROR: private search service differs from the frozen control-plane shape.' >&2
  exit 1
fi
if jq -e 'any(.bindings[]?.members[]?; . == "allUsers" or . == "allAuthenticatedUsers")' \
  <<<"${service_policy}" >/dev/null; then
  echo 'ERROR: private search service has a public invoker principal.' >&2
  exit 1
fi

if gcloud iam service-accounts describe "${SEARCH_IDENTITY}" \
  --project="${EXPECTED_PROJECT_ID}" >/dev/null 2>&1; then
  search_disabled="$(gcloud iam service-accounts describe \
    "${SEARCH_IDENTITY}" --project="${EXPECTED_PROJECT_ID}" \
    --format='value(disabled)')"
  if [[ "${search_disabled}" == 'True' || "${search_disabled}" == 'true' ]]; then
    echo 'ERROR: the dedicated private-search identity exists but is disabled.' >&2
    exit 1
  fi
else
  run_gcloud iam service-accounts create "${SEARCH_IDENTITY_ID}" \
    --project="${EXPECTED_PROJECT_ID}" \
    --display-name='WeEditPro private search control plane' \
    --description='CPU control-plane identity for private bounded search only; no media, model, GPU, billing, or production authority.'
fi

current_service_identity="$(jq -r '.spec.template.spec.serviceAccountName' \
  <<<"${service_json}")"
service_updated=false
if [[ "${current_service_identity}" == "${OLD_SHARED_CPU_IDENTITY}" ]]; then
  run_gcloud run services update "${SEARCH_SERVICE}" \
    --project="${EXPECTED_PROJECT_ID}" \
    --region="${EXPECTED_REGION}" \
    --service-account="${SEARCH_IDENTITY}" \
    --quiet
  service_updated=true
elif [[ "${current_service_identity}" != "${SEARCH_IDENTITY}" ]]; then
  echo 'ERROR: private search service uses an unexpected identity.' >&2
  exit 1
fi

all_run_resources="$(
  {
    gcloud run services list --project="${EXPECTED_PROJECT_ID}" \
      --region="${EXPECTED_REGION}" --format=json
    gcloud run jobs list --project="${EXPECTED_PROJECT_ID}" \
      --region="${EXPECTED_REGION}" --format=json
  } | jq -s 'add'
)"
for identity in "${LEGACY_CPU_PROCESSING_IDENTITIES[@]}"; do
  if jq -e --arg identity "${identity}" \
    'any(.[].spec.template.spec.serviceAccountName?; . == $identity)
      or any(.[].spec.template.spec.template.spec.serviceAccountName?;
        . == $identity)' <<<"${all_run_resources}" >/dev/null; then
    echo "ERROR: ${identity} is still attached to a Cloud Run resource." >&2
    exit 1
  fi
done

active_batch_jobs="$(
  gcloud batch jobs list --project="${EXPECTED_PROJECT_ID}" \
    --location="${EXPECTED_REGION}" --format=json \
    | jq '[.[] | select(
      (.status.state // "") == "QUEUED"
      or (.status.state // "") == "SCHEDULED"
      or (.status.state // "") == "RUNNING"
    )]'
)"
for identity in "${LEGACY_CPU_PROCESSING_IDENTITIES[@]}"; do
  if jq -e --arg identity "${identity}" \
    'any(.. | strings; . == $identity)' <<<"${active_batch_jobs}" >/dev/null; then
    echo "ERROR: ${identity} is still attached to an active Batch job." >&2
    exit 1
  fi
done

if gcloud builds list --project="${EXPECTED_PROJECT_ID}" --ongoing \
  --format='value(serviceAccount)' \
  | grep -Fxf <(printf '%s\n' "${LEGACY_CPU_PROCESSING_IDENTITIES[@]}") \
    >/dev/null; then
  echo 'ERROR: an ongoing Cloud Build still uses a legacy CPU identity.' >&2
  exit 1
fi

disabled_count=0
already_disabled_or_absent_count=0
for identity in "${LEGACY_CPU_PROCESSING_IDENTITIES[@]}"; do
  if ! identity_json="$(gcloud iam service-accounts describe "${identity}" \
    --project="${EXPECTED_PROJECT_ID}" --format=json 2>/dev/null)"; then
    already_disabled_or_absent_count=$((already_disabled_or_absent_count + 1))
    continue
  fi
  if [[ "$(jq -r '.disabled // false' <<<"${identity_json}")" == 'true' ]]; then
    already_disabled_or_absent_count=$((already_disabled_or_absent_count + 1))
    continue
  fi
  run_gcloud iam service-accounts disable "${identity}" \
    --project="${EXPECTED_PROJECT_ID}" --quiet
  disabled_count=$((disabled_count + 1))
done

verified_service_json="$(gcloud run services describe "${SEARCH_SERVICE}" \
  --project="${EXPECTED_PROJECT_ID}" --region="${EXPECTED_REGION}" \
  --format=json)"
if ! jq -e \
  --arg image "${SEARCH_IMAGE}" \
  --arg identity "${SEARCH_IDENTITY}" \
  '(
    .spec.template.spec.serviceAccountName == $identity
    and .spec.template.spec.containers[0].image == $image
    and .spec.template.spec.containers[0].resources.limits.cpu == "1"
    and .spec.template.spec.containers[0].resources.limits.memory == "1Gi"
    and ((.spec.template.spec.containers[0].resources.limits["nvidia.com/gpu"] // "0") == "0")
    and ((.spec.template.metadata.annotations["autoscaling.knative.dev/minScale"] // "0") == "0")
    and .spec.template.metadata.annotations["autoscaling.knative.dev/maxScale"] == "1"
  )' <<<"${verified_service_json}" >/dev/null; then
  echo 'ERROR: private search did not retain its exact dedicated control-plane shape.' >&2
  exit 1
fi
for identity in "${LEGACY_CPU_PROCESSING_IDENTITIES[@]}"; do
  if identity_json="$(gcloud iam service-accounts describe "${identity}" \
    --project="${EXPECTED_PROJECT_ID}" --format=json 2>/dev/null)" \
    && [[ "$(jq -r '.disabled // false' <<<"${identity_json}")" != 'true' ]]; then
    echo "ERROR: legacy CPU identity remains enabled: ${identity}." >&2
    exit 1
  fi
done

jq -n \
  --arg receipt 'weeditpro-private-search-identity-isolation-v1' \
  --arg projectId "${EXPECTED_PROJECT_ID}" \
  --arg region "${EXPECTED_REGION}" \
  --arg serviceName "${SEARCH_SERVICE}" \
  --arg serviceIdentity "${SEARCH_IDENTITY}" \
  --argjson serviceUpdated "${service_updated}" \
  --argjson legacyIdentityAllowlistCount "${#LEGACY_CPU_PROCESSING_IDENTITIES[@]}" \
  --argjson disabledCount "${disabled_count}" \
  --argjson alreadyDisabledOrAbsentCount "${already_disabled_or_absent_count}" \
  '{
    receipt: $receipt,
    projectId: $projectId,
    region: $region,
    privateSearch: {
      serviceName: $serviceName,
      serviceIdentity: $serviceIdentity,
      controlPlaneCpuOnly: true,
      substantiveMediaOrModelProcessingAllowed: false,
      minimumIdleInstances: 0,
      maximumInstances: 1,
      publicInvokerAllowed: false,
      serviceUpdated: $serviceUpdated
    },
    legacyIdentityAllowlistCount: $legacyIdentityAllowlistCount,
    disabledCount: $disabledCount,
    alreadyDisabledOrAbsentCount: $alreadyDisabledOrAbsentCount,
    serviceDeleted: false,
    imageChangedOrDeleted: false,
    gpuJobStarted: false,
    providerCalled: false,
    customerCreditsMutated: false,
    publicDeliveryAuthorized: false,
    productionReady: false
  }'
