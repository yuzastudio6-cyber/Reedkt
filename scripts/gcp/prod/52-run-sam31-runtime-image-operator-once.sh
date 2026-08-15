#!/usr/bin/env bash
set -euo pipefail

# Starts or observes one already-authorized SAM 3.1 runtime-image build. It
# accepts only opaque authority lineage; cloud resources and build inputs are
# reread by the canonical owner.

readonly PROJECT_ID='reeditpro'
readonly REGION='us-central1'
readonly JOB='weeditpro-sam31-runtime-image-operator'
readonly CONFIRMATION='run-weeditpro-sam31-runtime-image-operator-once-v1'

fail() {
  printf 'ERROR: %s.\n' "$1" >&2
  exit 1
}

safe_id() {
  # Bash 3.2 rejects ERE repetition bounds above 255. Keep this aligned with
  # the canonical server authority's 240-character safe-ID ceiling.
  [[ "$1" =~ ^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$ \
    && "$1" != *'..'* ]]
}

[[ "${WEEDITPRO_CONFIRM_SAM31_RUNTIME_IMAGE_OPERATOR_RUN:-}" \
  == "${CONFIRMATION}" ]] || fail 'exact operator confirmation is missing'
[[ "$(gcloud config get-value project 2>/dev/null)" == "${PROJECT_ID}" ]] \
  || fail 'active Google Cloud project is not the fixed project'
[[ "$(gcloud config get-value account 2>/dev/null)" \
  == 'aiediting@reeditpro.com' ]] \
  || fail 'active Google Cloud account is not the Reeditpro operator'
action="${WEEDITPRO_SAM31_RUNTIME_IMAGE_ACTION:-}"
[[ "${action}" == 'start_one' || "${action}" == 'observe_one' ]] \
  || fail 'operator action is invalid'
authority_id="${WEEDITPRO_SAM31_RUNTIME_IMAGE_AUTHORITY_ID:-}"
authority_sha="${WEEDITPRO_SAM31_RUNTIME_IMAGE_AUTHORITY_SHA256:-}"
safe_id "${authority_id}" || fail 'authority ID is invalid'
[[ "${authority_sha}" =~ ^[a-f0-9]{64}$ ]] || fail 'authority hash is invalid'
submission_id="${WEEDITPRO_SAM31_RUNTIME_IMAGE_SUBMISSION_ID:-}"
submission_sha="${WEEDITPRO_SAM31_RUNTIME_IMAGE_SUBMISSION_SHA256:-}"
if [[ "${action}" == 'observe_one' ]]; then
  safe_id "${submission_id}" || fail 'submission ID is invalid'
  [[ "${submission_sha}" =~ ^[a-f0-9]{64}$ ]] \
    || fail 'submission hash is invalid'
elif [[ -n "${submission_id}" || -n "${submission_sha}" ]]; then
  fail 'start action cannot carry submission lineage'
fi

job_before="$(gcloud run jobs describe "${JOB}" --project="${PROJECT_ID}" \
  --region="${REGION}" --format=json)"
jq -e '
  (.spec.template.spec.template.spec.containers[0].env | length) == 1
  and .spec.template.spec.template.spec.containers[0].env[0]
    == {name:"WEEDITPRO_SAM31_RUNTIME_IMAGE_OPERATOR_ACTION",value:"disabled"}
  and .spec.template.spec.template.spec.maxRetries == 0
' <<<"${job_before}" >/dev/null || fail 'deployed operator is not unarmed'
active_before="$(gcloud run jobs executions list --job="${JOB}" \
  --project="${PROJECT_ID}" --region="${REGION}" --format=json \
  | jq '[.[] | select((.status.runningCount // 0) > 0)] | length')"
[[ "${active_before}" == '0' ]] || fail 'a prior operator execution is active'

