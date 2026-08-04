#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./00-print-image-config.sh
source "${SCRIPT_DIR}/00-print-image-config.sh"
require_clean_source_identity
print_image_config
print_source_identity
docker build \
  --platform linux/amd64 \
  "${REEDITPRO_SOURCE_BUILD_ARGS[@]}" \
  -f docker/prod/gpu-worker/Dockerfile \
  -t "$(image_name reeditpro-gpu-worker)" \
  .
