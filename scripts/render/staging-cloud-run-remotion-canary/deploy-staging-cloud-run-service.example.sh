#!/usr/bin/env bash
set -euo pipefail

if [[ "${ALLOW_STAGING_CANARY_DEPLOY:-false}" != "true" ]]; then
  echo "Set ALLOW_STAGING_CANARY_DEPLOY=true to deploy the staging render canary service." >&2
  exit 1
fi

required=(
  GCP_PROJECT_ID
  GCP_REGION
  GOOGLE_CLOUD_PROJECT
  STAGING_RENDER_CANARY_SERVICE_NAME
  STAGING_RENDER_CANARY_IMAGE
  STAGING_RENDER_CANARY_OUTPUT_BUCKET_OR_PREFIX
  STAGING_RENDER_CANARY_RUNTIME_SERVICE_ACCOUNT
)

for name in "${required[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "${name} is required." >&2
    exit 1
  fi
done

STAGING_RENDER_CANARY_MEMORY="${STAGING_RENDER_CANARY_MEMORY:-2Gi}"
STAGING_RENDER_CANARY_CPU="${STAGING_RENDER_CANARY_CPU:-2}"
STAGING_RENDER_CANARY_CONCURRENCY="${STAGING_RENDER_CANARY_CONCURRENCY:-1}"
STAGING_RENDER_CANARY_TIMEOUT_SECONDS="${STAGING_RENDER_CANARY_TIMEOUT_SECONDS:-300}"
if [[ -z "${STAGING_RENDER_CANARY_NODE_OPTIONS:-}" ]]; then
  STAGING_RENDER_CANARY_NODE_OPTIONS="--max-old-space-size=1536"
fi

if [[ "${GOOGLE_CLOUD_PROJECT}" != "${GCP_PROJECT_ID}" ]]; then
  echo "GOOGLE_CLOUD_PROJECT must match GCP_PROJECT_ID for the staging canary service." >&2
  exit 1
fi

if [[ "${GCP_REGION}" != "us-east1" ]]; then
  echo "This staging canary deploy scaffold is pinned to GCP_REGION=us-east1." >&2
  exit 1
fi

case "${GCP_PROJECT_ID} ${GOOGLE_CLOUD_PROJECT} ${STAGING_RENDER_CANARY_SERVICE_NAME} ${STAGING_RENDER_CANARY_OUTPUT_BUCKET_OR_PREFIX}" in
  *prod*|*production*|*live*)
    echo "Refusing to deploy a production-looking staging canary target." >&2
    exit 1
    ;;
esac

if [[ ! "${GCP_PROJECT_ID} ${STAGING_RENDER_CANARY_SERVICE_NAME} ${STAGING_RENDER_CANARY_OUTPUT_BUCKET_OR_PREFIX}" =~ staging|canary|smoke|test ]]; then
  echo "Project, service, and bucket/prefix must be staging/canary/smoke scoped." >&2
  exit 1
fi

if [[ "${STAGING_RENDER_CANARY_MEMORY}" != "2Gi" ]]; then
  echo "STAGING_RENDER_CANARY_MEMORY must be exactly 2Gi for this bounded staging Remotion canary." >&2
  exit 1
fi

if [[ "${STAGING_RENDER_CANARY_CPU}" != "2" ]]; then
  echo "STAGING_RENDER_CANARY_CPU must be exactly 2 for this bounded staging Remotion canary." >&2
  exit 1
fi

if [[ "${STAGING_RENDER_CANARY_CONCURRENCY}" != "1" ]]; then
  echo "STAGING_RENDER_CANARY_CONCURRENCY must be exactly 1 for this bounded staging Remotion canary." >&2
  exit 1
fi

if [[ "${STAGING_RENDER_CANARY_TIMEOUT_SECONDS}" != "300" ]]; then
  echo "STAGING_RENDER_CANARY_TIMEOUT_SECONDS must be exactly 300 for this bounded staging Remotion canary." >&2
  exit 1
fi

if [[ "${STAGING_RENDER_CANARY_NODE_OPTIONS}" != "--max-old-space-size=1536" ]]; then
  echo "STAGING_RENDER_CANARY_NODE_OPTIONS must be exactly --max-old-space-size=1536." >&2
  exit 1
fi

gcloud run deploy "${STAGING_RENDER_CANARY_SERVICE_NAME}" \
  --project "${GCP_PROJECT_ID}" \
  --region "${GCP_REGION}" \
  --image "${STAGING_RENDER_CANARY_IMAGE}" \
  --service-account "${STAGING_RENDER_CANARY_RUNTIME_SERVICE_ACCOUNT}" \
  --no-allow-unauthenticated \
  --memory="${STAGING_RENDER_CANARY_MEMORY}" \
  --cpu="${STAGING_RENDER_CANARY_CPU}" \
  --concurrency="${STAGING_RENDER_CANARY_CONCURRENCY}" \
  --max-instances=1 \
  --timeout=300 \
  --set-env-vars "STAGING_RENDER_CANARY_MODE=staging_cloud_run_remotion_canary,GCP_PROJECT_ID=${GCP_PROJECT_ID},GCP_REGION=${GCP_REGION},GOOGLE_CLOUD_PROJECT=${GOOGLE_CLOUD_PROJECT},STAGING_RENDER_CANARY_OUTPUT_BUCKET_OR_PREFIX=${STAGING_RENDER_CANARY_OUTPUT_BUCKET_OR_PREFIX},STAGING_RENDER_CANARY_EXPECTED_HOST_SUFFIX=.run.app,STAGING_RENDER_CANARY_TIMEOUT_SECONDS=${STAGING_RENDER_CANARY_TIMEOUT_SECONDS},STAGING_RENDER_CANARY_MAX_ARTIFACT_BYTES=750000,STAGING_RENDER_CANARY_MEMORY=${STAGING_RENDER_CANARY_MEMORY},STAGING_RENDER_CANARY_CPU=${STAGING_RENDER_CANARY_CPU},STAGING_RENDER_CANARY_CONCURRENCY=${STAGING_RENDER_CANARY_CONCURRENCY},NODE_OPTIONS=${STAGING_RENDER_CANARY_NODE_OPTIONS}" \
  --quiet

echo "Staging render canary service deployed/updated. This script does not execute the canary."
