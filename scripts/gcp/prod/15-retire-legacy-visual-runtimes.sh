#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/gcloud-common.sh
source "${SCRIPT_DIR}/lib/gcloud-common.sh"

confirm_prod_action

if [[ "${REEDITPRO_RETIRE_LEGACY_VISUAL_RUNTIMES:-false}" != "true" ]]; then
  echo "ERROR: refusing to retire legacy visual runtimes without the exact retirement confirmation." >&2
  echo "Set REEDITPRO_RETIRE_LEGACY_VISUAL_RUNTIMES=true after reviewing the fixed allowlist." >&2
  exit 1
fi

readonly LEGACY_REGION="us-central1"
readonly LEGACY_QWEN_SERVICE="reeditpro-qwen2-5-vl-l4-worker"
readonly LEGACY_QWEN_CALLER_IDENTITY="qwen-private-caller-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com"
readonly -a LEGACY_VISUAL_JOBS=(
  "reeditpro-qwen2-5-vl-private-caller"
  "reeditpro-staging-sam2-runtime-job"
  "reeditpro-stg-vlm-runtime-phase39c"
  "reeditpro-stg-vlm-runtime-phase39c-l4-compatible"
  "reeditpro-stg-vlm-runtime-phase39c-perception-canary"
  "reeditpro-stg-vlm-runtime-phase39c-sglang"
  "reeditpro-stg-vlm-runtime-phase39c-sglang-fixed-smoke"
  "reeditpro-stg-vlm-runtime-phase39c-sglang-kernel-smoke"
  "reeditpro-stg-vlm-runtime-phase39c-structured-output"
  "reeditpro-stg-vlm-runtime-phase39c-structured-output-compat"
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
      --project="${GCP_PROJECT_ID}" \
      --region="${LEGACY_REGION}" \
      --format='value(metadata.name,status.completionTime)'
  )
}

for job_name in "${LEGACY_VISUAL_JOBS[@]}"; do
  if gcloud run jobs describe "${job_name}" \
    --project="${GCP_PROJECT_ID}" \
    --region="${LEGACY_REGION}" >/dev/null 2>&1; then
    assert_no_unfinished_execution "${job_name}"
    run_gcloud run jobs delete "${job_name}" \
      --project="${GCP_PROJECT_ID}" \
      --region="${LEGACY_REGION}" \
      --quiet
  fi
done

if gcloud run services describe "${LEGACY_QWEN_SERVICE}" \
  --project="${GCP_PROJECT_ID}" \
  --region="${LEGACY_REGION}" >/dev/null 2>&1; then
  run_gcloud run services delete "${LEGACY_QWEN_SERVICE}" \
    --project="${GCP_PROJECT_ID}" \
    --region="${LEGACY_REGION}" \
    --quiet
fi

if gcloud iam service-accounts describe "${LEGACY_QWEN_CALLER_IDENTITY}" \
  --project="${GCP_PROJECT_ID}" >/dev/null 2>&1; then
  run_gcloud iam service-accounts disable "${LEGACY_QWEN_CALLER_IDENTITY}" \
    --project="${GCP_PROJECT_ID}" \
    --quiet
fi

for job_name in "${LEGACY_VISUAL_JOBS[@]}"; do
  if gcloud run jobs describe "${job_name}" \
    --project="${GCP_PROJECT_ID}" \
    --region="${LEGACY_REGION}" >/dev/null 2>&1; then
    echo "ERROR: legacy visual job still exists: ${job_name}." >&2
    exit 1
  fi
done

if gcloud run services describe "${LEGACY_QWEN_SERVICE}" \
  --project="${GCP_PROJECT_ID}" \
  --region="${LEGACY_REGION}" >/dev/null 2>&1; then
  echo "ERROR: legacy Qwen visual service still exists." >&2
  exit 1
fi

echo "Legacy SAM2/Qwen visual execution definitions are retired."
echo "Immutable historical image digests are retained for audit readback only."
echo "Fresh visual work must use Orchestra -> visual_intelligence; fresh tracking must use Orchestra -> track_all -> SAM 3.1 after qualification."
