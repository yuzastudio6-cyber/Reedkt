#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/gcloud-common.sh
source "${SCRIPT_DIR}/lib/gcloud-common.sh"

# Requires REEDITPRO_CONFIRM_PROD_SETUP=true through confirm_prod_action.
confirm_prod_action

if gcloud kms keyrings describe "${REEDITPRO_IMAGE_SIGNING_KEY_RING}" \
  --project="${GCP_PROJECT_ID}" \
  --location="${GCP_ARTIFACT_REGION}" >/dev/null 2>&1; then
  echo "Image signing key ring already exists: ${REEDITPRO_IMAGE_SIGNING_KEY_RING}"
else
  run_gcloud kms keyrings create "${REEDITPRO_IMAGE_SIGNING_KEY_RING}" \
    --project="${GCP_PROJECT_ID}" \
    --location="${GCP_ARTIFACT_REGION}"
fi

if gcloud kms keys describe "${REEDITPRO_IMAGE_SIGNING_KEY}" \
  --project="${GCP_PROJECT_ID}" \
  --location="${GCP_ARTIFACT_REGION}" \
  --keyring="${REEDITPRO_IMAGE_SIGNING_KEY_RING}" >/dev/null 2>&1; then
  echo "Image signing key already exists: ${REEDITPRO_IMAGE_SIGNING_KEY}"
else
  run_gcloud kms keys create "${REEDITPRO_IMAGE_SIGNING_KEY}" \
    --project="${GCP_PROJECT_ID}" \
    --location="${GCP_ARTIFACT_REGION}" \
    --keyring="${REEDITPRO_IMAGE_SIGNING_KEY_RING}" \
    --purpose=asymmetric-signing \
    --default-algorithm=ec-sign-p256-sha256 \
    --protection-level=hsm
fi
