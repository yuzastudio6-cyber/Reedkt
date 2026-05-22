#!/usr/bin/env bash
set -euo pipefail

if [[ "${ALLOW_STAGING_CANARY_DEPLOY:-false}" != "true" ]]; then
  echo "Set ALLOW_STAGING_CANARY_DEPLOY=true to deploy the staging render canary service." >&2
  exit 1
fi

required=(
  GCP_PROJECT_ID
  GCP_REGION
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

case "${GCP_PROJECT_ID} ${STAGING_RENDER_CANARY_SERVICE_NAME} ${STAGING_RENDER_CANARY_OUTPUT_BUCKET_OR_PREFIX}" in
  *prod*|*production*|*live*)
    echo "Refusing to deploy a production-looking staging canary target." >&2
    exit 1
    ;;
esac

if [[ ! "${GCP_PROJECT_ID} ${STAGING_RENDER_CANARY_SERVICE_NAME} ${STAGING_RENDER_CANARY_OUTPUT_BUCKET_OR_PREFIX}" =~ staging|canary|smoke|test ]]; then
  echo "Project, service, and bucket/prefix must be staging/canary/smoke scoped." >&2
  exit 1
fi

gcloud run deploy "${STAGING_RENDER_CANARY_SERVICE_NAME}" \
  --project "${GCP_PROJECT_ID}" \
  --region "${GCP_REGION}" \
  --image "${STAGING_RENDER_CANARY_IMAGE}" \
  --service-account "${STAGING_RENDER_CANARY_RUNTIME_SERVICE_ACCOUNT}" \
  --no-allow-unauthenticated \
  --set-env-vars "STAGING_RENDER_CANARY_MODE=staging_cloud_run_remotion_canary,STAGING_RENDER_CANARY_OUTPUT_BUCKET_OR_PREFIX=${STAGING_RENDER_CANARY_OUTPUT_BUCKET_OR_PREFIX},STAGING_RENDER_CANARY_EXPECTED_HOST_SUFFIX=.run.app,STAGING_RENDER_CANARY_TIMEOUT_SECONDS=120,STAGING_RENDER_CANARY_MAX_ARTIFACT_BYTES=750000" \
  --quiet

echo "Staging render canary service deployed/updated. This script does not execute the canary."
