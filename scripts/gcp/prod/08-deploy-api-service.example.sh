#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/gcloud-common.sh
source "${SCRIPT_DIR}/lib/gcloud-common.sh"

# Requires REEDITPRO_CONFIRM_PROD_SETUP=true through confirm_prod_action.
confirm_prod_action

run_gcloud run deploy reeditpro-api \
  --project="${GCP_PROJECT_ID}" \
  --region="${GCP_REGION}" \
  --image="$(artifact_image reeditpro-api)" \
  --service-account="$(service_account_email "${REEDITPRO_API_SERVICE_ACCOUNT}")" \
  --min-instances=0 \
  --cpu=1 \
  --memory=1Gi \
  --set-env-vars="REEDITPRO_ENV=${REEDITPRO_ENV}" \
  --set-secrets="SUPABASE_URL=SUPABASE_URL:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,PROVIDER_GATEWAY_SHARED_SECRET=PROVIDER_GATEWAY_SHARED_SECRET:latest,WORKER_WEBHOOK_SECRET=WORKER_WEBHOOK_SECRET:latest" \
  --no-allow-unauthenticated
