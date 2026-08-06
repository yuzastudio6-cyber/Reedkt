#!/usr/bin/env bash
set -euo pipefail

: "${REEDITPRO_API_IMAGE:=manual-not-set}"
: "${REEDITPRO_CPU_WORKER_IMAGE:=manual-not-set}"
: "${REEDITPRO_RENDER_WORKER_IMAGE:=manual-not-set}"
: "${REEDITPRO_QA_WORKER_IMAGE:=manual-not-set}"
: "${REEDITPRO_GPU_WORKER_IMAGE:=manual-not-set}"
: "${REEDITPRO_TOOL_READINESS_IMAGE:=manual-not-set}"
: "${REEDITPRO_SOURCE_COMMIT_SHA:=manual-not-set}"
: "${REEDITPRO_SOURCE_TREE_HASH:=manual-not-set}"
: "${REEDITPRO_CONFIRM_CONTAINER_READINESS:=false}"

for image_var in REEDITPRO_API_IMAGE REEDITPRO_CPU_WORKER_IMAGE REEDITPRO_RENDER_WORKER_IMAGE REEDITPRO_QA_WORKER_IMAGE REEDITPRO_GPU_WORKER_IMAGE REEDITPRO_TOOL_READINESS_IMAGE; do
  if [[ "${!image_var}" == "manual-not-set" ]]; then
    echo "${image_var} must be set." >&2
    exit 1
  fi
  if [[ ! "${!image_var}" =~ ^[^[:space:]@]+@sha256:[0-9a-f]{64}$ ]]; then
    echo "${image_var} must be an immutable name@sha256:digest reference." >&2
    exit 1
  fi
done

if [[ ! "${REEDITPRO_SOURCE_COMMIT_SHA}" =~ ^[0-9a-f]{40}$ ]] || [[ ! "${REEDITPRO_SOURCE_TREE_HASH}" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Exact 40-character source commit and tree hashes are required." >&2
  exit 1
fi

if [[ "${REEDITPRO_CONFIRM_CONTAINER_READINESS}" != "true" ]]; then
  echo "Set REEDITPRO_CONFIRM_CONTAINER_READINESS=true before any docker run readiness action." >&2
  exit 1
fi

run_role() {
  local role="$1"
  local image="$2"
  local command=(docker run --rm --network none --read-only --cap-drop=ALL --security-opt=no-new-privileges --user=65532:65532
    --env REEDITPRO_CONFIRM_CONTAINER_READINESS=true
    --env REEDITPRO_READINESS_MODE=container_runtime
    --env "REEDITPRO_CONTAINER_IMAGE_ROLE=${role}"
    --env "REEDITPRO_CONTAINER_IMAGE_REFERENCE=${image}"
    --env "REEDITPRO_SOURCE_COMMIT_SHA=${REEDITPRO_SOURCE_COMMIT_SHA}"
    --env "REEDITPRO_SOURCE_TREE_HASH=${REEDITPRO_SOURCE_TREE_HASH}"
    --env REEDITPRO_RUNTIME_CONFINEMENT_ATTESTED=true
    --env REEDITPRO_NETWORK_MODE=none
    --env REEDITPRO_USER_MEDIA_MOUNTED=false
    --env REEDITPRO_MODEL_DOWNLOADS_DISABLED=true
    --env REEDITPRO_INFERENCE_DISABLED=true
    "${image}" node dist-server/container-readiness-receipt.js)
  echo "Container readiness command:"
  printf ' %q' "${command[@]}"
  echo
  "${command[@]}"
}

run_role api "${REEDITPRO_API_IMAGE}"
run_role cpu_worker "${REEDITPRO_CPU_WORKER_IMAGE}"
run_role render_worker "${REEDITPRO_RENDER_WORKER_IMAGE}"
run_role qa_worker "${REEDITPRO_QA_WORKER_IMAGE}"
run_role gpu_worker "${REEDITPRO_GPU_WORKER_IMAGE}"
run_role tool_readiness_worker "${REEDITPRO_TOOL_READINESS_IMAGE}"
