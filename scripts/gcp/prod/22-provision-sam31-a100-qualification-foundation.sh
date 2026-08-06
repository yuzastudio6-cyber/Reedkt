#!/usr/bin/env bash
set -euo pipefail

# Idempotent control-plane foundation for the private SAM 3.1 A100 80 GB
# source/checkpoint qualification. This script creates no VM, Batch job,
# model/checkpoint bytes, provider request, customer charge, or production
# authority. It only prepares the fixed scale-from-zero resources consumed by
# the separately admitted canonical qualification owner.

readonly PROJECT_ID='reeditpro'
readonly PROJECT_NUMBER='390722338345'
readonly REGION='us-central1'
readonly NETWORK='weeditpro-gpu-private'
readonly SUBNET='weeditpro-gpu-private-us-central1'
readonly SUBNET_CIDR='10.42.0.0/24'
readonly QUALIFICATION_SA='weeditpro-sam31-qual-sa'
readonly API_SA='reeditpro-api-sa'
readonly REPOSITORY='reeditpro-workers'
readonly MODEL_BUCKET='reeditpro-production-reeditpro-model-artifacts'
readonly QUALIFICATION_BUCKET='reeditpro-production-sam31-qualification-private'
readonly KEY_RING='weeditpro-private-artifacts'
readonly ENCRYPTION_KEY='sam31-qualification'
readonly INSTANCE_TEMPLATE='weeditpro-sam31-qualification-a100-v1'
readonly BATCH_IMAGE_PROJECT='batch-custom-image'
readonly BATCH_IMAGE='batch-debian-11-official-20260730-00-p01'
readonly BATCH_IMAGE_ID='2466381682817372572'
readonly CONFIRMATION='provision-weeditpro-sam31-a100-qualification-foundation-v1'
readonly QUALIFICATION_SA_EMAIL="${QUALIFICATION_SA}@${PROJECT_ID}.iam.gserviceaccount.com"
readonly API_SA_EMAIL="${API_SA}@${PROJECT_ID}.iam.gserviceaccount.com"
readonly STORAGE_SERVICE_AGENT="service-${PROJECT_NUMBER}@gs-project-accounts.iam.gserviceaccount.com"
readonly KMS_KEY_RESOURCE="projects/${PROJECT_ID}/locations/${REGION}/keyRings/${KEY_RING}/cryptoKeys/${ENCRYPTION_KEY}"

main() {
  assert_operator_boundary
  create_qualification_service_account
  create_private_encryption_key
  configure_kms_access
  create_private_qualification_bucket
  configure_least_privilege_iam
  create_exact_instance_template
  assert_exact_foundation
  emit_receipt
}

assert_operator_boundary() {
  [[ "${WEEDITPRO_CONFIRM_SAM31_A100_QUALIFICATION_FOUNDATION:-}" == \
    "${CONFIRMATION}" ]] || fail 'exact A100 qualification foundation confirmation is missing'
  [[ "$(gcloud config get-value project 2>/dev/null)" == "${PROJECT_ID}" ]] \
    || fail 'active gcloud project does not match the fixed project'
  [[ "$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')" == \
    "${PROJECT_NUMBER}" ]] || fail 'project number changed'
  gcloud iam service-accounts describe "${API_SA_EMAIL}" \
    --project="${PROJECT_ID}" >/dev/null
  gcloud artifacts repositories describe "${REPOSITORY}" \
    --project="${PROJECT_ID}" --location="${REGION}" >/dev/null
  assert_private_network
  assert_batch_image
}

