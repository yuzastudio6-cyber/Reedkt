#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./00-print-image-config.sh
source "${SCRIPT_DIR}/00-print-image-config.sh"

require_clean_source_identity
print_image_config
print_source_identity

for required_digest in \
  WEEDITPRO_VISUAL_EVIDENCE_REQUIREMENTS_SHA256 \
  WEEDITPRO_VISUAL_EVIDENCE_FFMPEG_RECEIPT_SHA256 \
  WEEDITPRO_VISUAL_EVIDENCE_OPENCV_RECEIPT_SHA256 \
  WEEDITPRO_VISUAL_EVIDENCE_OCR_MODEL_MANIFEST_SHA256 \
  WEEDITPRO_VISUAL_EVIDENCE_PRIVATE_CAPSULE_MANIFEST_SHA256; do
  if [[ ! "${!required_digest:-}" =~ ^[a-f0-9]{64}$ ]]; then
    echo "ERROR: ${required_digest} must be an exact SHA-256 digest." >&2
    exit 1
  fi
done

if [[ ! -d visual_evidence_private_build_input ]]; then
  echo 'ERROR: the reviewed private visual-evidence build capsule is absent.' >&2
  exit 1
fi

docker build \
  --platform linux/amd64 \
  --build-arg "WEEDITPRO_SOURCE_COMMIT_SHA=${REEDITPRO_SOURCE_COMMIT_SHA}" \
  --build-arg "WEEDITPRO_SOURCE_TREE_HASH=${REEDITPRO_SOURCE_TREE_HASH}" \
  --build-arg "WEEDITPRO_SOURCE_CLEAN=${REEDITPRO_SOURCE_CLEAN}" \
  --build-arg "WEEDITPRO_VISUAL_EVIDENCE_REQUIREMENTS_SHA256=${WEEDITPRO_VISUAL_EVIDENCE_REQUIREMENTS_SHA256}" \
  --build-arg "WEEDITPRO_VISUAL_EVIDENCE_FFMPEG_RECEIPT_SHA256=${WEEDITPRO_VISUAL_EVIDENCE_FFMPEG_RECEIPT_SHA256}" \
  --build-arg "WEEDITPRO_VISUAL_EVIDENCE_OPENCV_RECEIPT_SHA256=${WEEDITPRO_VISUAL_EVIDENCE_OPENCV_RECEIPT_SHA256}" \
  --build-arg "WEEDITPRO_VISUAL_EVIDENCE_OCR_MODEL_MANIFEST_SHA256=${WEEDITPRO_VISUAL_EVIDENCE_OCR_MODEL_MANIFEST_SHA256}" \
  --build-arg "WEEDITPRO_VISUAL_EVIDENCE_PRIVATE_CAPSULE_MANIFEST_SHA256=${WEEDITPRO_VISUAL_EVIDENCE_PRIVATE_CAPSULE_MANIFEST_SHA256}" \
  --file docker/prod/gpu-worker/visual-evidence/Dockerfile.candidate \
  --tag "$(image_name reeditpro-l4-media-worker)" \
  .

echo 'Built one local candidate tag only.'
echo 'Push, immutable digest, supply-chain checks, L4 qualification, and deployment remain separate gates.'
