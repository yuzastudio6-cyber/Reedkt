#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/gcloud-common.sh
source "${SCRIPT_DIR}/lib/gcloud-common.sh"

confirm_prod_action

readonly CONFIRMATION='run-weeditpro-sam31-source-preparation-private-l4-qualification-v1'
readonly JOB='weeditpro-sam31-source-prep-l4-private-qualification'
readonly REGION='us-central1'
readonly CONTROL_PLANE_BUCKET='reeditpro-production-reeditpro-control-plane-state'
readonly ENTRYPOINT='/app/dist-server/weeditpro-sam3_1-source-preparation-private-qualification-worker.js'

if [[ "${WEEDITPRO_RUN_SAM31_SOURCE_PREPARATION_PRIVATE_QUALIFICATION:-}" \
  != "${CONFIRMATION}" ]]; then
  echo 'ERROR: refusing the private L4 qualification without exact confirmation.' >&2
  exit 1
fi
require_env WEEDITPRO_SAM31_SOURCE_PREPARATION_L4_IMAGE_DIGEST
require_env WEEDITPRO_SAM31_SOURCE_PREPARATION_IMAGE_BUILD_RECEIPT_ID
require_env WEEDITPRO_SAM31_SOURCE_PREPARATION_IMAGE_BUILD_RECEIPT_HASH
require_env WEEDITPRO_SAM31_SOURCE_PREPARATION_IMAGE_SUPPLY_CHAIN_ID
require_env WEEDITPRO_SAM31_SOURCE_PREPARATION_IMAGE_SUPPLY_CHAIN_HASH

readonly DIGEST="${WEEDITPRO_SAM31_SOURCE_PREPARATION_L4_IMAGE_DIGEST}"
readonly BUILD_HASH="${WEEDITPRO_SAM31_SOURCE_PREPARATION_IMAGE_BUILD_RECEIPT_HASH}"
readonly SUPPLY_HASH="${WEEDITPRO_SAM31_SOURCE_PREPARATION_IMAGE_SUPPLY_CHAIN_HASH}"
if [[ ! "${DIGEST}" =~ ^sha256:[0-9a-f]{64}$ \
  || ! "${BUILD_HASH}" =~ ^sha256:[0-9a-f]{64}$ \
  || ! "${SUPPLY_HASH}" =~ ^sha256:[0-9a-f]{64}$ ]]; then
  echo 'ERROR: exact image/build/supply-chain SHA-256 bindings are required.' >&2
  exit 1
fi

readonly IMAGE="${GCP_ARTIFACT_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${REEDITPRO_ARTIFACT_REPOSITORY}/reeditpro-sam31-source-preparation-l4@${DIGEST}"
readonly RUN_ID="sam31-source-prep-l4-${DIGEST:7:16}-$(date -u +%Y%m%dT%H%M%SZ)"

