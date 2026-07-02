#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/gcloud-common.sh
source "${SCRIPT_DIR}/lib/gcloud-common.sh"

# Requires REEDITPRO_CONFIRM_PROD_SETUP=true through confirm_prod_action.
confirm_prod_action

while IFS= read -r secret_name; do
  if gcloud secrets describe "${secret_name}" --project="${GCP_PROJECT_ID}" >/dev/null 2>&1; then
    echo "Secret placeholder already exists: ${secret_name}"
  else
    run_gcloud secrets create "${secret_name}" \
      --project="${GCP_PROJECT_ID}" \
      --replication-policy=automatic \
      --labels="app=reeditpro,env=${REEDITPRO_ENV}"
  fi
done < <(secret_placeholders)
