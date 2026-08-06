#!/usr/bin/env bash
set -euo pipefail

# Deploys exactly one scale-from-zero Cloud Run Job definition for the
# WeEditPro Track All SAM 3.1 L4 task-QA lane. It never executes the job and
# accepts only an immutable Artifact Registry digest.

readonly PROJECT_ID='reeditpro'
readonly PROJECT_NUMBER='390722338345'
readonly REGION='us-central1'
readonly REPOSITORY='reeditpro-workers'
readonly IMAGE_NAME='reeditpro-track-all-l4-task-qa'
readonly JOB_NAME='reeditpro-track-all-mask-qa-l4'
readonly GPU_WORKER_SERVICE_ACCOUNT='reeditpro-gpu-worker-sa@reeditpro.iam.gserviceaccount.com'
readonly MASK_BUCKET='reeditpro-production-reeditpro-masks'
readonly VOLUME_NAME='reeditpro-private-gpu-objects'
readonly NETWORK='weeditpro-gpu-private'
readonly SUBNET='weeditpro-gpu-private-us-central1'
readonly NETWORK_TAG='weeditpro-gpu-private-no-nat'
readonly CONFIRMATION='deploy-weeditpro-track-all-sam31-l4-task-qa-v1'

main() {
  assert_operator_boundary
  local digest="${WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_DIGEST}"
  local image="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}@${digest}"

  gcloud artifacts docker images describe "${image}" \
    --project="${PROJECT_ID}" \
    --format='value(image_summary.digest)' \
    | grep -Fx -- "${digest}" >/dev/null

  gcloud run jobs deploy "${JOB_NAME}" \
    --project="${PROJECT_ID}" \
    --region="${REGION}" \
    --image="${image}" \
    --service-account="${GPU_WORKER_SERVICE_ACCOUNT}" \
    --execution-environment=gen2 \
    --cpu=8 \
    --memory=32Gi \
    --gpu=1 \
    --gpu-type=nvidia-l4 \
    --no-gpu-zonal-redundancy \
    --tasks=1 \
    --parallelism=1 \
    --max-retries=0 \
    --task-timeout=3600s \
    --network="${NETWORK}" \
    --subnet="${SUBNET}" \
    --network-tags="${NETWORK_TAG}" \
    --vpc-egress=all-traffic \
    --add-volume="name=${VOLUME_NAME},type=cloud-storage,bucket=${MASK_BUCKET},readonly=false,mount-options=uid=65532;gid=65532;implicit-dirs=true" \
    --add-volume-mount="volume=${VOLUME_NAME},mount-path=/mnt/reeditpro" \
    --set-env-vars='REEDITPRO_ENV=production,WORKER_GROUP=l4_standard_primary,WEEDITPRO_GPU_ACCELERATOR_CLASS=nvidia_l4' \
    --labels='app=weeditpro,operation=track-all-mask-qa,route=l4-standard-primary,scale=zero,release=qualification-candidate' \
    --quiet \
    --format=none

  local observed
  observed="$(gcloud run jobs describe "${JOB_NAME}" \
    --project="${PROJECT_ID}" \
    --region="${REGION}" \
    --format=json)"
  jq -e \
    --arg image "${image}" \
    --arg service_account "${GPU_WORKER_SERVICE_ACCOUNT}" \
    --arg bucket "${MASK_BUCKET}" \
    --arg volume "${VOLUME_NAME}" \
    --arg network "${NETWORK}" \
    --arg subnet "${SUBNET}" \
    --arg network_tag "${NETWORK_TAG}" \
    '
      .spec.template.spec.taskCount == 1
      and .spec.template.spec.parallelism == 1
      and .spec.template.spec.template.spec.maxRetries == 0
      and .spec.template.spec.template.spec.timeoutSeconds == "3600"
      and .spec.template.spec.template.spec.serviceAccountName == $service_account
      and .spec.template.metadata.annotations."run.googleapis.com/execution-environment" == "gen2"
      and .spec.template.metadata.annotations."run.googleapis.com/gpu-zonal-redundancy-disabled" == "true"
      and .spec.template.metadata.annotations."run.googleapis.com/vpc-access-egress" == "all-traffic"
      and (.spec.template.metadata.annotations."run.googleapis.com/network-interfaces" | fromjson)
        == [{"network":$network,"subnetwork":$subnet,"tags":[$network_tag]}]
      and (.spec.template.spec.template.spec.containers | length) == 1
      and .spec.template.spec.template.spec.containers[0].image == $image
      and .spec.template.spec.template.spec.containers[0].resources.limits.cpu == "8"
      and .spec.template.spec.template.spec.containers[0].resources.limits.memory == "32Gi"
      and .spec.template.spec.template.spec.containers[0].resources.limits."nvidia.com/gpu" == "1"
      and .spec.template.spec.template.spec.nodeSelector."run.googleapis.com/accelerator" == "nvidia-l4"
      and (.spec.template.spec.template.spec.containers[0].env | map({key: .name, value: .value}) | from_entries)
        == {
          "REEDITPRO_ENV":"production",
          "WEEDITPRO_GPU_ACCELERATOR_CLASS":"nvidia_l4",
          "WORKER_GROUP":"l4_standard_primary"
        }
      and (.spec.template.spec.template.spec.containers[0].volumeMounts | length) == 1
      and .spec.template.spec.template.spec.containers[0].volumeMounts[0].name == $volume
      and .spec.template.spec.template.spec.containers[0].volumeMounts[0].mountPath == "/mnt/reeditpro"
      and (.spec.template.spec.template.spec.volumes | length) == 1
      and .spec.template.spec.template.spec.volumes[0].name == $volume
      and .spec.template.spec.template.spec.volumes[0].csi.driver == "gcsfuse.run.googleapis.com"
      and .spec.template.spec.template.spec.volumes[0].csi.volumeAttributes.bucketName == $bucket
      and .spec.template.spec.template.spec.volumes[0].csi.volumeAttributes.mountOptions == "uid=65532,gid=65532,implicit-dirs=true"
    ' <<<"${observed}" >/dev/null || fail 'the deployed job did not exact-reread'

  printf '%s\n' '{'
  printf '  "operation":"weeditpro_track_all_sam31_l4_task_qa_job_definition_v1",\n'
  printf '  "projectId":"%s",\n' "${PROJECT_ID}"
  printf '  "region":"%s",\n' "${REGION}"
  printf '  "jobResource":"projects/%s/locations/%s/jobs/%s",\n' \
    "${PROJECT_ID}" "${REGION}" "${JOB_NAME}"
  printf '  "imageDigest":"%s",\n' "${digest}"
  printf '  "accelerator":"nvidia_l4",\n'
  printf '  "taskCount":1,\n'
  printf '  "parallelism":1,\n'
  printf '  "maximumRetries":0,\n'
  printf '  "minimumIdleInstances":0,\n'
  printf '  "jobExecutionStartedByThisOperator":false,\n'
  printf '  "modelOrProviderExecuted":false,\n'
  printf '  "customerCreditsMutated":false,\n'
  printf '  "productionAuthorityGranted":false\n'
  printf '%s\n' '}'
}

