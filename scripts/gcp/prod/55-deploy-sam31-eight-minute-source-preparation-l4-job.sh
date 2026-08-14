#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/gcloud-common.sh
source "${SCRIPT_DIR}/lib/gcloud-common.sh"

confirm_prod_action

readonly CONFIRMATION='deploy-weeditpro-sam31-eight-minute-source-preparation-l4-definition-v1'
readonly JOB='weeditpro-sam31-source-prep-l4'
readonly REGION='us-central1'
readonly CONTROL_PLANE_STATE_BUCKET='reeditpro-production-reeditpro-control-plane-state'
readonly EXPECTED_ENTRYPOINT='/app/dist-server/weeditpro-sam3_1-eight-minute-source-preparation-worker.js'

if [[ "${WEEDITPRO_DEPLOY_SAM31_SOURCE_PREPARATION_L4_DEFINITION:-false}" \
  != "${CONFIRMATION}" ]]; then
  echo 'ERROR: refusing SAM 3.1 source-preparation deployment without the exact second confirmation.' >&2
  exit 1
fi
require_env WEEDITPRO_SAM31_SOURCE_PREPARATION_L4_IMAGE_DIGEST
if [[ ! "${WEEDITPRO_SAM31_SOURCE_PREPARATION_L4_IMAGE_DIGEST}" =~ ^sha256:[0-9a-f]{64}$ ]]; then
  echo 'ERROR: WEEDITPRO_SAM31_SOURCE_PREPARATION_L4_IMAGE_DIGEST must be an exact sha256 digest.' >&2
  exit 1
fi

readonly IMAGE="${GCP_ARTIFACT_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${REEDITPRO_ARTIFACT_REPOSITORY}/reeditpro-sam31-source-preparation-l4@${WEEDITPRO_SAM31_SOURCE_PREPARATION_L4_IMAGE_DIGEST}"

# Definition only. The canonical launch owner must persist and consume one
# exact admission before it asks Cloud Run to execute this job. No deployment
# command in this file starts an execution.
run_gcloud run jobs deploy "${JOB}" \
  --project="${GCP_PROJECT_ID}" \
  --region="${REGION}" \
  --image="${IMAGE}" \
  --command=/nodejs/bin/node \
  --args="${EXPECTED_ENTRYPOINT}" \
  --service-account="$(service_account_email "${REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT}")" \
  --cpu=8 \
  --memory=32Gi \
  --gpu=1 \
  --gpu-type=nvidia-l4 \
  --no-gpu-zonal-redundancy \
  --tasks=1 \
  --parallelism=1 \
  --max-retries=0 \
  --task-timeout=3600s \
  --add-volume="name=weeditpro-sam31-source-prep-scratch,type=in-memory,size-limit=24Gi" \
  --add-volume-mount="volume=weeditpro-sam31-source-prep-scratch,mount-path=/mnt/weeditpro-private/l4-visual-evidence" \
  --set-env-vars="REEDITPRO_ENV=production,WORKER_GROUP=l4_standard_primary,GCS_CONTROL_PLANE_STATE_BUCKET=${CONTROL_PLANE_STATE_BUCKET}" \
  --labels="app=weeditpro,operation=sam31-source-preparation,route=l4-standard-primary,scale=zero"

readonly JOB_DESCRIPTION="$(gcloud run jobs describe "${JOB}" \
  --project="${GCP_PROJECT_ID}" \
  --region="${REGION}" \
  --format=json)"

DESCRIPTION="${JOB_DESCRIPTION}" \
EXPECTED_IMAGE="${IMAGE}" \
VERIFY_EXPECTED_ENTRYPOINT="${EXPECTED_ENTRYPOINT}" \
node <<'NODE'
const job = JSON.parse(process.env.DESCRIPTION || '{}')
const execution = job.spec?.template?.spec
const task = execution?.template?.spec
const container = task?.containers?.[0]
const env = Object.fromEntries((container?.env || []).map((item) => [
  item.name,
  item.value,
]))
const exact = container?.image === process.env.EXPECTED_IMAGE
  && JSON.stringify(container?.command) === JSON.stringify(['/nodejs/bin/node'])
  && JSON.stringify(container?.args) === JSON.stringify([
    process.env.VERIFY_EXPECTED_ENTRYPOINT,
  ])
  && task?.nodeSelector?.['run.googleapis.com/accelerator'] === 'nvidia-l4'
  && Number(task?.maxRetries) === 0
  && Number(execution?.taskCount) === 1
  && Number(execution?.parallelism) === 1
  && env.REEDITPRO_ENV === 'production'
  && env.WORKER_GROUP === 'l4_standard_primary'
  && env.GCS_CONTROL_PLANE_STATE_BUCKET ===
    'reeditpro-production-reeditpro-control-plane-state'
if (!exact) {
  throw new Error('Deployed SAM 3.1 source-preparation job drifted.')
}
console.log(JSON.stringify({
  job: 'weeditpro-sam31-source-prep-l4',
  definitionVerified: true,
  exactImageDigestBound: true,
  nvidiaL4Bound: true,
  maximumRetries: 0,
  taskCount: 1,
  minimumIdleInstances: 0,
  executionStartedByDeployment: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}))
NODE
