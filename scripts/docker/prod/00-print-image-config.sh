#!/usr/bin/env bash
set -euo pipefail

require_image_env() {
  : "${GCP_PROJECT_ID:?GCP_PROJECT_ID is required}"
  : "${GCP_ARTIFACT_REGION:?GCP_ARTIFACT_REGION is required}"
  : "${REEDITPRO_ARTIFACT_REPOSITORY:?REEDITPRO_ARTIFACT_REPOSITORY is required}"
  : "${REEDITPRO_IMAGE_TAG:?REEDITPRO_IMAGE_TAG is required}"
  if [[ "${REEDITPRO_IMAGE_TAG}" == "manual-not-set" ]]; then
    echo "ERROR: set REEDITPRO_IMAGE_TAG to an explicit reviewed tag before building." >&2
    exit 1
  fi
}

image_name() {
  local image="$1"
  echo "${GCP_ARTIFACT_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${REEDITPRO_ARTIFACT_REPOSITORY}/${image}:${REEDITPRO_IMAGE_TAG}"
}

print_image_config() {
  require_image_env
  echo "Project: ${GCP_PROJECT_ID}"
  echo "Artifact region: ${GCP_ARTIFACT_REGION}"
  echo "Repository: ${REEDITPRO_ARTIFACT_REPOSITORY}"
  echo "Image tag: ${REEDITPRO_IMAGE_TAG}"
  echo "Images:"
  for image in reeditpro-api reeditpro-cpu-worker reeditpro-gpu-worker reeditpro-render-worker reeditpro-qa-worker reeditpro-tool-readiness-worker; do
    echo "  - $(image_name "${image}")"
  done
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  print_image_config
fi
