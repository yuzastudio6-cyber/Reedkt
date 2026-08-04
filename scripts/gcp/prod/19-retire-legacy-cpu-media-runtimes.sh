#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/gcloud-common.sh
source "${SCRIPT_DIR}/lib/gcloud-common.sh"

confirm_prod_action

readonly EXPECTED_PROJECT_ID='reeditpro'
readonly LEGACY_REGION='us-central1'
readonly RETIREMENT_CONFIRMATION='retire-weeditpro-legacy-cpu-media-runtime-v1'

if [[ "${GCP_PROJECT_ID}" != "${EXPECTED_PROJECT_ID}" \
  || "${GCP_REGION}" != "${LEGACY_REGION}" ]]; then
  echo 'ERROR: project or region does not match the frozen retirement scope.' >&2
  exit 1
fi

if [[ "${WEEDITPRO_RETIRE_LEGACY_CPU_MEDIA_RUNTIMES:-}" \
  != "${RETIREMENT_CONFIRMATION}" ]]; then
  echo 'ERROR: refusing legacy CPU media-runtime retirement.' >&2
  echo "Set WEEDITPRO_RETIRE_LEGACY_CPU_MEDIA_RUNTIMES=${RETIREMENT_CONFIRMATION} after reviewing the fixed allowlist." >&2
  exit 1
fi

# Each row binds the only deletable job definition to its current immutable
# image identity, service identity, and CPU-only resource envelope. If a job
# was repurposed, migrated, or otherwise changed, this script refuses it.
readonly -a LEGACY_CPU_MEDIA_RUNTIME_ROWS=(
  'reeditpro-sound-audio-metadata-worker|us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sound-audio-metadata-worker@sha256:0675cfce640fcee435d0e8335647bea85f2cac9d7fb44650e473da5fcfe98366|reeditpro-cpu-worker-sa@reeditpro.iam.gserviceaccount.com|2|4Gi'
  'reeditpro-sound-cpu-analysis-worker|us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sound-cpu-analysis-worker@sha256:0675cfce640fcee435d0e8335647bea85f2cac9d7fb44650e473da5fcfe98366|reeditpro-cpu-worker-sa@reeditpro.iam.gserviceaccount.com|2|4Gi'
  'reeditpro-staging-cpu-analysis-job|us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-cpu-worker@sha256:4e7be87fc24c1cd1efcad129f7d636b084f731f8eb6827d99d7f8b9d54432ddb|reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com|2|4Gi'
  'reeditpro-staging-deepfilternet-runtime-job|us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-deepfilternet-runtime@sha256:26aea2fc373322996430e9c677c5661e814777b2fe44714d508f3cdf50dd1e93|reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com|4|8Gi'
  'reeditpro-staging-film-runtime-job|us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-film-runtime@sha256:50f94ec6289fbbdbba21ab11e89aed3a846015b6f26180c43da14cee7732f6ac|reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com|4|8Gi'
  'reeditpro-staging-final-render-hardening-job|us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-final-render-hardening@sha256:f2b63b0da0889b56539ddbc417643a82d05f3f3054d40f6b01f3def8a252435f|reeditpro-stg-render-sa@reeditpro.iam.gserviceaccount.com|4|8Gi'
  'reeditpro-staging-libass-burnin-validation-job|us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-libass-burnin-validation@sha256:aaf8b0095354511bc4a77654b8291ac66c913349781a8baca243aa176aa61438|reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com|4|4Gi'
  'reeditpro-staging-pro-color-image-runtime-job|us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-pro-color-image-runtime@sha256:4be2d97fc6e4dcad94aeaad4421408532ca1e5075fc3fb2bf430b380ac7e869d|reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com|4|8Gi'
  'reeditpro-staging-qa-job|us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-qa-worker@sha256:0042d3c6eb4e4ff7f1fabd21ec792ee69808e039ec39a2ac422122c2c4ed1ca3|reeditpro-stg-qa-sa@reeditpro.iam.gserviceaccount.com|2|4Gi'
  'reeditpro-staging-remotion-render-validation-job|us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-remotion-render-validation@sha256:27fbb6a509002334b827a7067d65af044cdbb58b4bada84fb3ad85b20e821baa|reeditpro-stg-render-sa@reeditpro.iam.gserviceaccount.com|4|8Gi'
  'reeditpro-staging-render-job|us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-render-worker@sha256:2c98ed1117d76779e8b06e29063168ea73a7e8ff4b730cc15d2c12e47d4eaafd|reeditpro-stg-render-sa@reeditpro.iam.gserviceaccount.com|2|4Gi'
  'reeditpro-staging-speech-runtime-job|us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-speech-runtime@sha256:5438e8b22e22343d22dd5a3f723468e00ee5e53d946af17dfd84e7613571f652|reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com|2|4Gi'
  'reeditpro-staging-tool-readiness-job|us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-tool-readiness-worker@sha256:775d0c9fffe03a3f2836e246824a5feb0b753fe3e1672f68685144fc5fc79656|reeditpro-stg-tool-ready-sa@reeditpro.iam.gserviceaccount.com|1|2Gi'
  'reeditpro-stg-deepfilternet-runtime-phase36h|us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/deepfilternet-runtime-phase36h:phase36h-linux-deepfilternet-runtime-completion-20260603-r5|reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com|4|8Gi'
  'reeditpro-stg-signalsmith-controlled-runtime-phase36j|us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/signalsmith-controlled-runtime-phase36j:phase36j-controlled-real-media-timing-stretch-20260603|reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com|4|8Gi'
)