overrides="WEEDITPRO_SAM31_RUNTIME_IMAGE_OPERATOR_ACTION=${action}"
overrides+=",WEEDITPRO_SAM31_RUNTIME_IMAGE_AUTHORITY_ID=${authority_id}"
overrides+=",WEEDITPRO_SAM31_RUNTIME_IMAGE_AUTHORITY_SHA256=${authority_sha}"
if [[ "${action}" == 'observe_one' ]]; then
  overrides+=",WEEDITPRO_SAM31_RUNTIME_IMAGE_SUBMISSION_ID=${submission_id}"
  overrides+=",WEEDITPRO_SAM31_RUNTIME_IMAGE_SUBMISSION_SHA256=${submission_sha}"
fi
execution="$(gcloud run jobs execute "${JOB}" --project="${PROJECT_ID}" \
  --region="${REGION}" --tasks=1 --update-env-vars="${overrides}" \
  --wait --format=json --quiet)"
jq -e '
  (.status.failedCount // 0) == 0
  and (.status.cancelledCount // 0) == 0
  and (.status.runningCount // 0) == 0
  and (.status.succeededCount // 0) == 1
' <<<"${execution}" >/dev/null || fail 'operator execution did not succeed'
execution_name="$(jq -r '.metadata.name // empty' <<<"${execution}")"
short_execution="${execution_name##*/}"
[[ "${short_execution}" == "${JOB}-"* ]] || fail 'execution identity is invalid'

result=''
for _attempt in {1..12}; do
  logs="$(gcloud logging read \
    "resource.type=\"cloud_run_job\" AND resource.labels.job_name=\"${JOB}\" AND labels.\"run.googleapis.com/execution_name\"=\"${short_execution}\"" \
    --project="${PROJECT_ID}" --limit=100 --order=asc --format=json)"
  result="$(jq -c '[.[]?.jsonPayload
    | select(.schemaVersion
      == "canonical-sam3_1-cloud-image-build-operator-v1")][0] // empty' \
    <<<"${logs}")"
  [[ -n "${result}" ]] && break
  sleep 5
done
[[ -n "${result}" ]] || fail 'canonical operator result is absent'
jq -e --arg action "${action}" '
  .action == (if $action == "start_one" then "start" else "observe" end)
  and (if $action == "start_one"
    then .disposition == "submitted" and .imageBuildKnownStarted == true
    else (.disposition == "pending"
      or .disposition
        == "image_built_pending_scan_signature_and_gpu_qualification"
      or .disposition == "terminal_failure")
      and .imageBuildKnownStarted == true
    end)
  and .runtimeReleaseGranted == false
  and .productionReady == false
  and .automaticRetryAllowed == false
  and .developerMachineModelInstallAllowed == false
  and .modelOrCheckpointBytesReadLocally == false
' <<<"${result}" >/dev/null || fail 'canonical operator authority changed'

job_after="$(gcloud run jobs describe "${JOB}" --project="${PROJECT_ID}" \
  --region="${REGION}" --format=json)"
jq -e '
  (.spec.template.spec.template.spec.containers[0].env | length) == 1
  and .spec.template.spec.template.spec.containers[0].env[0]
    == {name:"WEEDITPRO_SAM31_RUNTIME_IMAGE_OPERATOR_ACTION",value:"disabled"}
' <<<"${job_after}" >/dev/null || fail 'execution overrides persisted'
active_after="$(gcloud run jobs executions list --job="${JOB}" \
  --project="${PROJECT_ID}" --region="${REGION}" --format=json \
  | jq '[.[] | select((.status.runningCount // 0) > 0)] | length')"
[[ "${active_after}" == '0' ]] || fail 'operator did not scale back to zero'

printf '{"operation":"weeditpro_sam31_runtime_image_operator_run_v1",'
printf '"execution":"%s","canonicalResult":%s,' \
  "${short_execution}" "${result}"
printf '"operatorRemainsUnarmed":true,"runningOperatorTaskCount":0,'
printf '"gpuOrModelRuntimeStarted":false,"customerCreditsMutated":false,'
printf '"productionAuthorityGranted":false}\n'
