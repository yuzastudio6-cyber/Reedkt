#!/usr/bin/env bash
set -euo pipefail

# Creates the isolated no-NAT network used by WeEditPro GPU jobs. Private
# Google Access remains available for the fixed GCS mount; the job container
# receives no public address and all of its egress is routed into this VPC.

readonly PROJECT_ID='reeditpro'
readonly PROJECT_NUMBER='390722338345'
readonly REGION='us-central1'
readonly NETWORK='weeditpro-gpu-private'
readonly SUBNET='weeditpro-gpu-private-us-central1'
readonly CIDR='10.42.0.0/24'
readonly CONFIRMATION='provision-weeditpro-private-gpu-network-v1'

main() {
  assert_operator_boundary
  gcloud services enable compute.googleapis.com \
    --project="${PROJECT_ID}" --quiet

  if ! gcloud compute networks describe "${NETWORK}" \
    --project="${PROJECT_ID}" >/dev/null 2>&1; then
    gcloud compute networks create "${NETWORK}" \
      --project="${PROJECT_ID}" \
      --subnet-mode=custom \
      --bgp-routing-mode=regional \
      --mtu=1460 \
      --quiet
  fi
  local network
  network="$(gcloud compute networks describe "${NETWORK}" \
    --project="${PROJECT_ID}" --format=json)"
  jq -e \
    --arg network "${NETWORK}" \
    '.name == $network and .autoCreateSubnetworks == false' \
    <<<"${network}" >/dev/null || fail 'the private GPU network reread changed'

  if ! gcloud compute networks subnets describe "${SUBNET}" \
    --project="${PROJECT_ID}" \
    --region="${REGION}" >/dev/null 2>&1; then
    gcloud compute networks subnets create "${SUBNET}" \
      --project="${PROJECT_ID}" \
      --network="${NETWORK}" \
      --region="${REGION}" \
      --range="${CIDR}" \
      --enable-private-ip-google-access \
      --quiet
  else
    local existing_subnet
    existing_subnet="$(gcloud compute networks subnets describe "${SUBNET}" \
      --project="${PROJECT_ID}" --region="${REGION}" --format=json)"
    assert_exact_subnet_identity "${existing_subnet}"
    gcloud compute networks subnets update "${SUBNET}" \
      --project="${PROJECT_ID}" \
      --region="${REGION}" \
      --enable-private-ip-google-access \
      --quiet
  fi

  local subnet routers nats
  subnet="$(gcloud compute networks subnets describe "${SUBNET}" \
    --project="${PROJECT_ID}" --region="${REGION}" --format=json)"
  routers="$(gcloud compute routers list \
    --project="${PROJECT_ID}" \
    --regions="${REGION}" \
    --format=json)"
  nats="$({
    while IFS= read -r router; do
      [[ -z "${router}" ]] || gcloud compute routers nats list \
        --project="${PROJECT_ID}" \
        --router="${router}" \
        --region="${REGION}" \
        --format='value(name,sourceSubnetworkIpRangesToNat,subnetworks[].name)'
    done < <(jq -r \
      --arg network "/networks/${NETWORK}" \
      '.[] | select(.network | endswith($network)) | .name' \
      <<<"${routers}")
  })"

  assert_exact_subnet_identity "${subnet}"
  jq -e '.privateIpGoogleAccess == true' <<<"${subnet}" >/dev/null \
    || fail 'Private Google Access is not enabled on the private GPU subnet'
  if [[ -n "${nats}" ]]; then
    fail 'a Cloud NAT exists on the private GPU network'
  fi

  printf '%s\n' '{'
  printf '  "operation":"weeditpro_private_gpu_network_v1",\n'
  printf '  "projectId":"%s",\n' "${PROJECT_ID}"
  printf '  "region":"%s",\n' "${REGION}"
  printf '  "network":"%s",\n' "${NETWORK}"
  printf '  "subnet":"%s",\n' "${SUBNET}"
  printf '  "privateGoogleAccess":true,\n'
  printf '  "cloudNatPresent":false,\n'
  printf '  "gpuJobStarted":false,\n'
  printf '  "customerCreditsMutated":false,\n'
  printf '  "productionAuthorityGranted":false\n'
  printf '%s\n' '}'
}

assert_exact_subnet_identity() {
  local subnet_json="$1"
  jq -e \
    --arg subnet "${SUBNET}" \
    --arg cidr "${CIDR}" \
    --arg network "/projects/${PROJECT_ID}/global/networks/${NETWORK}" \
    '
      .name == $subnet
      and .ipCidrRange == $cidr
      and (.network | endswith($network))
    ' <<<"${subnet_json}" >/dev/null \
    || fail 'the private GPU subnet identity changed'
}

assert_operator_boundary() {
  if [[ "${WEEDITPRO_CONFIRM_PRIVATE_GPU_NETWORK:-}" != "${CONFIRMATION}" ]]; then
    fail 'exact private GPU network confirmation is missing'
  fi
  if [[ "$(gcloud config get-value project 2>/dev/null)" != "${PROJECT_ID}" ]]; then
    fail 'active gcloud project does not match the fixed project'
  fi
  if [[ "$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')" != "${PROJECT_NUMBER}" ]]; then
    fail 'GCP project number does not match the reviewed project'
  fi
  command -v jq >/dev/null
}

fail() {
  printf 'ERROR: %s.\n' "$1" >&2
  exit 1
}

main "$@"
