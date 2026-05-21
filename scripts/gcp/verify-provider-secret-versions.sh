#!/usr/bin/env bash
set -euo pipefail

# RP-PROVIDER-VERIFY-01
# Verifies that required provider Secret Manager references exist and have at least
# one enabled version. This script never accesses or prints secret payload values.

PROJECT_ID="${1:-${PROJECT_ID:-reeditpro}}"

PROVIDER_SECRETS=(
  reeditpro-prod-openai-api-key
  reeditpro-prod-wan-api-key
  reeditpro-prod-hailuo-api-key
  reeditpro-prod-veo-vertex-config
  reeditpro-prod-lyria-api-key
  reeditpro-prod-mirelo-api-key
  reeditpro-prod-mmaudio-api-key
)

require_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "ERROR: required command not found: ${command_name}"
    exit 1
  fi
}

enabled_version_for_secret() {
  local secret_name="$1"
  gcloud secrets versions list "$secret_name" \
    --project "$PROJECT_ID" \
    --filter="state:enabled" \
    --sort-by="~createTime" \
    --limit=1 \
    --format="value(name)" 2>/dev/null | head -n 1
}

require_command gcloud

echo "Checking provider Secret Manager enabled versions."
echo "Project: ${PROJECT_ID}"
echo "No secret payload values will be accessed or printed."
echo ""

failure_count=0

for secret_name in "${PROVIDER_SECRETS[@]}"; do
  if ! gcloud secrets describe "$secret_name" --project "$PROJECT_ID" >/dev/null 2>&1; then
    echo "FAIL ${secret_name}: secret does not exist or is not visible to this account."
    failure_count=$((failure_count + 1))
    continue
  fi

  enabled_version="$(enabled_version_for_secret "$secret_name")"
  if [[ -z "$enabled_version" ]]; then
    echo "FAIL ${secret_name}: no enabled secret version found."
    failure_count=$((failure_count + 1))
    continue
  fi

  echo "PASS ${secret_name}: enabled version exists."
done

echo ""
if [[ "$failure_count" -gt 0 ]]; then
  echo "Provider secret version verification failed for ${failure_count} secret(s)."
  exit 1
fi

echo "Provider secret version verification passed."
