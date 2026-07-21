#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/gcloud-common.sh
source "${SCRIPT_DIR}/lib/gcloud-common.sh"
# shellcheck source=../../docker/prod/00-print-image-config.sh
source "${SCRIPT_DIR}/../../docker/prod/00-print-image-config.sh"

require_gcp_foundation_env
require_clean_source_identity
print_gcp_foundation_context
print_source_identity

cat <<EOF
Review and run this command manually after the production artifact smoke passes.
This script prints commands only and does not call Cloud Build.

gcloud builds submit --project="${GCP_PROJECT_ID}" --region="${GCP_ARTIFACT_REGION}" --config="scripts/gcp/prod/cloudbuild-image.yaml" --substitutions="_DOCKERFILE=docker/prod/api/Dockerfile,_IMAGE=$(artifact_image reeditpro-api),_SOURCE_COMMIT_SHA=${REEDITPRO_SOURCE_COMMIT_SHA},_SOURCE_TREE_HASH=${REEDITPRO_SOURCE_TREE_HASH},_SOURCE_CLEAN=${REEDITPRO_SOURCE_CLEAN}" .

Worker image commands remain intentionally omitted until each worker owns a
dedicated built entrypoint and passes its container smoke. Do not tag the API
artifact as a CPU, GPU, render, QA, or tool-readiness worker image.
EOF
