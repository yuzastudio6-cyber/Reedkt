#!/usr/bin/env bash
set -euo pipefail

# Executes one bounded metadata-only package publication and verifies its
# canonical publication record from Cloud Logging plus the durable package.

readonly PROJECT_ID='reeditpro'
readonly REGION='us-central1'
readonly JOB='weeditpro-sam31-package-publisher'
readonly CONTROL_BUCKET='reeditpro-production-reeditpro-control-plane-state'
readonly PACKAGE_PREFIX='private/sam3_1/source-checkpoint-qualification/v1/packages'
readonly CONFIRMATION='run-weeditpro-sam31-qualification-package-publisher-once-v1'

fail() {
  printf 'ERROR: %s.\n' "$1" >&2
  exit 1
}

[[ "${WEEDITPRO_CONFIRM_SAM31_QUALIFICATION_PACKAGE_PUBLISHER_RUN:-}" \
  == "${CONFIRMATION}" ]] || fail 'exact execution confirmation is missing'
[[ "$(gcloud config get-value project 2>/dev/null)" == "${PROJECT_ID}" ]] \
  || fail 'active Google Cloud project is not the fixed project'
active_before="$(gcloud run jobs executions list --job="${JOB}" \
  --project="${PROJECT_ID}" --region="${REGION}" --format=json \
  | jq '[.[] | select((.status.runningCount // 0) > 0)] | length')"
[[ "${active_before}" == '0' ]] || fail 'a prior package publication is active'

execution="$(gcloud run jobs execute "${JOB}" --project="${PROJECT_ID}" \
  --region="${REGION}" --wait --format=json --quiet)"
execution_name="$(jq -r '.metadata.name // empty' <<<"${execution}")"
[[ "${execution_name}" == projects/${PROJECT_ID}/locations/${REGION}/jobs/${JOB}/executions/* \
  || "${execution_name}" == "${JOB}-"* ]] \
  || fail 'execution identity is invalid'
jq -e '
  (.status.failedCount // 0) == 0
  and (.status.cancelledCount // 0) == 0
  and (.status.runningCount // 0) == 0
  and (.status.succeededCount // 0) == 1
' <<<"${execution}" >/dev/null || fail 'package publication did not succeed'
short_execution="${execution_name##*/}"

publication=''
for _attempt in {1..12}; do
  logs="$(gcloud logging read \
    "resource.type=\"cloud_run_job\" AND resource.labels.job_name=\"${JOB}\" AND labels.\"run.googleapis.com/execution_name\"=\"${short_execution}\"" \
    --project="${PROJECT_ID}" --limit=100 --order=asc --format=json)"
  publication="$(jq -c '[.[]?.jsonPayload
    | select(.schemaVersion == "canonical-sam3_1-source-checkpoint-qualification-package-publication-v1")][0] // empty' \
    <<<"${logs}")"
  [[ -n "${publication}" ]] && break
  sleep 5
done
[[ -n "${publication}" ]] || fail 'canonical package publication log is absent'
jq -e '
  .source == "canonical_sam3_1_source_checkpoint_qualification_package_publisher"
  and .evidenceClass == "gcs_create_only_exact_reread"
  and (.disposition == "created" or .disposition == "identical_replay")
  and .exactCanonicalInputsRereadBeforePublication == true
  and .checkpointWeightsOnlyExecutionStillRequiredInWorker == true
  and .gpuOrModelRuntimeStarted == false
  and .customerCreditsMutated == false
  and .publicDeliveryAuthorized == false
  and .productionAuthorityGranted == false
  and (.publicationHash | test("^[a-f0-9]{64}$"))
  and (.workerRequestRef.contentHash | test("^sha256:[a-f0-9]{64}$"))
  and (.packageRef.contentHash | test("^sha256:[a-f0-9]{64}$"))
' <<<"${publication}" >/dev/null || fail 'canonical publication changed'
request_hash="$(jq -r '.workerRequestRef.contentHash' <<<"${publication}")"
request_hash="${request_hash#sha256:}"
record="$(gcloud storage cat \
  "gs://${CONTROL_BUCKET}/${PACKAGE_PREFIX}/${request_hash}.json" \
  --project="${PROJECT_ID}")"
jq -e --arg request_hash "${request_hash}" \
  --arg package_hash "$(jq -r '.packageRef.contentHash' <<<"${publication}")" '
    .workerRequest.requestHash == $request_hash
    and .workerRequestRef.contentHash == ("sha256:" + $request_hash)
    and ("sha256:" + .packageHash) == $package_hash
    and .exactWorkerRequestIngestCheckpointAndFixtureLineageReread == true
    and .checkpointAndFixtureCoordinatesServerOwned == true
    and .modelOrGpuRuntimeStarted == false
    and .customerCreditsMutated == false
    and .productionAuthorityGranted == false
  ' <<<"${record}" >/dev/null || fail 'durable qualification package changed'
active_after="$(gcloud run jobs executions list --job="${JOB}" \
  --project="${PROJECT_ID}" --region="${REGION}" --format=json \
  | jq '[.[] | select((.status.runningCount // 0) > 0)] | length')"
[[ "${active_after}" == '0' ]] || fail 'package publisher did not stop'

printf '{"operation":"weeditpro_sam31_qualification_package_publisher_run_v1",'
printf '"qualificationId":"%s","publicationHash":"%s",' \
  "$(jq -r '.qualificationId' <<<"${publication}")" \
  "$(jq -r '.publicationHash' <<<"${publication}")"
printf '"durablePackageExactReread":true,"runningTaskCount":0,'
printf '"gpuOrModelRuntimeStarted":false,"customerCreditsMutated":false,'
printf '"productionAuthorityGranted":false}\n'
