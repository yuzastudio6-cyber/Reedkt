#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/gcloud-common.sh
source "${SCRIPT_DIR}/lib/gcloud-common.sh"

require_gcp_foundation_env
print_gcp_foundation_context

cat <<EOF
Review and run this command manually after the production artifact smoke passes.
This script prints commands only and does not call Cloud Build.

gcloud builds submit --project="${GCP_PROJECT_ID}" --region="${GCP_ARTIFACT_REGION}" --config="scripts/gcp/prod/cloudbuild-image.yaml" --substitutions="_DOCKERFILE=docker/prod/api/Dockerfile,_IMAGE=$(artifact_image reeditpro-api)" .

Worker image commands remain intentionally omitted until each worker owns a
dedicated built entrypoint and passes its container smoke. Do not tag the API
artifact as a CPU, GPU, render, QA, or tool-readiness worker image.
EOF
