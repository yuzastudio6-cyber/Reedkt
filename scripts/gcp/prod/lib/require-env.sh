#!/usr/bin/env bash

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "ERROR: required environment variable ${name} is missing." >&2
    exit 1
  fi
}

require_gcp_foundation_env() {
  require_env GCP_PROJECT_ID
  require_env GCP_REGION
  require_env GCP_ARTIFACT_REGION
  require_env GCP_BUCKET_LOCATION
  require_env REEDITPRO_ENV
  require_env REEDITPRO_API_SERVICE_ACCOUNT
  require_env REEDITPRO_CPU_WORKER_SERVICE_ACCOUNT
  require_env REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT
  require_env REEDITPRO_RENDER_WORKER_SERVICE_ACCOUNT
  require_env REEDITPRO_QA_WORKER_SERVICE_ACCOUNT
  require_env REEDITPRO_TOOL_READINESS_SERVICE_ACCOUNT
  require_env REEDITPRO_ARTIFACT_REPOSITORY
  require_env REEDITPRO_IMAGE_TAG
}

print_gcp_foundation_context() {
  echo "============================================================"
  echo "ReeditPro production GCP foundation"
  echo "Project:          ${GCP_PROJECT_ID}"
  echo "Region:           ${GCP_REGION}"
  echo "Artifact region:  ${GCP_ARTIFACT_REGION}"
  echo "Bucket location:  ${GCP_BUCKET_LOCATION}"
  echo "Environment:      ${REEDITPRO_ENV}"
  echo "Artifact repo:    ${REEDITPRO_ARTIFACT_REPOSITORY}"
  echo "Image tag:        ${REEDITPRO_IMAGE_TAG}"
  echo "============================================================"
}
