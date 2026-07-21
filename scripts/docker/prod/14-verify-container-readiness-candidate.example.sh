#!/usr/bin/env bash
set -euo pipefail

: "${REEDITPRO_CONFIRM_CONTAINER_HOST_VERIFICATION:?Set REEDITPRO_CONFIRM_CONTAINER_HOST_VERIFICATION=true}"
: "${REEDITPRO_CONTAINER_READINESS_CANDIDATE_FILE:?Set the retained candidate JSON file path}"
if [[ "${REEDITPRO_CONFIRM_CONTAINER_HOST_VERIFICATION}" != "true" ]]; then
  echo "ERROR: explicit local host verification confirmation is required." >&2
  exit 1
fi
if [[ ! -f "${REEDITPRO_CONTAINER_READINESS_CANDIDATE_FILE}" || -L "${REEDITPRO_CONTAINER_READINESS_CANDIDATE_FILE}" ]]; then
  echo "ERROR: candidate input must be one regular, non-symlink file." >&2
  exit 1
fi
candidate_bytes="$(wc -c < "${REEDITPRO_CONTAINER_READINESS_CANDIDATE_FILE}")"
if (( candidate_bytes < 1 || candidate_bytes > 2097152 )); then
  echo "ERROR: candidate input must be between 1 byte and 2 MiB." >&2
  exit 1
fi
if [[ ! -f dist-release-tools/container-readiness-host-verifier.js ]]; then
  echo "ERROR: run npm run build:container-readiness-host-verifier from the exact clean source first." >&2
  exit 1
fi

echo "Verifying the retained candidate with read-only local git and docker image inspection."
echo "No image build, pull, run, push, provider, cloud, database, billing, or deployment action will occur."
REEDITPRO_CONTAINER_HOST_VERIFICATION_MODE=local_git_and_docker_inspect \
  node dist-release-tools/container-readiness-host-verifier.js \
  < "${REEDITPRO_CONTAINER_READINESS_CANDIDATE_FILE}"
