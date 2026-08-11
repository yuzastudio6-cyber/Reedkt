#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/gcloud-common.sh
source "${SCRIPT_DIR}/lib/gcloud-common.sh"

# Requires REEDITPRO_CONFIRM_PROD_SETUP=true through confirm_prod_action.
confirm_prod_action

readonly L4_DEFINITION_CONFIRMATION='deploy-weeditpro-qualified-l4-job-definitions-v1'
readonly SAM31_L4_FALLBACK_REGION='us-central1'
readonly CONTROL_PLANE_STATE_BUCKET='reeditpro-production-reeditpro-control-plane-state'
readonly MASK_BUCKET='reeditpro-production-reeditpro-masks'
if [[ "${WEEDITPRO_DEPLOY_QUALIFIED_L4_JOB_DEFINITIONS:-false}" \
  != "${L4_DEFINITION_CONFIRMATION}" ]]; then
  echo 'ERROR: refusing L4 job-definition deployment without the exact second confirmation.' >&2
  exit 1
fi
for digest_name in \
  WEEDITPRO_L4_MEDIA_IMAGE_DIGEST \
  WEEDITPRO_SAM31_IMAGE_DIGEST \
  WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_DIGEST; do
  require_env "${digest_name}"
  if [[ ! "${!digest_name}" =~ ^sha256:[0-9a-f]{64}$ ]]; then
    echo "ERROR: ${digest_name} must be an exact sha256 digest." >&2
    exit 1
  fi
done

readonly L4_MEDIA_IMAGE="${GCP_ARTIFACT_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${REEDITPRO_ARTIFACT_REPOSITORY}/reeditpro-l4-media-worker@${WEEDITPRO_L4_MEDIA_IMAGE_DIGEST}"
readonly SAM31_IMAGE="${GCP_ARTIFACT_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${REEDITPRO_ARTIFACT_REPOSITORY}/reeditpro-sam31-gpu@${WEEDITPRO_SAM31_IMAGE_DIGEST}"
readonly TRACK_ALL_L4_TASK_QA_IMAGE="${GCP_ARTIFACT_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${REEDITPRO_ARTIFACT_REPOSITORY}/reeditpro-track-all-l4-task-qa@${WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_DIGEST}"

# Active quality-first L4 routes. Heavy primary work is not deployed here: it
# is created as a one-shot A100 80 GB Vertex Custom Job by the canonical
# backend launch owner. Both Cloud Run jobs remain at zero when no execution
# exists; Cloud Run Job task retries stay zero because the canonical attempt
# owner classifies and funds every retry.
run_gcloud run jobs deploy reeditpro-professional-l4 \
  --project="${GCP_PROJECT_ID}" \
  --region="${GCP_REGION}" \
  --image="${L4_MEDIA_IMAGE}" \
  --service-account="$(service_account_email "${REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT}")" \
  --cpu=8 \
  --memory=32Gi \
  --gpu=1 \
  --gpu-type=nvidia-l4 \
  --no-gpu-zonal-redundancy \
  --tasks=1 \
  --parallelism=1 \
  --max-retries=0 \
  --add-volume="mount-path=/mnt/weeditpro-private/l4-visual-evidence,type=in-memory,size-limit=24Gi" \
  --set-env-vars="REEDITPRO_ENV=production,WORKER_GROUP=l4_standard_primary,GCS_CONTROL_PLANE_STATE_BUCKET=${CONTROL_PLANE_STATE_BUCKET}" \
  --labels="app=weeditpro,route=l4-standard-primary,scale=zero"

run_gcloud run jobs deploy reeditpro-sam31-l4-fallback \
  --project="${GCP_PROJECT_ID}" \
  --region="${SAM31_L4_FALLBACK_REGION}" \
  --image="${SAM31_IMAGE}" \
  --service-account="$(service_account_email "${REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT}")" \
  --cpu=8 \
  --memory=32Gi \
  --gpu=1 \
  --gpu-type=nvidia-l4 \
  --no-gpu-zonal-redundancy \
  --tasks=1 \
  --parallelism=1 \
  --max-retries=0 \
  --set-env-vars="REEDITPRO_ENV=${REEDITPRO_ENV},WORKER_GROUP=l4_heavy_fallback" \
  --labels="app=weeditpro,route=l4-heavy-fallback,scale=zero"

run_gcloud run jobs deploy reeditpro-track-all-mask-qa-l4 \
  --project="${GCP_PROJECT_ID}" \
  --region="${GCP_REGION}" \
  --image="${TRACK_ALL_L4_TASK_QA_IMAGE}" \
  --service-account="$(service_account_email "${REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT}")" \
  --cpu=8 \
  --memory=32Gi \
  --gpu=1 \
  --gpu-type=nvidia-l4 \
  --no-gpu-zonal-redundancy \
  --tasks=1 \
  --parallelism=1 \
  --max-retries=0 \
  --add-volume="mount-path=/mnt/reeditpro,type=cloud-storage,bucket=${MASK_BUCKET},readonly=false,mount-options=uid=65532;gid=65532;implicit-dirs=true" \
  --set-env-vars="REEDITPRO_ENV=production,WORKER_GROUP=l4_standard_primary,WEEDITPRO_GPU_ACCELERATOR_CLASS=nvidia_l4" \
  --labels="app=weeditpro,operation=track-all-mask-qa,route=l4-standard-primary,scale=zero"

echo 'Three L4 job definitions deployed from exact image digests.'
echo 'No execution was started. Canonical release, funded admission, and terminal cost ownership remain mandatory.'
