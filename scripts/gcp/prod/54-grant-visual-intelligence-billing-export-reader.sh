#!/usr/bin/env bash
set -euo pipefail

# Grants the canonical API identity the minimum project/dataset permissions
# required to list and query the private WeEditPro billing export. It cannot
# configure Cloud Billing exports, mutate billing, or write BigQuery data.

readonly PROJECT_ID='reeditpro'
readonly PROJECT_NUMBER='390722338345'
readonly DATASET_ID='weeditpro_billing_export'
readonly API_SERVICE_ACCOUNT='reeditpro-api-sa@reeditpro.iam.gserviceaccount.com'
readonly MEMBER="serviceAccount:${API_SERVICE_ACCOUNT}"
readonly CONFIRMATION='grant-weeditpro-visual-intelligence-billing-export-reader-v1'

main() {
  assert_operator_boundary

  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="${MEMBER}" \
    --role=roles/bigquery.jobUser \
    --condition=None \
    --quiet \
    --format=none >/dev/null

  grant_dataset_reader

  local project_policy
  project_policy="$(gcloud projects get-iam-policy \
    "${PROJECT_ID}" --format=json)"
  if ! jq -e \
    --arg member "${MEMBER}" \
    'any(.bindings[]?;
      .role == "roles/bigquery.jobUser"
      and any(.members[]?; . == $member))' \
    <<<"${project_policy}" >/dev/null; then
    fail 'the exact BigQuery Job User binding did not reread'
  fi

  local dataset_policy
  dataset_policy="$(read_dataset_metadata)"
  if ! jq -e \
    --arg email "${API_SERVICE_ACCOUNT}" \
    'any(.access[]?;
      .role == "READER" and .userByEmail == $email)' \
    <<<"${dataset_policy}" >/dev/null; then
    fail 'the exact dataset Data Viewer binding did not reread'
  fi

  printf '%s\n' '{'
  printf '  "operation":"weeditpro_visual_intelligence_billing_export_reader_grant_v1",\n'
  printf '  "projectId":"%s",\n' "${PROJECT_ID}"
  printf '  "datasetId":"%s",\n' "${DATASET_ID}"
  printf '  "serviceAccount":"%s",\n' "${API_SERVICE_ACCOUNT}"
  printf '  "projectRole":"roles/bigquery.jobUser",\n'
  printf '  "datasetRole":"roles/bigquery.dataViewer",\n'
  printf '  "billingExportConfigurationAuthorityGranted":false,\n'
  printf '  "bigQueryWriteAuthorityGranted":false,\n'
  printf '  "billingMutationAuthorityGranted":false,\n'
  printf '  "customerCreditsMutated":false,\n'
  printf '  "providerCallMade":false,\n'
  printf '  "productionAuthorityGranted":false\n'
  printf '%s\n' '}'
}

grant_dataset_reader() {
  local current etag payload response token
  token="$(gcloud auth print-access-token --quiet)"
  if (( ${#token} < 20 || ${#token} > 4096 )) \
    || [[ "${token}" =~ [[:space:]] ]]; then
    fail 'the short-lived operator access token is malformed'
  fi
  current="$(read_dataset_metadata_with_token "${token}")"
  if jq -e --arg email "${API_SERVICE_ACCOUNT}" \
    'any(.access[]?; .role == "READER" and .userByEmail == $email)' \
    <<<"${current}" >/dev/null; then
    return
  fi
  etag="$(jq -er '.etag' <<<"${current}")"
  payload="$(jq -c --arg email "${API_SERVICE_ACCOUNT}" \
    '.access += [{"role":"READER","userByEmail":$email}]
      | {access, etag}' <<<"${current}")"
  response="$(curl --fail-with-body --silent --show-error \
    --request PATCH \
    --header "Authorization: Bearer ${token}" \
    --header 'Content-Type: application/json' \
    --header "If-Match: ${etag}" \
    --data "${payload}" \
    "https://bigquery.googleapis.com/bigquery/v2/projects/${PROJECT_ID}/datasets/${DATASET_ID}")"
  if ! jq -e --arg email "${API_SERVICE_ACCOUNT}" \
    'any(.access[]?; .role == "READER" and .userByEmail == $email)' \
    <<<"${response}" >/dev/null; then
    fail 'the dataset reader patch response was not exact'
  fi
}

read_dataset_metadata() {
  local token
  token="$(gcloud auth print-access-token --quiet)"
  read_dataset_metadata_with_token "${token}"
}

read_dataset_metadata_with_token() {
  local token="$1"
  curl --fail-with-body --silent --show-error \
    --header "Authorization: Bearer ${token}" \
    "https://bigquery.googleapis.com/bigquery/v2/projects/${PROJECT_ID}/datasets/${DATASET_ID}"
}

assert_operator_boundary() {
  if [[ "${WEEDITPRO_CONFIRM_BILLING_EXPORT_READER:-}" != "${CONFIRMATION}" ]]; then
    fail 'exact billing-export reader confirmation is missing'
  fi
  local active_project
  active_project="$(gcloud config get-value project 2>/dev/null)"
  if [[ "${active_project}" != "${PROJECT_ID}" ]]; then
    fail 'active gcloud project does not match the fixed project'
  fi
  local observed_number
  observed_number="$(gcloud projects describe "${PROJECT_ID}" \
    --format='value(projectNumber)')"
  if [[ "${observed_number}" != "${PROJECT_NUMBER}" ]]; then
    fail 'GCP project number does not match the reviewed project'
  fi
  if ! bq show --format=none "${PROJECT_ID}:${DATASET_ID}" >/dev/null; then
    fail 'the fixed private billing export dataset is unavailable'
  fi
  if ! gcloud iam service-accounts describe "${API_SERVICE_ACCOUNT}" \
    --project="${PROJECT_ID}" >/dev/null 2>&1; then
    fail 'the canonical API service identity is unavailable'
  fi
  command -v jq >/dev/null
  command -v bq >/dev/null
}

fail() {
  printf 'ERROR: %s.\n' "$1" >&2
  exit 1
}

main "$@"
