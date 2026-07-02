#!/usr/bin/env bash

# ReeditPro provider secret version helper
# Adds real provider API key values to existing Google Secret Manager secrets.
# This script never prints the secret values and does not commit anything to the repo.
# Run only from a trusted Google Cloud Shell session.

set -uo pipefail

PROJECT_ID="${1:-${PROJECT_ID:-reeditpro}}"

gcloud config set project "$PROJECT_ID" --quiet >/dev/null

add_secret_version_interactive() {
  local secret_name="$1"
  local label="$2"
  local tmp_file

  echo ""
  echo "Secret: ${secret_name}"
  echo "Provider: ${label}"
  echo "Paste the value for ${label}, then press Enter."
  echo "Leave blank and press Enter to skip."

  read -r -s -p "${label} secret value: " secret_value
  echo ""

  if [[ -z "${secret_value}" ]]; then
    echo "Skipped ${secret_name}"
    return 0
  fi

  if ! gcloud secrets describe "$secret_name" >/dev/null 2>&1; then
    echo "Creating missing secret container: ${secret_name}"
    gcloud secrets create "$secret_name" --replication-policy=automatic >/dev/null
  fi

  tmp_file="$(mktemp)"
  printf '%s' "$secret_value" > "$tmp_file"

  if gcloud secrets versions add "$secret_name" --data-file="$tmp_file" >/dev/null; then
    echo "Added new enabled version to ${secret_name}"
  else
    echo "ERROR: Failed to add secret version for ${secret_name}"
    rm -f "$tmp_file"
    unset secret_value
    return 1
  fi

  rm -f "$tmp_file"
  unset secret_value
}

echo "============================================================"
echo "ReeditPro provider secret version setup"
echo "Project: ${PROJECT_ID}"
echo "============================================================"
echo "Do not paste secrets into ChatGPT, Codex, GitHub, or .env.example."
echo "This script writes values only to Google Secret Manager."

add_secret_version_interactive "reeditpro-prod-openai-api-key" "OpenAI / GPT-Image API key"
add_secret_version_interactive "reeditpro-prod-wan-api-key" "Wan provider API key"
add_secret_version_interactive "reeditpro-prod-hailuo-api-key" "Hailuo provider API key"
add_secret_version_interactive "reeditpro-prod-veo-vertex-config" "Veo / Vertex config JSON or reference"
add_secret_version_interactive "reeditpro-prod-lyria-api-key" "Lyria API key or Google audio provider key"
add_secret_version_interactive "reeditpro-prod-mirelo-api-key" "Mirelo SFX V1.5 API key"
add_secret_version_interactive "reeditpro-prod-mmaudio-api-key" "MMAudio V2 API key"
add_secret_version_interactive "reeditpro-prod-provider-webhook-signing-secret" "Provider webhook signing secret"

cat <<'SUMMARY'

============================================================
REEDITPRO_PROVIDER_SECRET_VERSIONS_DONE
============================================================
Secret values were not printed.
Run this to verify versions exist without exposing values:

gcloud secrets list --filter="name:reeditpro-prod" --format="table(name)"

gcloud secrets versions list reeditpro-prod-openai-api-key --format="table(name,state,createTime)"
gcloud secrets versions list reeditpro-prod-mirelo-api-key --format="table(name,state,createTime)"
gcloud secrets versions list reeditpro-prod-mmaudio-api-key --format="table(name,state,createTime)"

Do not enable real provider execution until backend build/lint passes and real adapters are explicitly gated.
SUMMARY