assert_private_network() {
  local network_json subnet_json router_json
  network_json="$(gcloud compute networks describe "${NETWORK}" \
    --project="${PROJECT_ID}" --format=json)"
  subnet_json="$(gcloud compute networks subnets describe "${SUBNET}" \
    --project="${PROJECT_ID}" --region="${REGION}" --format=json)"
  router_json="$(gcloud compute routers list --project="${PROJECT_ID}" \
    --regions="${REGION}" --format=json)"
  jq -e --arg network "${NETWORK}" '
    .name == $network and .autoCreateSubnetworks == false
    and .mtu == 1460 and .routingConfig.routingMode == "REGIONAL"
  ' <<<"${network_json}" >/dev/null || fail 'private GPU network changed'
  jq -e --arg subnet "${SUBNET}" --arg cidr "${SUBNET_CIDR}" '
    .name == $subnet and .ipCidrRange == $cidr
    and .privateIpGoogleAccess == true and .purpose == "PRIVATE"
    and .stackType == "IPV4_ONLY"
  ' <<<"${subnet_json}" >/dev/null || fail 'private GPU subnet changed'
  jq -e 'length == 0' <<<"${router_json}" >/dev/null \
    || fail 'private GPU network has a router or Cloud NAT'
}

assert_batch_image() {
  local image_json
  image_json="$(gcloud compute images describe "${BATCH_IMAGE}" \
    --project="${BATCH_IMAGE_PROJECT}" --format=json)"
  jq -e --arg name "${BATCH_IMAGE}" --arg id "${BATCH_IMAGE_ID}" '
    .name == $name and (.id | tostring) == $id and .status == "READY"
    and .deprecated == null
  ' <<<"${image_json}" >/dev/null || fail 'pinned Batch OS image changed'
}

create_qualification_service_account() {
  if gcloud iam service-accounts describe "${QUALIFICATION_SA_EMAIL}" \
    --project="${PROJECT_ID}" >/dev/null 2>&1; then
    printf 'Service account already exists: %s\n' "${QUALIFICATION_SA_EMAIL}"
  else
    run_gcloud iam service-accounts create "${QUALIFICATION_SA}" \
      --project="${PROJECT_ID}" \
      --display-name='WeEditPro private SAM 3.1 A100 qualification worker' \
      --description='Network-isolated, scale-from-zero SAM 3.1 source/checkpoint qualification only'
  fi
}

create_private_encryption_key() {
  if ! gcloud kms keyrings describe "${KEY_RING}" --project="${PROJECT_ID}" \
    --location="${REGION}" >/dev/null 2>&1; then
    run_gcloud kms keyrings create "${KEY_RING}" --project="${PROJECT_ID}" \
      --location="${REGION}"
  fi
  if ! gcloud kms keys describe "${ENCRYPTION_KEY}" --project="${PROJECT_ID}" \
    --location="${REGION}" --keyring="${KEY_RING}" >/dev/null 2>&1; then
    run_gcloud kms keys create "${ENCRYPTION_KEY}" --project="${PROJECT_ID}" \
      --location="${REGION}" --keyring="${KEY_RING}" \
      --purpose=encryption --protection-level=hsm \
      --rotation-period=90d --next-rotation-time='+90d'
  fi
}

configure_kms_access() {
  run_gcloud kms keys add-iam-policy-binding "${ENCRYPTION_KEY}" \
    --project="${PROJECT_ID}" --location="${REGION}" \
    --keyring="${KEY_RING}" \
    --member="serviceAccount:${STORAGE_SERVICE_AGENT}" \
    --role=roles/cloudkms.cryptoKeyEncrypterDecrypter \
    --condition=None --quiet
}

create_private_qualification_bucket() {
  if gcloud storage buckets describe "gs://${QUALIFICATION_BUCKET}" \
    --project="${PROJECT_ID}" >/dev/null 2>&1; then
    printf 'Bucket already exists: gs://%s\n' "${QUALIFICATION_BUCKET}"
  else
    run_gcloud storage buckets create "gs://${QUALIFICATION_BUCKET}" \
      --project="${PROJECT_ID}" --location="${REGION}" \
      --default-storage-class=STANDARD --uniform-bucket-level-access \
      --public-access-prevention --soft-delete-duration=14d \
      --default-encryption-key="${KMS_KEY_RESOURCE}"
  fi
  run_gcloud storage buckets update "gs://${QUALIFICATION_BUCKET}" \
    --project="${PROJECT_ID}" --uniform-bucket-level-access \
    --public-access-prevention --soft-delete-duration=14d \
    --default-encryption-key="${KMS_KEY_RESOURCE}" \
    --update-labels='app=weeditpro,env=production,scope=sam31-qualification'
}

