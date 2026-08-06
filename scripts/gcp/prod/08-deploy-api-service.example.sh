#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/gcloud-common.sh
source "${SCRIPT_DIR}/lib/gcloud-common.sh"

# Requires REEDITPRO_CONFIRM_PROD_SETUP=true through confirm_prod_action.
confirm_prod_action
require_env REEDITPRO_API_ALLOWED_CORS_ORIGINS
require_env REEDITPRO_SUPABASE_URL_SECRET_VERSION
require_env REEDITPRO_SUPABASE_ANON_KEY_SECRET_VERSION
require_env REEDITPRO_SUPABASE_SERVICE_ROLE_KEY_SECRET_VERSION
require_env REEDITPRO_INTERNAL_SERVICE_TOKEN_SECRET_VERSION

require_pinned_secret_version() {
  local name="$1"
  if [[ ! "${!name}" =~ ^[1-9][0-9]*$ ]]; then
    echo "ERROR: ${name} must be a pinned positive numeric Secret Manager version." >&2
    exit 1
  fi
}

for version_name in \
  REEDITPRO_SUPABASE_URL_SECRET_VERSION \
  REEDITPRO_SUPABASE_ANON_KEY_SECRET_VERSION \
  REEDITPRO_SUPABASE_SERVICE_ROLE_KEY_SECRET_VERSION \
  REEDITPRO_INTERNAL_SERVICE_TOKEN_SECRET_VERSION; do
  require_pinned_secret_version "${version_name}"
done

if [[ "${REEDITPRO_API_ALLOWED_CORS_ORIGINS}" == *"@"* ]]; then
  echo "ERROR: REEDITPRO_API_ALLOWED_CORS_ORIGINS cannot contain the deployment delimiter '@'." >&2
  exit 1
fi

run_gcloud run deploy reeditpro-api \
  --project="${GCP_PROJECT_ID}" \
  --region="${GCP_REGION}" \
  --image="$(artifact_image reeditpro-api)" \
  --service-account="$(service_account_email "${REEDITPRO_API_SERVICE_ACCOUNT}")" \
  --min-instances=0 \
  --max-instances=10 \
  --concurrency=40 \
  --cpu=1 \
  --memory=1Gi \
  --port=8080 \
  --execution-environment=gen2 \
  --ingress=internal-and-cloud-load-balancing \
  --set-env-vars="^@^REEDITPRO_ENV=${REEDITPRO_ENV}@E2E_RUNTIME_MODE=cloud_run@WORKER_RUNTIME_MODE=disabled@STORAGE_MODE=gcs_disabled@REEDITPRO_DISABLE_DOTENV=true@API_ALLOWED_CORS_ORIGINS=${REEDITPRO_API_ALLOWED_CORS_ORIGINS}@GOOGLE_CLOUD_PROJECT_ID=${GCP_PROJECT_ID}@GOOGLE_CLOUD_REGION=${GCP_REGION}" \
  --set-secrets="SUPABASE_URL=${REEDITPRO_SECRET_PREFIX}-supabase-url:${REEDITPRO_SUPABASE_URL_SECRET_VERSION},SUPABASE_ANON_KEY=${REEDITPRO_SECRET_PREFIX}-supabase-anon-key:${REEDITPRO_SUPABASE_ANON_KEY_SECRET_VERSION},SUPABASE_SERVICE_ROLE_KEY=${REEDITPRO_SECRET_PREFIX}-supabase-service-role-key:${REEDITPRO_SUPABASE_SERVICE_ROLE_KEY_SECRET_VERSION},REEDITPRO_INTERNAL_SERVICE_TOKEN=${REEDITPRO_SECRET_PREFIX}-api-internal-service-token:${REEDITPRO_INTERNAL_SERVICE_TOKEN_SECRET_VERSION}" \
  --no-allow-unauthenticated
