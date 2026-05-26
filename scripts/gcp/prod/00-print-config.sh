#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/gcloud-common.sh
source "${SCRIPT_DIR}/lib/gcloud-common.sh"

require_gcp_foundation_env
print_gcp_foundation_context

echo "Required APIs:"
required_apis | sed 's/^/  - /'

echo ""
echo "Buckets:"
while IFS= read -r purpose; do
  echo "  - gs://$(bucket_name "${purpose}")"
done < <(bucket_purposes)

echo ""
echo "Service accounts:"
while IFS=: read -r account_id display_name; do
  echo "  - $(service_account_email "${account_id}") (${display_name})"
done < <(service_accounts)

echo ""
echo "Secret placeholders:"
secret_placeholders | sed 's/^/  - /'

echo ""
echo "Artifact images:"
for image in reeditpro-api reeditpro-cpu-worker reeditpro-gpu-worker reeditpro-render-worker reeditpro-qa-worker reeditpro-tool-readiness-worker; do
  echo "  - $(artifact_image "${image}")"
done