configure_least_privilege_iam() {
  grant_project_role "${QUALIFICATION_SA_EMAIL}" roles/batch.agentReporter
  grant_project_role "${QUALIFICATION_SA_EMAIL}" roles/logging.logWriter
  grant_project_role "${QUALIFICATION_SA_EMAIL}" roles/monitoring.metricWriter
  grant_project_role "${API_SA_EMAIL}" roles/compute.viewer

  run_gcloud iam service-accounts add-iam-policy-binding \
    "${QUALIFICATION_SA_EMAIL}" --project="${PROJECT_ID}" \
    --member="serviceAccount:${API_SA_EMAIL}" \
    --role=roles/iam.serviceAccountUser --condition=None --quiet

  grant_bucket_role "${QUALIFICATION_BUCKET}" "${QUALIFICATION_SA_EMAIL}" \
    roles/storage.objectViewer
  grant_bucket_role "${QUALIFICATION_BUCKET}" "${QUALIFICATION_SA_EMAIL}" \
    roles/storage.objectCreator
  grant_bucket_role "${QUALIFICATION_BUCKET}" "${API_SA_EMAIL}" \
    roles/storage.objectViewer
  grant_bucket_role "${QUALIFICATION_BUCKET}" "${API_SA_EMAIL}" \
    roles/storage.objectCreator
  grant_bucket_role "${MODEL_BUCKET}" "${API_SA_EMAIL}" \
    roles/storage.objectViewer

  run_gcloud artifacts repositories add-iam-policy-binding "${REPOSITORY}" \
    --project="${PROJECT_ID}" --location="${REGION}" \
    --member="serviceAccount:${QUALIFICATION_SA_EMAIL}" \
    --role=roles/artifactregistry.reader --condition=None --quiet
}

create_exact_instance_template() {
  if gcloud compute instance-templates describe "${INSTANCE_TEMPLATE}" \
    --project="${PROJECT_ID}" >/dev/null 2>&1; then
    printf 'Instance template already exists: %s\n' "${INSTANCE_TEMPLATE}"
  else
    run_gcloud compute instance-templates create "${INSTANCE_TEMPLATE}" \
      --project="${PROJECT_ID}" --machine-type=a2-ultragpu-1g \
      --image="${BATCH_IMAGE}" --image-project="${BATCH_IMAGE_PROJECT}" \
      --boot-disk-size=200GB --boot-disk-type=pd-balanced \
      --maintenance-policy=TERMINATE --provisioning-model=STANDARD \
      --service-account="${QUALIFICATION_SA_EMAIL}" \
      --scopes=https://www.googleapis.com/auth/cloud-platform \
      --network="${NETWORK}" --subnet="${SUBNET}" --no-address \
      --no-can-ip-forward --shielded-secure-boot --shielded-vtpm \
      --shielded-integrity-monitoring \
      --metadata=block-project-ssh-keys=true,enable-oslogin=true \
      --labels='app=weeditpro,env=production,scope=sam31-qualification'
  fi
}

