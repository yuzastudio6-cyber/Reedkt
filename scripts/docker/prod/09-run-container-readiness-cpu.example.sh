#!/usr/bin/env bash
set -euo pipefail

: "${REEDITPRO_CPU_WORKER_IMAGE:=manual-not-set}"
: "${REEDITPRO_SOURCE_COMMIT_SHA:=manual-not-set}"
: "${REEDITPRO_SOURCE_TREE_HASH:=manual-not-set}"
: "${REEDITPRO_CONFIRM_CONTAINER_READINESS:=false}"

if [[ "${REEDITPRO_CPU_WORKER_IMAGE}" == "manual-not-set" ]]; then
  echo "REEDITPRO_CPU_WORKER_IMAGE must be set." >&2
  exit 1
fi

if [[ ! "${REEDITPRO_CPU_WORKER_IMAGE}" =~ ^[^[:space:]@]+@sha256:[0-9a-f]{64}$ ]]; then
  echo "REEDITPRO_CPU_WORKER_IMAGE must be an immutable name@sha256:digest reference." >&2
  exit 1
fi

if [[ ! "${REEDITPRO_SOURCE_COMMIT_SHA}" =~ ^[0-9a-f]{40}$ ]] || [[ ! "${REEDITPRO_SOURCE_TREE_HASH}" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Exact 40-character source commit and tree hashes are required." >&2
  exit 1
fi

if [[ "${REEDITPRO_CONFIRM_CONTAINER_READINESS}" != "true" ]]; then
  echo "Set REEDITPRO_CONFIRM_CONTAINER_READINESS=true before any docker run readiness action." >&2
  exit 1
fi

cmd=(docker run --rm --network none --read-only --cap-drop=ALL --security-opt=no-new-privileges --user=65532:65532
  --env REEDITPRO_CONFIRM_CONTAINER_READINESS=true
  --env REEDITPRO_READINESS_MODE=container_runtime
  --env REEDITPRO_CONTAINER_IMAGE_ROLE=cpu_worker
  --env "REEDITPRO_CONTAINER_IMAGE_REFERENCE=${REEDITPRO_CPU_WORKER_IMAGE}"
  --env "REEDITPRO_SOURCE_COMMIT_SHA=${REEDITPRO_SOURCE_COMMIT_SHA}"
  --env "REEDITPRO_SOURCE_TREE_HASH=${REEDITPRO_SOURCE_TREE_HASH}"
  --env REEDITPRO_RUNTIME_CONFINEMENT_ATTESTED=true
  --env REEDITPRO_NETWORK_MODE=none
  --env REEDITPRO_USER_MEDIA_MOUNTED=false
  --env REEDITPRO_MODEL_DOWNLOADS_DISABLED=true
  --env REEDITPRO_INFERENCE_DISABLED=true
  "${REEDITPRO_CPU_WORKER_IMAGE}" node dist-server/container-readiness-receipt.js)
echo "CPU container readiness command:"
printf ' %q' "${cmd[@]}"
echo
"${cmd[@]}"
