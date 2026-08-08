#!/usr/bin/env bash
set -euo pipefail

# Executes exactly one start or reconcile action using execution-only env
# overrides. The deployed job remains unarmed before and after the execution.

readonly PROJECT_ID='reeditpro'
readonly REGION='us-central1'
readonly JOB='weeditpro-sam31-vertex-operator'
readonly CONFIRMATION='run-weeditpro-sam31-vertex-qualification-operator-once-v1'

fail() {
  printf 'ERROR: %s.\n' "$1" >&2
  exit 1
}

safe_id() {
  [[ "$1" =~ ^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$ \
    && "$1" != *'..'* ]]
}

[[ "${WEEDITPRO_CONFIRM_SAM31_VERTEX_QUALIFICATION_OPERATOR_RUN:-}" \
  == "${CONFIRMATION}" ]] || fail 'exact operator execution confirmation is missing'
[[ "$(gcloud config get-value project 2>/dev/null)" == "${PROJECT_ID}" ]] \
  || fail 'active Google Cloud project is not the fixed project'
action="${WEEDITPRO_SAM31_VERTEX_OPERATOR_RUN_ACTION:-}"
[[ "${action}" == 'start_one' || "${action}" == 'reconcile_one' ]] \
  || fail 'operator action must be start_one or reconcile_one'

job_before="$(gcloud run jobs describe "${JOB}" --project="${PROJECT_ID}" \
  --region="${REGION}" --format=json)"
jq -e '
  (.spec.template.spec.template.spec.containers[0].env | length) == 1
  and .spec.template.spec.template.spec.containers[0].env[0]
    == {name:"WEEDITPRO_SAM31_VERTEX_OPERATOR_ACTION",value:"disabled"}
  and .spec.template.spec.template.spec.maxRetries == 0
' <<<"${job_before}" >/dev/null || fail 'deployed operator is not unarmed'
active_before="$(gcloud run jobs executions list --job="${JOB}" \
  --project="${PROJECT_ID}" --region="${REGION}" --format=json \
  | jq '[.[] | select((.status.runningCount // 0) > 0)] | length')"
[[ "${active_before}" == '0' ]] || fail 'a prior operator execution is active'

overrides="WEEDITPRO_SAM31_VERTEX_OPERATOR_ACTION=${action}"
if [[ "${action}" == 'start_one' ]]; then
  attempt_id="${WEEDITPRO_SAM31_VERTEX_QUALIFICATION_ATTEMPT_ID:-}"
  issued_at="${WEEDITPRO_SAM31_VERTEX_QUALIFICATION_ISSUED_AT:-}"
  package_id="${WEEDITPRO_SAM31_VERTEX_HISTORICAL_PACKAGE_REQUEST_ID:-}"
  package_hash="${WEEDITPRO_SAM31_VERTEX_HISTORICAL_PACKAGE_REQUEST_SHA256:-}"
  release_id="${WEEDITPRO_SAM31_VERTEX_IMAGE_SUPPLY_CHAIN_RELEASE_ID:-}"
  release_hash="${WEEDITPRO_SAM31_VERTEX_IMAGE_SUPPLY_CHAIN_RELEASE_SHA256:-}"
  rate_id="${WEEDITPRO_SAM31_VERTEX_CURRENT_RATE_AUTHORITY_ID:-}"
  rate_version="${WEEDITPRO_SAM31_VERTEX_CURRENT_RATE_AUTHORITY_VERSION:-}"
  rate_hash="${WEEDITPRO_SAM31_VERTEX_CURRENT_RATE_AUTHORITY_SHA256:-}"
  safe_id "${attempt_id}" || fail 'attempt ID is invalid'
  safe_id "${package_id}" || fail 'package request ID is invalid'
  safe_id "${release_id}" || fail 'image release ID is invalid'
  safe_id "${rate_id}" || fail 'rate authority ID is invalid'
  [[ "${issued_at}" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{3})?Z$ ]] \
    || fail 'issue timestamp is invalid'
  [[ "${rate_version}" =~ ^[1-9][0-9]{0,15}$ ]] \
    || fail 'rate authority version is invalid'
  for value in "${package_hash}" "${release_hash}" "${rate_hash}"; do
    [[ "${value}" =~ ^[a-f0-9]{64}$ ]] || fail 'canonical hash is invalid'
  done
  overrides+=",WEEDITPRO_SAM31_VERTEX_QUALIFICATION_CONFIRMATION=start-one-sam31-vertex-source-checkpoint-qualification-v1"
  overrides+=",WEEDITPRO_SAM31_VERTEX_QUALIFICATION_ATTEMPT_ID=${attempt_id}"
  overrides+=",WEEDITPRO_SAM31_VERTEX_QUALIFICATION_ISSUED_AT=${issued_at}"
  overrides+=",WEEDITPRO_SAM31_VERTEX_HISTORICAL_PACKAGE_REQUEST_ID=${package_id}"
  overrides+=",WEEDITPRO_SAM31_VERTEX_HISTORICAL_PACKAGE_REQUEST_SHA256=${package_hash}"
  overrides+=",WEEDITPRO_SAM31_VERTEX_IMAGE_SUPPLY_CHAIN_RELEASE_ID=${release_id}"
  overrides+=",WEEDITPRO_SAM31_VERTEX_IMAGE_SUPPLY_CHAIN_RELEASE_SHA256=${release_hash}"
  overrides+=",WEEDITPRO_SAM31_VERTEX_CURRENT_RATE_AUTHORITY_ID=${rate_id}"
  overrides+=",WEEDITPRO_SAM31_VERTEX_CURRENT_RATE_AUTHORITY_VERSION=${rate_version}"
  overrides+=",WEEDITPRO_SAM31_VERTEX_CURRENT_RATE_AUTHORITY_SHA256=${rate_hash}"
