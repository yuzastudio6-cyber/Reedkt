#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./00-print-image-config.sh
source "${SCRIPT_DIR}/00-print-image-config.sh"
print_image_config

# Human-run example only. Codex must not build, push, run, or deploy this image in this gate.
docker build -f server/workers/sound-cpu/Dockerfile -t "$(image_name reeditpro-sound-cpu-analysis-worker)" .
