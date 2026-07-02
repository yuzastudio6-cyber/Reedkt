#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/gcloud-common.sh
source "${SCRIPT_DIR}/lib/gcloud-common.sh"

# Requires REEDITPRO_CONFIRM_PROD_SETUP=true through confirm_prod_action.
confirm_prod_action

run_gcloud run jobs deploy reeditpro-tool-readiness-worker \
  --project="${GCP_PROJECT_ID}" \
  --region="${GCP_REGION}" \
  --image="$(artifact_image reeditpro-tool-readiness-worker)" \
  --service-account="$(service_account_email "${REEDITPRO_TOOL_READINESS_SERVICE_ACCOUNT}")" \
  --cpu=1 \
  --memory=2Gi \
  --tasks=1 \
  --parallelism=1 \
  --max-retries=0 \
  --set-env-vars="REEDITPRO_ENV=${REEDITPRO_ENV},WORKER_GROUP=tool_readiness_worker" \
  --args="worker,tool-readiness,placeholder"

run_gcloud run jobs execute reeditpro-tool-readiness-worker \
  --project="${GCP_PROJECT_ID}" \
  --region="${GCP_REGION}" \
  --wait