# This is a purpose-bound, platform-funded private qualification definition.
# It contains the exact immutable build/supply-chain identities and accepts no
# source path, URL, bytes, command, model, checkpoint, or customer credit input.
run_gcloud run jobs deploy "${JOB}" \
  --project="${GCP_PROJECT_ID}" \
  --region="${REGION}" \
  --image="${IMAGE}" \
  --command=/usr/local/bin/node \
  --args="${ENTRYPOINT}" \
  --service-account="$(service_account_email "${REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT}")" \
  --cpu=8 \
  --memory=32Gi \
  --gpu=1 \
  --gpu-type=nvidia-l4 \
  --no-gpu-zonal-redundancy \
  --tasks=1 \
  --parallelism=1 \
  --max-retries=0 \
  --task-timeout=7200s \
  --add-volume="name=weeditpro-sam31-source-prep-qualification-scratch,type=in-memory,size-limit=24Gi" \
  --add-volume-mount="volume=weeditpro-sam31-source-prep-qualification-scratch,mount-path=/mnt/weeditpro-private/l4-visual-evidence" \
  --set-env-vars="REEDITPRO_ENV=production,WORKER_GROUP=l4_standard_primary,GCS_CONTROL_PLANE_STATE_BUCKET=${CONTROL_PLANE_BUCKET},WEEDITPRO_SAM31_SOURCE_PREPARATION_QUALIFICATION_RUN_ID=${RUN_ID},WEEDITPRO_SAM31_SOURCE_PREPARATION_IMAGE_DIGEST=${DIGEST},WEEDITPRO_SAM31_SOURCE_PREPARATION_IMAGE_BUILD_RECEIPT_ID=${WEEDITPRO_SAM31_SOURCE_PREPARATION_IMAGE_BUILD_RECEIPT_ID},WEEDITPRO_SAM31_SOURCE_PREPARATION_IMAGE_BUILD_RECEIPT_HASH=${BUILD_HASH},WEEDITPRO_SAM31_SOURCE_PREPARATION_IMAGE_SUPPLY_CHAIN_ID=${WEEDITPRO_SAM31_SOURCE_PREPARATION_IMAGE_SUPPLY_CHAIN_ID},WEEDITPRO_SAM31_SOURCE_PREPARATION_IMAGE_SUPPLY_CHAIN_HASH=${SUPPLY_HASH}" \
  --labels="app=weeditpro,operation=sam31-source-preparation-private-qualification,route=l4-standard-primary,scale=zero"

readonly DESCRIPTION="$(gcloud run jobs describe "${JOB}" \
  --project="${GCP_PROJECT_ID}" --region="${REGION}" --format=json)"
DESCRIPTION="${DESCRIPTION}" EXPECTED_IMAGE="${IMAGE}" \
EXPECTED_ENTRYPOINT="${ENTRYPOINT}" EXPECTED_RUN_ID="${RUN_ID}" \
EXPECTED_BUILD_HASH="${BUILD_HASH}" EXPECTED_SUPPLY_HASH="${SUPPLY_HASH}" \
node <<'NODE'
const job = JSON.parse(process.env.DESCRIPTION || '{}')
const task = job.spec?.template?.spec?.template?.spec
const container = task?.containers?.[0]
const env = Object.fromEntries((container?.env || []).map((item) => [
  item.name,
  item.value,
]))
const exact = container?.image === process.env.EXPECTED_IMAGE
  && JSON.stringify(container?.command) === JSON.stringify(['/usr/local/bin/node'])
  && JSON.stringify(container?.args) === JSON.stringify([
    process.env.EXPECTED_ENTRYPOINT,
  ])
  && task?.nodeSelector?.['run.googleapis.com/accelerator'] === 'nvidia-l4'
  && Number(task?.maxRetries) === 0
  && Number(task?.taskCount) === 1
  && Number(task?.parallelism) === 1
  && env.WEEDITPRO_SAM31_SOURCE_PREPARATION_QUALIFICATION_RUN_ID ===
    process.env.EXPECTED_RUN_ID
  && env.WEEDITPRO_SAM31_SOURCE_PREPARATION_IMAGE_BUILD_RECEIPT_HASH ===
    process.env.EXPECTED_BUILD_HASH
  && env.WEEDITPRO_SAM31_SOURCE_PREPARATION_IMAGE_SUPPLY_CHAIN_HASH ===
    process.env.EXPECTED_SUPPLY_HASH
if (!exact) throw new Error('Private L4 qualification definition drifted.')
NODE

run_gcloud run jobs execute "${JOB}" \
  --project="${GCP_PROJECT_ID}" \
  --region="${REGION}" \
  --wait \
  --format=json

printf 'qualification_run_id=%s\n' "${RUN_ID}"
printf 'immutable_image=%s\n' "${IMAGE}"
printf 'minimum_idle_instances=0\n'
printf 'customer_credits_mutated=false\n'
printf 'public_delivery_authorized=false\n'
printf 'production_authority_granted=false\n'
