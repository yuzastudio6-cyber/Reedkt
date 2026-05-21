#!/usr/bin/env bash
set -euo pipefail
set +x

# RP-PROVIDER-VERIFY-01
# Safely verifies the OpenAI provider key by calling the non-generation models
# list endpoint. The key is read from Secret Manager into memory only and is
# never printed.

PROJECT_ID="${1:-${PROJECT_ID:-reeditpro}}"
OPENAI_SECRET_NAME="${OPENAI_SECRET_NAME:-reeditpro-prod-openai-api-key}"
OPENAI_MODELS_ENDPOINT="${OPENAI_MODELS_ENDPOINT:-https://api.openai.com/v1/models}"

require_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "ERROR: required command not found: ${command_name}"
    exit 1
  fi
}

require_command gcloud
require_command curl

latest_enabled_version="$(gcloud secrets versions list "$OPENAI_SECRET_NAME" \
  --project "$PROJECT_ID" \
  --filter="state:enabled" \
  --sort-by="~createTime" \
  --limit=1 \
  --format="value(name)" 2>/dev/null | head -n 1)"
latest_enabled_version="${latest_enabled_version##*/}"

echo "Checking OpenAI key with safe non-generation auth/list endpoint."
echo "Project: ${PROJECT_ID}"
echo "Secret: ${OPENAI_SECRET_NAME}"
echo "Endpoint: ${OPENAI_MODELS_ENDPOINT}"
echo "No secret payload value will be printed."

if ! gcloud secrets describe "$OPENAI_SECRET_NAME" --project "$PROJECT_ID" >/dev/null 2>&1; then
  echo "FAIL ${OPENAI_SECRET_NAME}: secret does not exist or is not visible to this account."
  exit 1
fi

if [[ -z "$latest_enabled_version" ]]; then
  echo "FAIL ${OPENAI_SECRET_NAME}: no enabled secret version found."
  exit 1
fi

OPENAI_API_KEY="$(gcloud secrets versions access "$latest_enabled_version" --secret="$OPENAI_SECRET_NAME" --project "$PROJECT_ID" 2>/dev/null || true)"

if [[ -z "$OPENAI_API_KEY" ]]; then
  unset OPENAI_API_KEY
  echo "FAIL ${OPENAI_SECRET_NAME}: latest secret payload is empty or inaccessible."
  exit 1
fi

http_status="$(printf 'header = "Authorization: Bearer %s"\n' "$OPENAI_API_KEY" | curl --config - -sS -o /dev/null -w "%{http_code}" \
  --connect-timeout 10 \
  --max-time 20 \
  "$OPENAI_MODELS_ENDPOINT")"

unset OPENAI_API_KEY

case "$http_status" in
  200)
    echo "PASS OpenAI safe auth/list check succeeded with HTTP ${http_status}."
    ;;
  401|403)
    echo "FAIL OpenAI safe auth/list check returned HTTP ${http_status}."
    exit 1
    ;;
  *)
    echo "WARN OpenAI safe auth/list check returned HTTP ${http_status}. Confirm network/account status."
    exit 1
    ;;
esac
