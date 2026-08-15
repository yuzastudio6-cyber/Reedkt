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
for image in \
  reeditpro-api \
  reeditpro-sam31-gpu \
  reeditpro-l4-media-worker; do
  echo "  - $(artifact_image "${image}")"
done

echo ""
echo "Active quality-first GPU routes:"
echo "  - A100 80 GB heavy primary: scale-zero Vertex Custom Job"
echo "  - L4 heavy fallback: reeditpro-sam31-l4-fallback Cloud Run Job"
echo "  - L4 standard primary: reeditpro-professional-l4 Cloud Run Job"
echo "  - Minimum idle jobs/instances: 0"
