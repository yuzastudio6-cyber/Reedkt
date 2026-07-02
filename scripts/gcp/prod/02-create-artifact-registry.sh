#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/gcloud-common.sh
source "${SCRIPT_DIR}/lib/gcloud-common.sh"

# Requires REEDITPRO_CONFIRM_PROD_SETUP=true through confirm_prod_action.
confirm_prod_action

if gcloud artifacts repositories describe "${REEDITPRO_ARTIFACT_REPOSITORY}" --project="${GCP_PROJECT_ID}" --location="${GCP_ARTIFACT_REGION}" >/dev/null 2>&1; then
  echo "Artifact Registry repository already exists: ${REEDITPRO_ARTIFACT_REPOSITORY}"
else
  run_gcloud artifacts repositories create "${REEDITPRO_ARTIFACT_REPOSITORY}" \
    --project="${GCP_PROJECT_ID}" \
    --repository-format=docker \
    --location="${GCP_ARTIFACT_REGION}" \
    --description="ReeditPro production runtime images"
fi
