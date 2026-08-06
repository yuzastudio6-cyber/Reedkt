#!/usr/bin/env bash
set -euo pipefail

# Creates and exact-rereads the private-services-access foundation required by
# the WeEditPro SAM 3.1 Vertex AI A100 80GB Custom Job route. It creates no
# Custom Job, checkpoint/model bytes, image, customer charge, QA approval,
# delivery, or production authority.

readonly PROJECT_ID='reeditpro'
readonly PROJECT_NUMBER='390722338345'
readonly REGION='us-central1'
readonly NETWORK='weeditpro-gpu-private'
readonly ALLOCATED_RANGE='weeditpro-vertex-training-private-range'
readonly ALLOCATED_RANGE_ADDRESS='10.43.0.0'
readonly ALLOCATED_RANGE_PREFIX_LENGTH='16'
readonly SERVICE='servicenetworking.googleapis.com'
readonly PEERING='servicenetworking-googleapis-com'
readonly API_SA='reeditpro-api-sa@reeditpro.iam.gserviceaccount.com'
readonly WORKER_SA='weeditpro-sam31-qual-sa@reeditpro.iam.gserviceaccount.com'
readonly VERTEX_SERVICE_AGENT="service-${PROJECT_NUMBER}@gcp-sa-aiplatform.iam.gserviceaccount.com"
readonly KEY_RING='weeditpro-private-artifacts'
readonly ENCRYPTION_KEY='sam31-qualification'
readonly CONFIRMATION='provision-weeditpro-sam31-vertex-a100-private-foundation-v1'

main() {
  assert_operator_boundary
  gcloud services enable aiplatform.googleapis.com "${SERVICE}" \
    --project="${PROJECT_ID}" --quiet
  assert_required_identities
  reserve_private_service_range
  connect_private_services_access
  configure_exact_iam
  assert_exact_foundation
  emit_receipt
}

assert_operator_boundary() {
  [[ "${WEEDITPRO_CONFIRM_SAM31_VERTEX_A100_PRIVATE_FOUNDATION:-}" == \
    "${CONFIRMATION}" ]] || fail 'exact Vertex A100 private foundation confirmation is missing'
  [[ "$(gcloud config get-value project 2>/dev/null)" == "${PROJECT_ID}" ]] \
    || fail 'active gcloud project changed'
  [[ "$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')" == \
    "${PROJECT_NUMBER}" ]] || fail 'project number changed'
  command -v jq >/dev/null
}

assert_required_identities() {
  local vertex_identity
  gcloud compute networks describe "${NETWORK}" --project="${PROJECT_ID}" \
    >/dev/null
  gcloud iam service-accounts describe "${API_SA}" --project="${PROJECT_ID}" \
    >/dev/null
  gcloud iam service-accounts describe "${WORKER_SA}" \
    --project="${PROJECT_ID}" >/dev/null
  vertex_identity="$(gcloud beta services identity create \
    --service=aiplatform.googleapis.com --project="${PROJECT_ID}" \
    --format=json)"
  jq -e --arg email "${VERTEX_SERVICE_AGENT}" '.email == $email' \
    <<<"${vertex_identity}" >/dev/null \
    || fail 'Vertex AI service identity changed'
  gcloud kms keys describe "${ENCRYPTION_KEY}" --project="${PROJECT_ID}" \
    --location="${REGION}" --keyring="${KEY_RING}" >/dev/null
}

reserve_private_service_range() {
  if ! gcloud compute addresses describe "${ALLOCATED_RANGE}" \
    --project="${PROJECT_ID}" --global >/dev/null 2>&1; then
    gcloud compute addresses create "${ALLOCATED_RANGE}" \
      --project="${PROJECT_ID}" --global --purpose=VPC_PEERING \
      --network="${NETWORK}" --addresses="${ALLOCATED_RANGE_ADDRESS}" \
      --prefix-length="${ALLOCATED_RANGE_PREFIX_LENGTH}" --quiet
  fi
  local range_json
  range_json="$(gcloud compute addresses describe "${ALLOCATED_RANGE}" \
    --project="${PROJECT_ID}" --global --format=json)"
  jq -e --arg name "${ALLOCATED_RANGE}" \
    --arg address "${ALLOCATED_RANGE_ADDRESS}" \
    --argjson prefix "${ALLOCATED_RANGE_PREFIX_LENGTH}" \
    --arg network "/projects/${PROJECT_ID}/global/networks/${NETWORK}" '
      .name == $name and .address == $address and .prefixLength == $prefix
      and .purpose == "VPC_PEERING" and .status == "RESERVED"
      and (.network | endswith($network))
    ' <<<"${range_json}" >/dev/null \
    || fail 'Vertex private service range changed'
}

