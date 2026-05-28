#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/gcloud-common.sh
source "${SCRIPT_DIR}/lib/gcloud-common.sh"

# Requires REEDITPRO_CONFIRM_PROD_SETUP=true through confirm_prod_action.
confirm_prod_action

while IFS= read -r purpose; do
  bucket="$(bucket_name "${purpose}")"
  if gcloud storage buckets describe "gs://${bucket}" --project="${GCP_PROJECT_ID}" >/dev/null 2>&1; then
    echo "Bucket already exists: gs://${bucket}"
  else
    run_gcloud storage buckets create "gs://${bucket}" \
      --project="${GCP_PROJECT_ID}" \
      --location="${GCP_BUCKET_LOCATION}" \
      --uniform-bucket-level-access \
      --public-access-prevention \
      --default-storage-class=STANDARD
  fi

  run_gcloud storage buckets update "gs://${bucket}" \
    --project="${GCP_PROJECT_ID}" \
    --uniform-bucket-level-access \
    --public-access-prevention \
    --update-labels="app=reeditpro,env=${REEDITPRO_ENV}"
done < <(bucket_purposes)
