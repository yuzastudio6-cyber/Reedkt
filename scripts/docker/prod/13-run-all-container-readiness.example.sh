#!/usr/bin/env bash
set -euo pipefail

: "${REEDITPRO_API_IMAGE:=manual-not-set}"
: "${REEDITPRO_CPU_WORKER_IMAGE:=manual-not-set}"
: "${REEDITPRO_RENDER_WORKER_IMAGE:=manual-not-set}"
: "${REEDITPRO_QA_WORKER_IMAGE:=manual-not-set}"
: "${REEDITPRO_GPU_WORKER_IMAGE:=manual-not-set}"
: "${REEDITPRO_TOOL_READINESS_IMAGE:=manual-not-set}"
: "${REEDITPRO_CONFIRM_CONTAINER_READINESS:=false}"

for image_var in REEDITPRO_API_IMAGE REEDITPRO_CPU_WORKER_IMAGE REEDITPRO_RENDER_WORKER_IMAGE REEDITPRO_QA_WORKER_IMAGE REEDITPRO_GPU_WORKER_IMAGE REEDITPRO_TOOL_READINESS_IMAGE; do
  if [[ "${!image_var}" == "manual-not-set" ]]; then
    echo "${image_var} must be set." >&2
    exit 1
  fi
done

if [[ "${REEDITPRO_CONFIRM_CONTAINER_READINESS}" != "true" ]]; then
  echo "Set REEDITPRO_CONFIRM_CONTAINER_READINESS=true before any docker run readiness action." >&2
  exit 1
fi

commands=(
  "docker run --rm --env REEDITPRO_READINESS_MODE=container_runtime --env REEDITPRO_CONTAINER_IMAGE_ROLE=api ${REEDITPRO_API_IMAGE} npm run prod:readiness:summary -- --mode=static_only"
  "docker run --rm --env REEDITPRO_READINESS_MODE=container_runtime --env REEDITPRO_CONTAINER_IMAGE_ROLE=cpu_worker ${REEDITPRO_CPU_WORKER_IMAGE} npm run prod:readiness:summary -- --mode=static_only"
  "docker run --rm --env REEDITPRO_READINESS_MODE=container_runtime --env REEDITPRO_CONTAINER_IMAGE_ROLE=render_worker ${REEDITPRO_RENDER_WORKER_IMAGE} npm run prod:readiness:summary -- --mode=static_only"
  "docker run --rm --env REEDITPRO_READINESS_MODE=container_runtime --env REEDITPRO_CONTAINER_IMAGE_ROLE=qa_worker ${REEDITPRO_QA_WORKER_IMAGE} npm run prod:readiness:summary -- --mode=static_only"
  "docker run --rm --env REEDITPRO_READINESS_MODE=container_runtime --env REEDITPRO_CONTAINER_IMAGE_ROLE=gpu_worker --env REEDITPRO_GPU_INFERENCE_DISABLED=true --env REEDITPRO_MODEL_DOWNLOADS_DISABLED=true ${REEDITPRO_GPU_WORKER_IMAGE} npm run prod:readiness:summary -- --mode=static_only"
  "docker run --rm --env REEDITPRO_READINESS_MODE=container_runtime --env REEDITPRO_CONTAINER_IMAGE_ROLE=tool_readiness_worker ${REEDITPRO_TOOL_READINESS_IMAGE} npm run prod:readiness:summary -- --mode=static_only"
)

for command in "${commands[@]}"; do
  echo "Container readiness command:"
  echo "${command}"
  eval "${command}"
done
