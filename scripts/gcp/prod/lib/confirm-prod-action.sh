#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./require-env.sh
source "${SCRIPT_DIR}/require-env.sh"

confirm_prod_action() {
  require_gcp_foundation_env
  print_gcp_foundation_context

  if [[ "${REEDITPRO_CONFIRM_PROD_SETUP:-false}" != "true" ]]; then
    echo "ERROR: refusing to run a production-mutating script." >&2
    echo "Set REEDITPRO_CONFIRM_PROD_SETUP=true only after reviewing the script and target project." >&2
    exit 1
  fi
}
