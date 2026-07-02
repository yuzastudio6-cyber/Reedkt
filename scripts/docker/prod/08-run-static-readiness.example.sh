#!/usr/bin/env bash
set -euo pipefail

: "${REEDITPRO_READINESS_IMAGE_TAG:=manual-not-set}"

if [[ "${REEDITPRO_READINESS_IMAGE_TAG}" == "manual-not-set" ]]; then
  echo "REEDITPRO_READINESS_IMAGE_TAG must be set for traceability before running this example." >&2
  exit 1
fi

cmd=(npm run prod:readiness:summary -- --mode=static_only)
echo "Static readiness command:"
printf ' %q' "${cmd[@]}"
echo
"${cmd[@]}"