assert_no_unfinished_execution() {
  local job_name="$1"
  local execution_name completion_time

  while IFS=$'\t' read -r execution_name completion_time; do
    [[ -z "${execution_name}" ]] && continue
    if [[ -z "${completion_time}" ]]; then
      echo "ERROR: ${job_name} still has unfinished execution ${execution_name}." >&2
      exit 1
    fi
  done < <(
    gcloud run jobs executions list \
      --job="${job_name}" \
      --project="${EXPECTED_PROJECT_ID}" \
      --region="${LEGACY_REGION}" \
      --format='value(metadata.name,status.completionTime)'
  )
}

assert_exact_legacy_cpu_job() {
  local job_json="$1"
  local job_name="$2"
  local expected_image="$3"
  local expected_service_account="$4"
  local expected_cpu="$5"
  local expected_memory="$6"
  local exact

  exact="$(jq -r \
    --arg name "${job_name}" \
    --arg image "${expected_image}" \
    --arg serviceAccount "${expected_service_account}" \
    --arg cpu "${expected_cpu}" \
    --arg memory "${expected_memory}" \
    '(
      .metadata.name == $name
      and .spec.template.spec.template.spec.serviceAccountName == $serviceAccount
      and (.spec.template.spec.template.spec.containers | length) == 1
      and .spec.template.spec.template.spec.containers[0].image == $image
      and .spec.template.spec.template.spec.containers[0].resources.limits.cpu == $cpu
      and .spec.template.spec.template.spec.containers[0].resources.limits.memory == $memory
      and ((.spec.template.spec.template.spec.containers[0].resources.limits["nvidia.com/gpu"] // "0") == "0")
    )' <<<"${job_json}")"
  if [[ "${exact}" != 'true' ]]; then
    echo "ERROR: refusing changed or GPU-enabled job definition ${job_name}." >&2
    exit 1
  fi
}

retired_count=0
already_absent_count=0
for row in "${LEGACY_CPU_MEDIA_RUNTIME_ROWS[@]}"; do
  IFS='|' read -r job_name expected_image expected_service_account \
    expected_cpu expected_memory <<<"${row}"
  if ! job_json="$(gcloud run jobs describe "${job_name}" \
    --project="${EXPECTED_PROJECT_ID}" \
    --region="${LEGACY_REGION}" --format=json 2>/dev/null)"; then
    already_absent_count=$((already_absent_count + 1))
    continue
  fi
  assert_exact_legacy_cpu_job "${job_json}" "${job_name}" \
    "${expected_image}" "${expected_service_account}" \
    "${expected_cpu}" "${expected_memory}"
  assert_no_unfinished_execution "${job_name}"
  run_gcloud run jobs delete "${job_name}" \
    --project="${EXPECTED_PROJECT_ID}" \
    --region="${LEGACY_REGION}" \
    --quiet
  retired_count=$((retired_count + 1))
done

for row in "${LEGACY_CPU_MEDIA_RUNTIME_ROWS[@]}"; do
  IFS='|' read -r job_name _rest <<<"${row}"
  if gcloud run jobs describe "${job_name}" \
    --project="${EXPECTED_PROJECT_ID}" \
    --region="${LEGACY_REGION}" >/dev/null 2>&1; then
    echo "ERROR: legacy CPU media-runtime job still exists: ${job_name}." >&2
    exit 1
  fi
done

jq -n \
  --arg receipt 'weeditpro-legacy-cpu-media-runtime-retirement-v1' \
  --arg projectId "${EXPECTED_PROJECT_ID}" \
  --arg region "${LEGACY_REGION}" \
  --argjson fixedAllowlistCount "${#LEGACY_CPU_MEDIA_RUNTIME_ROWS[@]}" \
  --argjson retiredCount "${retired_count}" \
  --argjson alreadyAbsentCount "${already_absent_count}" \
  '{
    receipt: $receipt,
    projectId: $projectId,
    region: $region,
    fixedAllowlistCount: $fixedAllowlistCount,
    retiredCount: $retiredCount,
    alreadyAbsentCount: $alreadyAbsentCount,
    unfinishedExecutionObserved: false,
    changedOrGpuEnabledJobDeleted: false,
    cloudRunServiceDeleted: false,
    artifactImageDeleted: false,
    serviceIdentityDeletedOrDisabled: false,
    historicalEvidencePreserved: true,
    newSubstantiveCpuRuntimeAuthorized: false,
    normalProcessingRequiresQualifiedL4: true,
    heavyProcessingRequiresQualifiedA100WithQualifiedL4Fallback: true,
    customerCreditsMutated: false,
    publicDeliveryAuthorized: false,
    productionReady: false
  }'
