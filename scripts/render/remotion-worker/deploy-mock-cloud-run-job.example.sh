#!/usr/bin/env bash
set -euo pipefail

# RP-RENDER-03A manual example only.
# This script builds and deploys the mock render worker Cloud Run Job definition.
# It does not execute the job, render media, read secrets, access GCS, call providers, or spend credits.

if [[ "${REEDITPRO_ALLOW_MOCK_RENDER_JOB_DEPLOY:-}" != "mock-only" ]]; then
  echo "Example script only. Set REEDITPRO_ALLOW_MOCK_RENDER_JOB_DEPLOY=mock-only to run manually."
  exit 1
fi

PROJECT_ID="${PROJECT_ID:-reeditpro}"
RUNTIME_REGION="${RUNTIME_REGION:-us-east1}"
JOB_NAME="remotion-render-worker-job"
SERVICE_ACCOUNT="sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com"
IMAGE="${RUNTIME_REGION}-docker.pkg.dev/${PROJECT_ID}/reeditpro-runtime/remotion-render-worker:mock"
PAYLOAD_FILE="scripts/render/remotion-worker/payloads/mock-preview-render.${RUNTIME_REGION}.json"
DOCKERFILE="scripts/render/remotion-worker/Dockerfile.mock"

case "${RUNTIME_REGION}" in
  us-east1)
    GCS_PREVIEWS_BUCKET="${GCS_PREVIEWS_BUCKET:-reeditpro-prod-reeditpro-us-east1-previews}"
    GCS_EXPORTS_BUCKET="${GCS_EXPORTS_BUCKET:-reeditpro-prod-reeditpro-us-east1-exports}"
    GCS_WORKER_TEMP_BUCKET="${GCS_WORKER_TEMP_BUCKET:-reeditpro-prod-reeditpro-us-east1-worker-temp}"
    ;;
  europe-west1)
    GCS_PREVIEWS_BUCKET="${GCS_PREVIEWS_BUCKET:-reeditpro-prod-reeditpro-europe-west1-previews}"
    GCS_EXPORTS_BUCKET="${GCS_EXPORTS_BUCKET:-reeditpro-prod-reeditpro-europe-west1-exports}"
    GCS_WORKER_TEMP_BUCKET="${GCS_WORKER_TEMP_BUCKET:-reeditpro-prod-reeditpro-europe-west1-worker-temp}"
    ;;
  *)
    echo "Unsupported RUNTIME_REGION=${RUNTIME_REGION}. Use us-east1 or europe-west1."
    exit 1
    ;;
esac

if [[ ! -f "${PAYLOAD_FILE}" ]]; then
  echo "Missing payload file: ${PAYLOAD_FILE}"
  exit 1
fi

if [[ ! -f "${DOCKERFILE}" ]]; then
  echo "Missing Dockerfile: ${DOCKERFILE}"
  exit 1
fi

echo "Building and pushing mock render worker image for ${RUNTIME_REGION}:"
echo "${IMAGE}"

# gcloud builds submit does not support a --file flag for choosing a non-root Dockerfile.
# Use Docker in Cloud Shell for this mock-only manual deploy path.
gcloud auth configure-docker "${RUNTIME_REGION}-docker.pkg.dev" --quiet

docker build \
  -f "${DOCKERFILE}" \
  -t "${IMAGE}" \
  .

docker push "${IMAGE}"

gcloud run jobs deploy "${JOB_NAME}" \
  --project "${PROJECT_ID}" \
  --region "${RUNTIME_REGION}" \
  --image "${IMAGE}" \
  --service-account "${SERVICE_ACCOUNT}" \
  --set-env-vars "PROJECT_ID=${PROJECT_ID},RUNTIME_REGION=${RUNTIME_REGION},SERVER_RUNTIME_MODE=mock" \
  --set-env-vars "SUPABASE_URL_SECRET_NAME=reeditpro-prod-supabase-url,SUPABASE_SERVICE_ROLE_SECRET_NAME=reeditpro-prod-supabase-service-role-key" \
  --set-env-vars "GCS_PREVIEWS_BUCKET=${GCS_PREVIEWS_BUCKET},GCS_EXPORTS_BUCKET=${GCS_EXPORTS_BUCKET},GCS_WORKER_TEMP_BUCKET=${GCS_WORKER_TEMP_BUCKET}"

cat <<EOF

Mock Cloud Run Job deployed/updated, but not executed.

To execute a manual mock test later:

PAYLOAD="\$(tr -d '\\n' < ${PAYLOAD_FILE})"
gcloud run jobs update ${JOB_NAME} \\
  --project ${PROJECT_ID} \\
  --region ${RUNTIME_REGION} \\
  --set-env-vars "^@@^RENDER_WORKER_PAYLOAD=\${PAYLOAD}@@SERVER_RUNTIME_MODE=mock"

gcloud run jobs execute ${JOB_NAME} \\
  --project ${PROJECT_ID} \\
  --region ${RUNTIME_REGION} \\
  --wait

To inspect sanitized mock output:

gcloud logging read 'resource.type="cloud_run_job" AND resource.labels.job_name="${JOB_NAME}"' \\
  --project ${PROJECT_ID} \\
  --limit 20 \\
  --format json

EOF
