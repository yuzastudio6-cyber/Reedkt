#!/usr/bin/env bash
set -euo pipefail

if [[ "${WEEDITPRO_CONFIRM_SAM31_SOURCE_PREPARATION_SUPPLY_CHAIN:-false}" != true ]]; then
  echo 'ERROR: refusing the private source-preparation supply-chain build without confirmation.' >&2
  exit 1
fi
if [[ "${WEEDITPRO_SAM31_SOURCE_PREPARATION_L4_IMAGE_DIGEST:-}" \
  =~ ^sha256:[0-9a-f]{64}$ ]]; then
  readonly IMAGE_DIGEST="${WEEDITPRO_SAM31_SOURCE_PREPARATION_L4_IMAGE_DIGEST}"
else
  echo 'ERROR: an exact immutable source-preparation image digest is required.' >&2
  exit 1
fi

readonly PROJECT_ID='reeditpro'
readonly REGION='us-central1'
readonly IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/reeditpro-workers/reeditpro-sam31-source-preparation-l4@${IMAGE_DIGEST}"
readonly DIGEST_VALUE="${IMAGE_DIGEST#sha256:}"
readonly EVIDENCE_LOCATION="gs://reeditpro-production-reeditpro-image-supply-chain-evidence/private/sam3_1/source-preparation-l4/image-supply-chain/v1/${DIGEST_VALUE}/"
readonly OBSERVED_DIGEST="$(gcloud artifacts docker images describe \
  "${IMAGE}" --project="${PROJECT_ID}" --format='value(image_summary.digest)')"

if [[ "${OBSERVED_DIGEST}" != "${IMAGE_DIGEST}" ]]; then
  echo 'ERROR: immutable source-preparation image reread did not match.' >&2
  exit 1
fi

gcloud builds submit --no-source \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --config=docker/prod/gpu-worker/sam3_1-source-preparation/cloudbuild.supply-chain.yaml \
  --substitutions="_IMMUTABLE_IMAGE=${IMAGE},_EVIDENCE_LOCATION=${EVIDENCE_LOCATION}" \
  --format=json

printf 'immutable_image=%s\n' "${IMAGE}"
printf 'evidence_location=%s\n' "${EVIDENCE_LOCATION}"
printf 'exact_image_digest_reread=true\n'
printf 'runtime_release_granted=false\n'
printf 'gpu_job_dispatched=false\n'
printf 'customer_credits_mutated=false\n'
printf 'production_ready=false\n'