else
  execution_id="${WEEDITPRO_SAM31_VERTEX_EXECUTION_ID:-}"
  execution_version="${WEEDITPRO_SAM31_VERTEX_EXECUTION_VERSION:-}"
  execution_hash="${WEEDITPRO_SAM31_VERTEX_EXECUTION_SHA256:-}"
  safe_id "${execution_id}" || fail 'execution ID is invalid'
  [[ "${execution_version}" =~ ^[1-9][0-9]{0,15}$ ]] \
    || fail 'execution version is invalid'
  [[ "${execution_hash}" =~ ^[a-f0-9]{64}$ ]] \
    || fail 'execution hash is invalid'
  overrides+=",WEEDITPRO_SAM31_VERTEX_QUALIFICATION_RECONCILE_CONFIRMATION=reconcile-one-sam31-vertex-source-checkpoint-qualification-v1"
  overrides+=",WEEDITPRO_SAM31_VERTEX_EXECUTION_ID=${execution_id}"
  overrides+=",WEEDITPRO_SAM31_VERTEX_EXECUTION_VERSION=${execution_version}"
  overrides+=",WEEDITPRO_SAM31_VERTEX_EXECUTION_SHA256=${execution_hash}"
fi

execution="$(gcloud run jobs execute "${JOB}" --project="${PROJECT_ID}" \
  --region="${REGION}" --tasks=1 --update-env-vars="${overrides}" \
  --wait --format=json --quiet)"
execution_name="$(jq -r '.metadata.name // empty' <<<"${execution}")"
[[ "${execution_name}" == projects/${PROJECT_ID}/locations/${REGION}/jobs/${JOB}/executions/* \
  || "${execution_name}" == "${JOB}-"* ]] || fail 'execution identity is invalid'
jq -e '
  (.status.failedCount // 0) == 0
  and (.status.cancelledCount // 0) == 0
  and (.status.runningCount // 0) == 0
  and (.status.succeededCount // 0) == 1
' <<<"${execution}" >/dev/null || fail 'operator execution did not succeed'
short_execution="${execution_name##*/}"

receipt=''
for _attempt in {1..12}; do
  logs="$(gcloud logging read \
    "resource.type=\"cloud_run_job\" AND resource.labels.job_name=\"${JOB}\" AND labels.\"run.googleapis.com/execution_name\"=\"${short_execution}\"" \
    --project="${PROJECT_ID}" --limit=100 --order=asc --format=json)"
  receipt="$(jq -c --arg action "${action}" '[.[]?.jsonPayload
    | select(.schemaVersion == "canonical-sam3_1-vertex-source-checkpoint-qualification-operator-v1"
      and .action == $action)][0] // empty' <<<"${logs}")"
  [[ -n "${receipt}" ]] && break
  sleep 5
done
[[ -n "${receipt}" ]] || fail 'canonical operator receipt is absent'
jq -e '
  .automaticRetryAllowed == false
  and .customerCreditsMutated == false
  and .sourceCheckpointQualificationGranted == false
  and .runtimeReleaseGranted == false
  and .productionReady == false
' <<<"${receipt}" >/dev/null || fail 'canonical operator authority changed'
if [[ "${action}" == 'start_one' ]]; then
  jq -e '
    .launch.disposition == "accepted"
    and .launch.providerCallStarted == true
    and .launch.executionRef != null
    and .prepared.status == "staged_not_dispatched"
  ' <<<"${receipt}" >/dev/null || fail 'Vertex start was not accepted exactly once'
fi

job_after="$(gcloud run jobs describe "${JOB}" --project="${PROJECT_ID}" \
  --region="${REGION}" --format=json)"
jq -e '
  (.spec.template.spec.template.spec.containers[0].env | length) == 1
  and .spec.template.spec.template.spec.containers[0].env[0]
    == {name:"WEEDITPRO_SAM31_VERTEX_OPERATOR_ACTION",value:"disabled"}
' <<<"${job_after}" >/dev/null || fail 'execution overrides persisted on the job'
active_after="$(gcloud run jobs executions list --job="${JOB}" \
  --project="${PROJECT_ID}" --region="${REGION}" --format=json \
  | jq '[.[] | select((.status.runningCount // 0) > 0)] | length')"
[[ "${active_after}" == '0' ]] || fail 'operator did not scale back to zero'

printf '{"operation":"weeditpro_sam31_vertex_qualification_operator_run_v1",'
printf '"action":"%s","execution":"%s",' "${action}" "${short_execution}"
printf '"canonicalReceipt":%s,"operatorRemainsUnarmed":true,' "${receipt}"
printf '"runningOperatorTaskCount":0,"customerCreditsMutated":false,'
printf '"publicDeliveryAuthorized":false,"productionAuthorityGranted":false}\n'
