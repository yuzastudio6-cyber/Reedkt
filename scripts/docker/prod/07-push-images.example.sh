#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./00-print-image-config.sh
source "${SCRIPT_DIR}/00-print-image-config.sh"
print_image_config

cat <<EOF
Review and run these commands manually in a later milestone:

docker push "$(image_name reeditpro-api)"
docker push "$(image_name reeditpro-cpu-worker)"
docker push "$(image_name reeditpro-gpu-worker)"
docker push "$(image_name reeditpro-render-worker)"
docker push "$(image_name reeditpro-qa-worker)"
docker push "$(image_name reeditpro-tool-readiness-worker)"
EOF