connect_private_services_access() {
  local connections
  connections="$(gcloud services vpc-peerings list --project="${PROJECT_ID}" \
    --network="${NETWORK}" --service="${SERVICE}" --format=json)"
  if ! jq -e --arg range "${ALLOCATED_RANGE}" '
    any(.[]; (.reservedPeeringRanges // []) | index($range))
  ' <<<"${connections}" >/dev/null; then
    gcloud services vpc-peerings connect --project="${PROJECT_ID}" \
      --network="${NETWORK}" --service="${SERVICE}" \
      --ranges="${ALLOCATED_RANGE}" --quiet
  fi
}

configure_exact_iam() {
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${API_SA}" --role=roles/aiplatform.user \
    --condition=None --quiet
  gcloud iam service-accounts add-iam-policy-binding "${WORKER_SA}" \
    --project="${PROJECT_ID}" --member="serviceAccount:${API_SA}" \
    --role=roles/iam.serviceAccountUser --condition=None --quiet
  gcloud kms keys add-iam-policy-binding "${ENCRYPTION_KEY}" \
    --project="${PROJECT_ID}" --location="${REGION}" \
    --keyring="${KEY_RING}" \
    --member="serviceAccount:${VERTEX_SERVICE_AGENT}" \
    --role=roles/cloudkms.cryptoKeyEncrypterDecrypter \
    --condition=None --quiet
}

assert_exact_foundation() {
  local connections peerings routers
  connections="$(gcloud services vpc-peerings list --project="${PROJECT_ID}" \
    --network="${NETWORK}" --service="${SERVICE}" --format=json)"
  peerings="$(gcloud compute networks peerings list --project="${PROJECT_ID}" \
    --network="${NETWORK}" --format=json)"
  routers="$(gcloud compute routers list --project="${PROJECT_ID}" \
    --format=json)"
  jq -e --arg range "${ALLOCATED_RANGE}" '
    length == 1
    and any(.[]; (.reservedPeeringRanges // []) | index($range))
  ' <<<"${connections}" >/dev/null \
    || fail 'Vertex private service connection changed'
  jq -e --arg peering "${PEERING}" '
    any(.[]; any(.peerings[]?; .name == $peering and .state == "ACTIVE"))
  ' <<<"${peerings}" >/dev/null || fail 'Vertex VPC peering is not active'
  jq -e --arg network "/networks/${NETWORK}" '
    [.[] | select(.network | endswith($network))] | length == 0
  ' <<<"${routers}" >/dev/null \
    || fail 'private GPU network gained a router or Cloud NAT'
}

emit_receipt() {
  jq -n --arg projectId "${PROJECT_ID}" --arg region "${REGION}" \
    --arg network "projects/${PROJECT_NUMBER}/global/networks/${NETWORK}" \
    --arg range "${ALLOCATED_RANGE}" \
    --arg rangeCidr "${ALLOCATED_RANGE_ADDRESS}/${ALLOCATED_RANGE_PREFIX_LENGTH}" \
    --arg peering "${PEERING}" --arg workerServiceAccount "${WORKER_SA}" \
    --arg vertexServiceAgent "${VERTEX_SERVICE_AGENT}" '{
      schemaVersion:"weeditpro-sam31-vertex-a100-private-foundation-receipt-v1",
      projectId:$projectId, region:$region, network:$network,
      allocatedRange:$range, allocatedRangeCidr:$rangeCidr,
      peering:$peering, peeringState:"ACTIVE",
      workerServiceAccount:$workerServiceAccount,
      vertexServiceAgent:$vertexServiceAgent,
      privateServiceAccessExactReread:true,
      cloudNatPresent:false, persistentEndpointCreated:false,
      customJobStarted:false, checkpointDownloaded:false,
      customerCreditsMutated:false, qaApproved:false,
      publicDeliveryAuthorized:false, productionAuthorityGranted:false
    }'
}

fail() {
  printf 'ERROR: %s.\n' "$1" >&2
  exit 1
}

main "$@"
