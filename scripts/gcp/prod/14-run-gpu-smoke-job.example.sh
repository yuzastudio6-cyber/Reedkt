#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/gcloud-common.sh
source "${SCRIPT_DIR}/lib/gcloud-common.sh"

# Requires REEDITPRO_CONFIRM_PROD_SETUP=true through confirm_prod_action.
confirm_prod_action

# This runs only a future GPU environment smoke job, not customer media or model/provider work.
run_gcloud run jobs execute reeditpro-gpu-ai-worker \
  --project="${GCP_PROJECT_ID}" \
  --region="${GCP_REGION}" \
  --wait
