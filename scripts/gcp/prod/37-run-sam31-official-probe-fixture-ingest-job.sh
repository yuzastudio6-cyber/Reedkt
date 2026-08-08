#!/usr/bin/env bash
set -euo pipefail

# Executes one bounded control-plane byte-ingest attempt. It performs no media
# decode/transcode and starts no GPU or model runtime.

readonly PROJECT_ID='reeditpro'
readonly REGION='us-central1'
readonly JOB='weeditpro-sam31-official-probe-fixture-ingest'
readonly BUCKET='reeditpro-production-sam31-qualification-private'
readonly OBJECT='private/fixtures/sam31/probe-person-v1.mp4'
readonly EXPECTED_LENGTH='2380401'
readonly EXPECTED_SHA256='1be76d5d19b066e8ad7c565d88a98e11a8f8d456a707508a7aa35390def70e30'
readonly EXPECTED_KMS='projects/reeditpro/locations/us-central1/keyRings/weeditpro-private-artifacts/cryptoKeys/sam31-qualification'
readonly CONFIRMATION='run-weeditpro-sam31-official-probe-fixture-ingest-once-v1'

fail() {
  printf 'ERROR: %s.\n' "$1" >&2
  exit 1
}

[[ "${WEEDITPRO_CONFIRM_SAM31_PROBE_FIXTURE_INGEST_RUN:-}" \
  == "${CONFIRMATION}" ]] || fail 'exact execution confirmation is missing'
[[ "$(gcloud config get-value project 2>/dev/null)" == "${PROJECT_ID}" ]] \
  || fail 'active Google Cloud project is not the fixed project'

active_before="$(gcloud run jobs executions list \
  --job="${JOB}" --project="${PROJECT_ID}" --region="${REGION}" \
  --format=json | jq '[.[] | select((.status.runningCount // 0) > 0)] | length')"
[[ "${active_before}" == '0' ]] || fail 'a prior probe ingest execution is active'

execution="$(gcloud run jobs execute "${JOB}" \
  --project="${PROJECT_ID}" --region="${REGION}" \
  --wait --format=json --quiet)"
execution_name="$(jq -r '.metadata.name // empty' <<<"${execution}")"
[[ "${execution_name}" == projects/${PROJECT_ID}/locations/${REGION}/jobs/${JOB}/executions/* \
  || "${execution_name}" == "${JOB}-"* ]] \
  || fail 'execution identity is invalid'
jq -e '
  (.status.failedCount // 0) == 0
  and (.status.cancelledCount // 0) == 0
  and (.status.runningCount // 0) == 0
  and (.status.succeededCount // 0) == 1
' <<<"${execution}" >/dev/null || fail 'probe ingest execution did not succeed'

metadata="$(gcloud storage objects describe \
  "gs://${BUCKET}/${OBJECT}" --project="${PROJECT_ID}" --format=json)"
generation="$(jq -r '.generation // empty' <<<"${metadata}")"
[[ "${generation}" =~ ^[1-9][0-9]{0,30}$ ]] \
  || fail 'probe fixture generation is invalid'
observed_kms="$(jq -r '.kms_key // empty' <<<"${metadata}")"
kms_version_prefix="${EXPECTED_KMS}/cryptoKeyVersions/"
kms_version="${observed_kms#"${kms_version_prefix}"}"
[[ "$(jq -r '.size // empty' <<<"${metadata}")" == "${EXPECTED_LENGTH}" \
  && "$(jq -r '.content_type // empty' <<<"${metadata}")" == 'video/mp4' \
  && "${observed_kms}" == "${kms_version_prefix}"* \
  && "${kms_version}" =~ ^[1-9][0-9]{0,30}$ ]] \
  || fail 'probe fixture metadata changed'
observed_sha256="$(gcloud storage cat \
  "gs://${BUCKET}/${OBJECT}#${generation}" --project="${PROJECT_ID}" \
  | shasum -a 256 | awk '{print $1}')"
[[ "${observed_sha256}" == "${EXPECTED_SHA256}" ]] \
  || fail 'probe fixture exact bytes changed'

active_after="$(gcloud run jobs executions list \
  --job="${JOB}" --project="${PROJECT_ID}" --region="${REGION}" \
  --format=json | jq '[.[] | select((.status.runningCount // 0) > 0)] | length')"
[[ "${active_after}" == '0' ]] || fail 'probe ingest execution did not stop'

printf '{"operation":"weeditpro_sam31_probe_fixture_ingest_run_v1",'
printf '"executionObserved":true,"exactPrivateFixtureReread":true,'
printf '"sourceMediaDecodedOrTranscodedDuringIngest":false,'
printf '"gpuOrModelRuntimeStarted":false,"runningTaskCount":0,'
printf '"customerMediaUsed":false,"customerCreditsMutated":false,'
printf '"productionAuthorityGranted":false}\n'
