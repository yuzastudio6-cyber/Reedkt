#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/gcloud-common.sh
source "${SCRIPT_DIR}/lib/gcloud-common.sh"

# Requires REEDITPRO_CONFIRM_PROD_SETUP=true through confirm_prod_action.
confirm_prod_action

# Active quality-first L4 routes. Heavy primary work is not deployed here: it
# is created as a one-shot A100 80 GB Google Cloud Batch job by the canonical
# backend launch owner. Both Cloud Run jobs remain at zero when no execution
# exists; Cloud Run Job task retries stay zero because the canonical attempt
# owner classifies and funds every retry.
run_gcloud run jobs deploy reeditpro-professional-l4 \
  --project="${GCP_PROJECT_ID}" \
  --region="${GCP_REGION}" \
  --image="$(artifact_image reeditpro-l4-media-worker)" \
  --service-account="$(service_account_email "${REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT}")" \
  --cpu=8 \
  --memory=32Gi \
  --gpu=1 \
  --gpu-type=nvidia-l4 \
  --no-gpu-zonal-redundancy \
  --tasks=1 \
  --parallelism=1 \
  --max-retries=0 \
  --set-env-vars="REEDITPRO_ENV=${REEDITPRO_ENV},WORKER_GROUP=l4_standard_primary" \
  --labels="app=weeditpro,route=l4-standard-primary,scale=zero"

run_gcloud run jobs deploy reeditpro-sam31-l4-fallback \
  --project="${GCP_PROJECT_ID}" \
  --region="${GCP_REGION}" \
  --image="$(artifact_image reeditpro-sam31-gpu)" \
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
