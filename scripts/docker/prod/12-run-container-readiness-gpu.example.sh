#!/usr/bin/env bash
set -euo pipefail

: "${REEDITPRO_GPU_WORKER_IMAGE:=manual-not-set}"
: "${REEDITPRO_CONFIRM_CONTAINER_READINESS:=false}"

if [[ "${REEDITPRO_GPU_WORKER_IMAGE}" == "manual-not-set" ]]; then
  echo "REEDITPRO_GPU_WORKER_IMAGE must be set." >&2
  exit 1
fi

if [[ "${REEDITPRO_CONFIRM_CONTAINER_READINESS}" != "true" ]]; then
  echo "Set REEDITPRO_CONFIRM_CONTAINER_READINESS=true before any docker run readiness action." >&2
  exit 1
fi

cmd=(docker run --rm --env REEDITPRO_READINESS_MODE=container_runtime --env REEDITPRO_CONTAINER_IMAGE_ROLE=gpu_worker --env REEDITPRO_GPU_INFERENCE_DISABLED=true --env REEDITPRO_MODEL_DOWNLOADS_DISABLED=true "${REEDITPRO_GPU_WORKER_IMAGE}" npm run prod:readiness:summary -- --mode=static_only)
echo "GPU container readiness command:"
printf ' %q' "${cmd[@]}"
echo
"${cmd[@]}"
