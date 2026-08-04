#!/usr/bin/env bash
set -euo pipefail

: "${REEDITPRO_CONFIRM_CONTAINER_MANUAL_REVIEW_PREPARATION:?Set REEDITPRO_CONFIRM_CONTAINER_MANUAL_REVIEW_PREPARATION=true}"
: "${REEDITPRO_CONTAINER_HOST_VERIFICATION_FILE:?Set the retained host-verification JSON file path}"
if [[ "${REEDITPRO_CONFIRM_CONTAINER_MANUAL_REVIEW_PREPARATION}" != "true" ]]; then
  echo "ERROR: explicit manual-review package preparation confirmation is required." >&2
  exit 1
fi
if [[ ! -f "${REEDITPRO_CONTAINER_HOST_VERIFICATION_FILE}" || -L "${REEDITPRO_CONTAINER_HOST_VERIFICATION_FILE}" ]]; then
  echo "ERROR: host verification input must be one regular, non-symlink file." >&2
  exit 1
fi
receipt_bytes="$(wc -c < "${REEDITPRO_CONTAINER_HOST_VERIFICATION_FILE}")"
if (( receipt_bytes < 1 || receipt_bytes > 2097152 )); then
  echo "ERROR: host verification input must be between 1 byte and 2 MiB." >&2
  exit 1
fi
if [[ ! -f dist-release-tools/container-manual-review-package.js ]]; then
  echo "ERROR: run npm run build:container-readiness-host-verifier from the exact clean source first." >&2
  exit 1
fi

echo "Preparing an image-bound manual qualification review package from the retained host receipt."
echo "This creates review input only and does not approve licenses, models, an image, or a release."
node dist-release-tools/container-manual-review-package.js \
  < "${REEDITPRO_CONTAINER_HOST_VERIFICATION_FILE}"
