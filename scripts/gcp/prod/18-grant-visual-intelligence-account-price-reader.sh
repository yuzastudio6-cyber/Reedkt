#!/usr/bin/env bash
set -euo pipefail

# Grants the canonical backend identity read-only account-effective price
# access. It cannot update billing, payment, budgets, credits, wallets, or
# provider/runtime state. The billing account coordinate is supplied only by
# the authorized operator and is never printed or persisted.

readonly PROJECT_ID='reeditpro'
readonly PROJECT_NUMBER='390722338345'
readonly API_SERVICE_ACCOUNT='reeditpro-api-sa@reeditpro.iam.gserviceaccount.com'
readonly CONFIRMATION='grant-weeditpro-visual-intelligence-price-reader-v1'

main() {
  assert_operator_boundary
  local billing_account_resource="${WEEDITPRO_BILLING_ACCOUNT_RESOURCE_NAME}"
  local billing_account_id="${billing_account_resource#billingAccounts/}"

  gcloud billing accounts add-iam-policy-binding "${billing_account_id}" \
    --member="serviceAccount:${API_SERVICE_ACCOUNT}" \
    --role=roles/billing.viewer \
    --quiet \
    --format=none >/dev/null

  local policy
  policy="$(gcloud billing accounts get-iam-policy \
    "${billing_account_id}" --format=json)"
  if ! jq -e \
    --arg member "serviceAccount:${API_SERVICE_ACCOUNT}" \
    'any(.bindings[]?;
      .role == "roles/billing.viewer"
      and any(.members[]?; . == $member))' \
    <<<"${policy}" >/dev/null; then
    fail 'the exact Billing Account Viewer binding did not reread'
  fi

  printf '%s\n' '{'
  printf '  "operation":"weeditpro_visual_intelligence_price_reader_grant_v1",\n'
  printf '  "projectId":"%s",\n' "${PROJECT_ID}"
  printf '  "serviceAccount":"%s",\n' "${API_SERVICE_ACCOUNT}"
  printf '  "role":"roles/billing.viewer",\n'
  printf '  "billingAccountResourceDisclosed":false,\n'
  printf '  "billingMutationAuthorityGranted":false,\n'
  printf '  "paymentAuthorityGranted":false,\n'
  printf '  "customerCreditsMutated":false,\n'
  printf '  "providerCallMade":false,\n'
  printf '  "productionAuthorityGranted":false\n'
  printf '%s\n' '}'
}

assert_operator_boundary() {
  if [[ "${WEEDITPRO_CONFIRM_ACCOUNT_PRICE_READER:-}" != "${CONFIRMATION}" ]]; then
    fail 'exact account-price reader confirmation is missing'
  fi
  if [[ ! "${WEEDITPRO_BILLING_ACCOUNT_RESOURCE_NAME:-}" =~ ^billingAccounts/[A-Z0-9]{6}-[A-Z0-9]{6}-[A-Z0-9]{6}$ ]]; then
    fail 'the billing account coordinate is missing or invalid'
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
  local linked_account
  linked_account="$(gcloud billing projects describe "${PROJECT_ID}" \
    --format='value(billingAccountName)')"
  if [[ "${linked_account}" != "${WEEDITPRO_BILLING_ACCOUNT_RESOURCE_NAME}" ]]; then
    fail 'the supplied billing account is not the project-linked account'
  fi
  if ! gcloud iam service-accounts describe "${API_SERVICE_ACCOUNT}" \
    --project="${PROJECT_ID}" >/dev/null 2>&1; then
    fail 'the canonical API service identity is unavailable'
  fi
  command -v jq >/dev/null
}

fail() {
  printf 'ERROR: %s.\n' "$1" >&2
  exit 1
}

main "$@"