assert_exact_foundation() {
  local service_json bucket_json key_json template_json
  service_json="$(gcloud iam service-accounts describe \
    "${QUALIFICATION_SA_EMAIL}" --project="${PROJECT_ID}" --format=json)"
  bucket_json="$(gcloud storage buckets describe \
    "gs://${QUALIFICATION_BUCKET}" --project="${PROJECT_ID}" --format=json)"
  key_json="$(gcloud kms keys describe "${ENCRYPTION_KEY}" \
    --project="${PROJECT_ID}" --location="${REGION}" \
    --keyring="${KEY_RING}" --format=json)"
  template_json="$(gcloud compute instance-templates describe \
    "${INSTANCE_TEMPLATE}" --project="${PROJECT_ID}" --format=json)"
  jq -e --arg email "${QUALIFICATION_SA_EMAIL}" \
    '.email == $email and .disabled == false' <<<"${service_json}" >/dev/null \
    || fail 'qualification service identity exact reread failed'
  jq -e --arg key "${KMS_KEY_RESOURCE}" '
    .location == "US-CENTRAL1" and .storageClass == "STANDARD"
    and .iamConfiguration.uniformBucketLevelAccess.enabled == true
    and .iamConfiguration.publicAccessPrevention == "enforced"
    and .encryption.defaultKmsKeyName == $key
    and .softDeletePolicy.retentionDurationSeconds == "1209600"
  ' <<<"${bucket_json}" >/dev/null || fail 'qualification bucket changed'
  jq -e '
    .purpose == "ENCRYPT_DECRYPT" and .primary.protectionLevel == "HSM"
    and .rotationPeriod == "7776000s" and .primary.state == "ENABLED"
  ' <<<"${key_json}" >/dev/null || fail 'qualification encryption key changed'
  jq -e --arg sa "${QUALIFICATION_SA_EMAIL}" --arg imageId "${BATCH_IMAGE_ID}" '
    .properties.machineType == "a2-ultragpu-1g"
    and .properties.canIpForward == false
    and .properties.scheduling.onHostMaintenance == "TERMINATE"
    and .properties.scheduling.provisioningModel == "STANDARD"
    and .properties.serviceAccounts[0].email == $sa
    and .properties.networkInterfaces[0].accessConfigs == null
    and (.properties.disks[0].initializeParams.sourceImage | endswith("/" + $imageId))
    and .properties.disks[0].initializeParams.diskSizeGb == "200"
    and (.properties.metadata.items
      | any(.key == "block-project-ssh-keys" and .value == "true"))
  ' <<<"${template_json}" >/dev/null || fail 'A100 instance template changed'
}

emit_receipt() {
  jq -n \
    --arg projectId "${PROJECT_ID}" --arg region "${REGION}" \
    --arg serviceAccount "${QUALIFICATION_SA_EMAIL}" \
    --arg bucket "${QUALIFICATION_BUCKET}" \
    --arg kmsKey "${KMS_KEY_RESOURCE}" \
    --arg instanceTemplate "projects/${PROJECT_ID}/global/instanceTemplates/${INSTANCE_TEMPLATE}" \
    --arg batchOsImage "projects/${BATCH_IMAGE_PROJECT}/global/images/${BATCH_IMAGE}" \
    '{
      schemaVersion:"weeditpro-sam31-a100-qualification-foundation-receipt-v1",
      projectId:$projectId, region:$region,
      serviceAccount:$serviceAccount, privateBucket:$bucket,
      kmsKey:$kmsKey, instanceTemplate:$instanceTemplate,
      batchOsImage:$batchOsImage,
      accelerator:"nvidia_a100_80gb", machineType:"a2-ultragpu-1g",
      userTriggeredScaleFromZero:true, minimumIdleInstances:0,
      privateNetworkNoExternalIpRequired:true,
      batchManagedGpuDriverInstallationRequired:true,
      modelOrCheckpointDownloaded:false, gpuJobStarted:false,
      customerCreditsMutated:false, productionAuthorityGranted:false
    }'
}

grant_project_role() {
  run_gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:$1" --role="$2" --condition=None --quiet
}

grant_bucket_role() {
  run_gcloud storage buckets add-iam-policy-binding "gs://$1" \
    --project="${PROJECT_ID}" --member="serviceAccount:$2" --role="$3" --quiet
}

run_gcloud() {
  printf '\n+ gcloud'
  printf ' %q' "$@"
  printf '\n'
  gcloud "$@"
}

fail() {
  printf 'ERROR: %s.\n' "$1" >&2
  exit 1
}

main "$@"
