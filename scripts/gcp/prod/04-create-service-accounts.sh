#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/gcloud-common.sh
source "${SCRIPT_DIR}/lib/gcloud-common.sh"

# Requires REEDITPRO_CONFIRM_PROD_SETUP=true through confirm_prod_action.
confirm_prod_action

while IFS=: read -r account_id display_name; do
  email="$(service_account_email "${account_id}")"
  if gcloud iam service-accounts describe "${email}" --project="${GCP_PROJECT_ID}" >/dev/null 2>&1; then
    echo "Service account already exists: ${email}"
  else
    run_gcloud iam service-accounts create "${account_id}" \
      --project="${GCP_PROJECT_ID}" \
      --display-name="${display_name}" \
      --description="${display_name}"
  fi
done < <(service_accounts)
