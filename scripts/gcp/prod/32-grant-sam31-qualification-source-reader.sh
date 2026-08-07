#!/usr/bin/env bash
set -Eeuo pipefail

# Grants the immutable image builder read-only access to only the official
# private SAM 3.1 source prefix. It does not grant checkpoint, token, write,
# delete, model-runtime, GPU, billing, or production authority.

readonly PROJECT_ID='reeditpro'
readonly BUCKET='reeditpro-production-reeditpro-model-artifacts'
readonly SERVICE_ACCOUNT='reeditpro-image-builder-sa@reeditpro.iam.gserviceaccount.com'
readonly ROLE='roles/storage.objectViewer'
readonly CONDITION_TITLE='weeditpro_sam31_qualification_source_read_v1'
readonly SOURCE_RESOURCE_PREFIX='projects/_/buckets/reeditpro-production-reeditpro-model-artifacts/objects/private/model-artifacts/sam3_1/source/'
readonly CONDITION_EXPRESSION="resource.name.startsWith('${SOURCE_RESOURCE_PREFIX}')"
readonly CONFIRMATION='grant-weeditpro-sam31-qualification-source-reader-v1'

fail() {
  printf 'ERROR: %s.\n' "$1" >&2
  exit 1
}

[[ $# -eq 0 ]] || fail 'caller arguments are forbidden'
[[ "${WEEDITPRO_CONFIRM_SAM31_QUALIFICATION_SOURCE_READER:-}" \
  == "${CONFIRMATION}" ]] || fail 'exact IAM confirmation is missing'
[[ "$(gcloud config get-value project 2>/dev/null)" == "${PROJECT_ID}" ]] \
  || fail 'active Google Cloud project changed'
gcloud iam service-accounts describe "${SERVICE_ACCOUNT}" \
  --project="${PROJECT_ID}" >/dev/null \
  || fail 'image-builder service identity is unavailable'

gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" \
  --project="${PROJECT_ID}" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="${ROLE}" \
  --condition="expression=${CONDITION_EXPRESSION},title=${CONDITION_TITLE},description=Read-only official SAM 3.1 source for immutable qualification image builds" \
  --quiet >/dev/null

policy="$(gcloud storage buckets get-iam-policy "gs://${BUCKET}" \
  --project="${PROJECT_ID}" --format=json)"
jq -e \
  --arg member "serviceAccount:${SERVICE_ACCOUNT}" \
  --arg role "${ROLE}" \
  --arg title "${CONDITION_TITLE}" \
  --arg expression "${CONDITION_EXPRESSION}" '
    any(.bindings[]?;
      .role == $role
      and .condition.title == $title
      and .condition.expression == $expression
      and .members == [$member]
    )
  ' <<<"${policy}" >/dev/null \
  || fail 'source-prefix IAM binding did not reread exactly'

printf '%s\n' '{'
printf '  "operation":"weeditpro_sam31_qualification_source_reader_v1",\n'
printf '  "bucket":"%s",\n' "${BUCKET}"
printf '  "serviceAccount":"%s",\n' "${SERVICE_ACCOUNT}"
printf '  "conditionTitle":"%s",\n' "${CONDITION_TITLE}"
printf '  "sourcePrefixReadOnly":true,\n'
printf '  "checkpointReadAuthorized":false,\n'
printf '  "objectWriteOrDeleteAuthorized":false,\n'
printf '  "gpuOrModelRuntimeStarted":false,\n'
printf '  "customerCreditsMutated":false,\n'
printf '  "productionAuthorityGranted":false\n'
printf '%s\n' '}'
