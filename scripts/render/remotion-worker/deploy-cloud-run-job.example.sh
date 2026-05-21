#!/usr/bin/env bash
set -euo pipefail

# RP-RENDER-02 example only.
# Do not run this script from automation.
# It documents the future Cloud Run Job deployment shape for the mock render worker image.
# It does not execute production renders.

if [[ "${REEDITPRO_ALLOW_EXAMPLE_CLOUD_RUN_DEPLOY:-}" != "example-only" ]]; then
  echo "Example script only. Set REEDITPRO_ALLOW_EXAMPLE_CLOUD_RUN_DEPLOY=example-only to run manually in a future deployment milestone."
  exit 1
fi

PROJECT_ID="${PROJECT_ID:-reeditpro}"
RUNTIME_REGION="${RUNTIME_REGION:-us-east1}"
JOB_NAME="remotion-render-worker-job"
SERVICE_ACCOUNT="sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com"
IMAGE="${RUNTIME_REGION}-docker.pkg.dev/${PROJECT_ID}/reeditpro-runtime/remotion-render-worker:mock"

echo "Future steps only:"
echo "1. Build image: ${IMAGE}"
echo "2. Push image to Artifact Registry."
echo "3. Create or update Cloud Run Job ${JOB_NAME} in ${RUNTIME_REGION}."
echo "4. Do not execute production renders yet."

# Future deployment shape, intentionally left as guarded example commands:
gcloud builds submit \
  --project "${PROJECT_ID}" \
  --tag "${IMAGE}" \
  .

gcloud run jobs deploy "${JOB_NAME}" \
  --project "${PROJECT_ID}" \
  --region "${RUNTIME_REGION}" \
  --image "${IMAGE}" \
  --service-account "${SERVICE_ACCOUNT}" \
  --set-env-vars "PROJECT_ID=${PROJECT_ID},RUNTIME_REGION=${RUNTIME_REGION},SERVER_RUNTIME_MODE=mock" \
  --set-env-vars "SUPABASE_URL_SECRET_NAME=reeditpro-prod-supabase-url,SUPABASE_SERVICE_ROLE_SECRET_NAME=reeditpro-prod-supabase-service-role-key" \
  --set-env-vars "GCS_PREVIEWS_BUCKET=TODO,GCS_EXPORTS_BUCKET=TODO,GCS_WORKER_TEMP_BUCKET=TODO"

echo "Deployment shape recorded. Do not run Cloud Run Job executions for production renders in RP-RENDER-02."
