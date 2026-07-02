#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/gcloud-common.sh
source "${SCRIPT_DIR}/lib/gcloud-common.sh"

# Requires REEDITPRO_CONFIRM_PROD_SETUP=true through confirm_prod_action.
confirm_prod_action

while IFS= read -r api; do
  if gcloud services list --enabled --project="${GCP_PROJECT_ID}" --filter="config.name:${api}" --format='value(config.name)' | grep -qx "${api}"; then
    echo "API already enabled: ${api}"
  else
    run_gcloud services enable "${api}" --project="${GCP_PROJECT_ID}"
  fi
done < <(required_apis)
