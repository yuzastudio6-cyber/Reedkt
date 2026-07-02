#!/usr/bin/env bash
set -euo pipefail
set +x

# RP-PROVIDER-VERIFY-01
# Verifies provider Secret Manager references and non-empty latest enabled
# payloads without printing secret values. Only OpenAI has a configured safe
# non-generation auth/list endpoint in this milestone.

PROJECT_ID="${1:-${PROJECT_ID:-reeditpro}}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PROVIDER_SECRETS=(
  "openai:reeditpro-prod-openai-api-key"
  "wan:reeditpro-prod-wan-api-key"
  "hailuo:reeditpro-prod-hailuo-api-key"
  "veo:reeditpro-prod-veo-vertex-config"
  "lyria:reeditpro-prod-lyria-api-key"
  "mirelo:reeditpro-prod-mirelo-api-key"
  "mmaudio:reeditpro-prod-mmaudio-api-key"
)

require_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "ERROR: required command not found: ${command_name}"
    exit 1
  fi
}

latest_enabled_version_for_secret() {
  local secret_name="$1"
  local version_name
  version_name="$(gcloud secrets versions list "$secret_name" \
    --project "$PROJECT_ID" \
    --filter="state:enabled" \
    --sort-by="~createTime" \
    --limit=1 \
    --format="value(name)" 2>/dev/null | head -n 1)"
  echo "${version_name##*/}"
}

check_secret_payload_non_empty() {
  local provider_name="$1"
  local secret_name="$2"
  local version_id="$3"
  local payload

  payload="$(gcloud secrets versions access "$version_id" --secret="$secret_name" --project "$PROJECT_ID" 2>/dev/null || true)"
  if [[ -z "$payload" ]]; then
    unset payload
    echo "FAIL ${provider_name} (${secret_name}): latest enabled payload is empty or inaccessible."
    return 1
  fi

  unset payload
  echo "PASS ${provider_name} (${secret_name}): latest enabled payload is non-empty."
  return 0
}

require_command gcloud

echo "Checking provider Secret Manager references and non-empty payloads."
echo "Project: ${PROJECT_ID}"
echo "No secret payload values will be printed."
echo ""

failure_count=0

for entry in "${PROVIDER_SECRETS[@]}"; do
  provider_name="${entry%%:*}"
  secret_name="${entry#*:}"

  if ! gcloud secrets describe "$secret_name" --project "$PROJECT_ID" >/dev/null 2>&1; then
    echo "FAIL ${provider_name} (${secret_name}): secret does not exist or is not visible to this account."
    failure_count=$((failure_count + 1))
    continue
  fi

  version_id="$(latest_enabled_version_for_secret "$secret_name")"
  if [[ -z "$version_id" ]]; then
    echo "FAIL ${provider_name} (${secret_name}): no enabled secret version found."
    failure_count=$((failure_count + 1))
    continue
  fi

  if ! check_secret_payload_non_empty "$provider_name" "$secret_name" "$version_id"; then
    failure_count=$((failure_count + 1))
    continue
  fi

  case "$provider_name" in
    openai)
      echo "INFO openai: running safe non-generation auth/list check."
      if ! PROJECT_ID="$PROJECT_ID" bash "${SCRIPT_DIR}/verify-openai-key.safe.sh" "$PROJECT_ID"; then
        failure_count=$((failure_count + 1))
      fi
      ;;
    *)
      echo "INFO ${provider_name}: secret present, real endpoint verification pending."
      ;;
  esac
done

echo ""
if [[ "$failure_count" -gt 0 ]]; then
  echo "Provider secret verification failed for ${failure_count} check(s)."
  exit 1
fi

echo "Provider secret verification passed for configured safe checks."
