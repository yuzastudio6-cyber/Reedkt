#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/gcloud-common.sh
source "${SCRIPT_DIR}/lib/gcloud-common.sh"

require_gcp_foundation_env
print_gcp_foundation_context

cat <<EOF
Review and run these commands manually in a later container/image milestone.
This script prints commands only and does not call gcloud builds submit.

gcloud builds submit --project="${GCP_PROJECT_ID}" --tag="$(artifact_image reeditpro-api)" .
gcloud builds submit --project="${GCP_PROJECT_ID}" --tag="$(artifact_image reeditpro-cpu-worker)" .
gcloud builds submit --project="${GCP_PROJECT_ID}" --tag="$(artifact_image reeditpro-gpu-worker)" .
gcloud builds submit --project="${GCP_PROJECT_ID}" --tag="$(artifact_image reeditpro-render-worker)" .
gcloud builds submit --project="${GCP_PROJECT_ID}" --tag="$(artifact_image reeditpro-qa-worker)" .
gcloud builds submit --project="${GCP_PROJECT_ID}" --tag="$(artifact_image reeditpro-tool-readiness-worker)" .
EOF
