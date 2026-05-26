#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/gcloud-common.sh
source "${SCRIPT_DIR}/lib/gcloud-common.sh"

# Requires REEDITPRO_CONFIRM_PROD_SETUP=true through confirm_prod_action.
confirm_prod_action

grant_project_role() {
  local account_id="$1"
  local role="$2"
  run_gcloud projects add-iam-policy-binding "${GCP_PROJECT_ID}" \
    --member="serviceAccount:$(service_account_email "${account_id}")" \
    --role="${role}" \
    --condition=None \
    --quiet
}

grant_bucket_role() {
  local purpose="$1"
  local account_id="$2"
  local role="$3"
  run_gcloud storage buckets add-iam-policy-binding "gs://$(bucket_name "${purpose}")" \
    --project="${GCP_PROJECT_ID}" \
    --member="serviceAccount:$(service_account_email "${account_id}")" \
    --role="${role}" \
    --quiet
}

grant_secret_access() {
  local secret_name="$1"
  local account_id="$2"
  run_gcloud secrets add-iam-policy-binding "${secret_name}" \
    --project="${GCP_PROJECT_ID}" \
    --member="serviceAccount:$(service_account_email "${account_id}")" \
    --role="roles/secretmanager.secretAccessor" \
    --condition=None \
    --quiet
}

for account_id in \
  "${REEDITPRO_API_SERVICE_ACCOUNT}" \
  "${REEDITPRO_CPU_WORKER_SERVICE_ACCOUNT}" \
  "${REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT}" \
  "${REEDITPRO_RENDER_WORKER_SERVICE_ACCOUNT}" \
  "${REEDITPRO_QA_WORKER_SERVICE_ACCOUNT}" \
  "${REEDITPRO_TOOL_READINESS_SERVICE_ACCOUNT}"; do
  grant_project_role "${account_id}" roles/logging.logWriter
  grant_project_role "${account_id}" roles/monitoring.metricWriter
done

grant_project_role "${REEDITPRO_API_SERVICE_ACCOUNT}" roles/run.invoker

for secret_name in SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY PROVIDER_GATEWAY_SHARED_SECRET WORKER_WEBHOOK_SECRET STRIPE_SECRET_KEY; do
  grant_secret_access "${secret_name}" "${REEDITPRO_API_SERVICE_ACCOUNT}"
done

grant_bucket_role source-media "${REEDITPRO_API_SERVICE_ACCOUNT}" roles/storage.objectViewer
grant_bucket_role previews "${REEDITPRO_API_SERVICE_ACCOUNT}" roles/storage.objectViewer
grant_bucket_role final-exports "${REEDITPRO_API_SERVICE_ACCOUNT}" roles/storage.objectViewer

for purpose in source-media proxy-media; do
  grant_bucket_role "${purpose}" "${REEDITPRO_CPU_WORKER_SERVICE_ACCOUNT}" roles/storage.objectViewer
done
for purpose in proxy-media analysis-artifacts transcripts worker-temp; do
  grant_bucket_role "${purpose}" "${REEDITPRO_CPU_WORKER_SERVICE_ACCOUNT}" roles/storage.objectCreator
done

for purpose in source-media proxy-media worker-temp; do
  grant_bucket_role "${purpose}" "${REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT}" roles/storage.objectViewer
done
for purpose in transcripts masks generated-assets analysis-artifacts worker-temp; do
  grant_bucket_role "${purpose}" "${REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT}" roles/storage.objectCreator
done

for purpose in source-media proxy-media generated-assets masks transcripts analysis-artifacts worker-temp; do
  grant_bucket_role "${purpose}" "${REEDITPRO_RENDER_WORKER_SERVICE_ACCOUNT}" roles/storage.objectViewer
done
for purpose in previews final-exports qa-artifacts worker-temp; do
  grant_bucket_role "${purpose}" "${REEDITPRO_RENDER_WORKER_SERVICE_ACCOUNT}" roles/storage.objectCreator
done

for purpose in analysis-artifacts previews final-exports masks transcripts generated-assets; do
  grant_bucket_role "${purpose}" "${REEDITPRO_QA_WORKER_SERVICE_ACCOUNT}" roles/storage.objectViewer
done
grant_bucket_role qa-artifacts "${REEDITPRO_QA_WORKER_SERVICE_ACCOUNT}" roles/storage.objectCreator

grant_bucket_role qa-artifacts "${REEDITPRO_TOOL_READINESS_SERVICE_ACCOUNT}" roles/storage.objectCreator