assert_operator_boundary() {
  if [[ "${WEEDITPRO_CONFIRM_TRACK_ALL_L4_TASK_QA_DEPLOYMENT:-}" != "${CONFIRMATION}" ]]; then
    fail 'exact Track All L4 deployment confirmation is missing'
  fi
  if [[ ! "${WEEDITPRO_TRACK_ALL_L4_TASK_QA_IMAGE_DIGEST:-}" =~ ^sha256:[a-f0-9]{64}$ ]]; then
    fail 'the immutable Track All L4 task-QA image digest is missing or invalid'
  fi
  if [[ "$(gcloud config get-value project 2>/dev/null)" != "${PROJECT_ID}" ]]; then
    fail 'active gcloud project does not match the fixed project'
  fi
  if [[ "$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')" != "${PROJECT_NUMBER}" ]]; then
    fail 'GCP project number does not match the reviewed project'
  fi
  gcloud iam service-accounts describe "${GPU_WORKER_SERVICE_ACCOUNT}" \
    --project="${PROJECT_ID}" >/dev/null
  gcloud storage buckets describe "gs://${MASK_BUCKET}" \
    --project="${PROJECT_ID}" >/dev/null
  gcloud compute networks subnets describe "${SUBNET}" \
    --project="${PROJECT_ID}" --region="${REGION}" >/dev/null
  command -v jq >/dev/null
}

fail() {
  printf 'ERROR: %s.\n' "$1" >&2
  exit 1
}

main "$@"
