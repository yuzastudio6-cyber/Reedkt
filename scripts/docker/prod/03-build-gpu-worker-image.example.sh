#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./00-print-image-config.sh
source "${SCRIPT_DIR}/00-print-image-config.sh"
print_image_config
docker build -f docker/prod/gpu-worker/Dockerfile -t "$(image_name reeditpro-gpu-worker)" .
