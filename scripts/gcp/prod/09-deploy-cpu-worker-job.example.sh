#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/gcloud-common.sh
source "${SCRIPT_DIR}/lib/gcloud-common.sh"

# Requires REEDITPRO_CONFIRM_PROD_SETUP=true through confirm_prod_action.
confirm_prod_action

run_gcloud run jobs deploy reeditpro-cpu-analysis-worker \
  --project="${GCP_PROJECT_ID}" \
  --region="${GCP_REGION}" \
  --image="$(artifact_image reeditpro-cpu-worker)" \
  --service-account="$(service_account_email "${REEDITPRO_CPU_WORKER_SERVICE_ACCOUNT}")" \
  --cpu=2 \
  --memory=4Gi \
  --tasks=1 \
  --parallelism=1 \
  --max-retries=1 \
  --set-env-vars="REEDITPRO_ENV=${REEDITPRO_ENV},WORKER_GROUP=cpu_analysis_worker" \
  --args="worker,cpu-analysis,placeholder"
