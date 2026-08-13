#!/usr/bin/env bash
set -Eeuo pipefail

# Grants the existing L4 worker only the object access required by the fixed
# eight-minute source-preparation qualification. No bucket administration,
# overwrite, delete, model, billing, delivery, or public runtime authority is
# included.

readonly PROJECT_ID='reeditpro'
readonly SERVICE_ACCOUNT='reeditpro-gpu-worker-sa@reeditpro.iam.gserviceaccount.com'
readonly MEMBER="serviceAccount:${SERVICE_ACCOUNT}"
readonly SOURCE_BUCKET='reeditpro-staging-reeditpro-source-media'
readonly CONTROL_BUCKET='reeditpro-production-reeditpro-control-plane-state'
readonly SOURCE_CONDITION_TITLE='weeditpro_sam31_source_preparation_qualification_source_read_v1'
readonly CONTROL_CONDITION_TITLE='weeditpro_sam31_source_preparation_qualification_receipts_v1'
readonly SOURCE_OBJECT_RESOURCE='projects/_/buckets/reeditpro-staging-reeditpro-source-media/objects/activation-real-video/phase28/phase28-20260528T01552/source-video.mov'
readonly CONTROL_OBJECT_RESOURCE='projects/_/buckets/reeditpro-production-reeditpro-control-plane-state/objects/private/canonical-professional-gpu/v1/'
readonly SOURCE_CONDITION="resource.name == '${SOURCE_OBJECT_RESOURCE}'"
readonly CONTROL_CONDITION="resource.name.startsWith('${CONTROL_OBJECT_RESOURCE}sam3_1-eight-minute-qualification-sources/') || resource.name.startsWith('${CONTROL_OBJECT_RESOURCE}sam3_1-source-preparation-private-qualification-runs/')"
readonly CONFIRMATION='grant-weeditpro-sam31-source-preparation-private-qualification-storage-v1'

fail() {
  printf 'ERROR: %s.\n' "$1" >&2
  exit 1
}

[[ $# -eq 0 ]] || fail 'caller arguments are forbidden'
[[ "${WEEDITPRO_CONFIRM_SAM31_SOURCE_PREPARATION_QUALIFICATION_STORAGE:-}" \
  == "${CONFIRMATION}" ]] || fail 'exact IAM confirmation is missing'
[[ "$(gcloud config get-value project 2>/dev/null)" == "${PROJECT_ID}" ]] \
  || fail 'active Google Cloud project changed'
gcloud iam service-accounts describe "${SERVICE_ACCOUNT}" \
  --project="${PROJECT_ID}" >/dev/null \
  || fail 'L4 worker service identity is unavailable'

gcloud storage buckets add-iam-policy-binding "gs://${SOURCE_BUCKET}" \
  --project="${PROJECT_ID}" \
  --member="${MEMBER}" \
  --role=roles/storage.objectViewer \
  --condition="expression=${SOURCE_CONDITION},title=${SOURCE_CONDITION_TITLE},description=Read only the exact private eight-minute SAM 3.1 qualification source" \
  --quiet >/dev/null

for role in roles/storage.objectCreator roles/storage.objectViewer; do
  gcloud storage buckets add-iam-policy-binding "gs://${CONTROL_BUCKET}" \
    --project="${PROJECT_ID}" \
    --member="${MEMBER}" \
    --role="${role}" \
    --condition="expression=${CONTROL_CONDITION},title=${CONTROL_CONDITION_TITLE},description=Create and reread only SAM 3.1 source-preparation qualification records" \
    --quiet >/dev/null
done

source_policy="$(gcloud storage buckets get-iam-policy \
  "gs://${SOURCE_BUCKET}" --project="${PROJECT_ID}" --format=json)"
control_policy="$(gcloud storage buckets get-iam-policy \
  "gs://${CONTROL_BUCKET}" --project="${PROJECT_ID}" --format=json)"

jq -e \
  --arg member "${MEMBER}" \
  --arg title "${SOURCE_CONDITION_TITLE}" \
  --arg expression "${SOURCE_CONDITION}" '
    any(.bindings[]?;
      .role == "roles/storage.objectViewer"
      and .condition.title == $title
      and .condition.expression == $expression
      and .members == [$member]
    )
  ' <<<"${source_policy}" >/dev/null \
  || fail 'exact qualification-source read binding did not reread'

for role in roles/storage.objectCreator roles/storage.objectViewer; do
  jq -e \
    --arg member "${MEMBER}" \
    --arg role "${role}" \
    --arg title "${CONTROL_CONDITION_TITLE}" \
    --arg expression "${CONTROL_CONDITION}" '
      any(.bindings[]?;
        .role == $role
        and .condition.title == $title
        and .condition.expression == $expression
        and .members == [$member]
      )
    ' <<<"${control_policy}" >/dev/null \
    || fail "exact qualification-record ${role} binding did not reread"
done

printf '%s\n' '{'
printf '  "operation":"weeditpro_sam31_source_preparation_qualification_storage_v1",\n'
printf '  "serviceAccount":"%s",\n' "${SERVICE_ACCOUNT}"
printf '  "exactQualificationSourceReadOnly":true,\n'
printf '  "qualificationReceiptPrefixesCreateAndRereadOnly":true,\n'
printf '  "objectOverwriteOrDeleteAuthorized":false,\n'
printf '  "modelOrGpuRuntimeStarted":false,\n'
printf '  "customerCreditsMutated":false,\n'
printf '  "publicDeliveryAuthorized":false,\n'
printf '  "productionAuthorityGranted":false\n'
printf '%s\n' '}'
