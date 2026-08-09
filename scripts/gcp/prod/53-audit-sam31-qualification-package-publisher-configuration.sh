#!/usr/bin/env bash
set -euo pipefail

# Read-only audit of the canonical metadata-only SAM 3.1 package publisher.
# It never deploys, updates, executes, or deletes a Cloud Run job.

readonly PROJECT_ID='reeditpro'
readonly REGION='us-central1'
readonly JOB='weeditpro-sam31-package-publisher'
readonly SERVICE_ACCOUNT='weeditpro-sam31-package-sa@reeditpro.iam.gserviceaccount.com'
readonly PACKAGE_CONFIRMATION='publish-one-sam31-source-checkpoint-qualification-package-v1'

fail() {
  printf 'ERROR: %s.\n' "$1" >&2
  exit 1
}

safe_id() {
  [[ "$1" =~ ^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$ \
    && "$1" != *'..'* ]]
}

add_blocker() {
  blocker_codes="$(jq -c --arg code "$1" '. + [$code]' \
    <<<"${blocker_codes}")"
}

qualification_id="${WEEDITPRO_SAM31_QUALIFICATION_ID:-}"
ingest_id="${WEEDITPRO_SAM31_QUALIFICATION_INGEST_ID:-}"
ingest_sha="${WEEDITPRO_SAM31_QUALIFICATION_INGEST_SHA256:-}"
review_id="${WEEDITPRO_SAM31_QUALIFICATION_ARTIFACT_REVIEW_ID:-}"
review_sha="${WEEDITPRO_SAM31_QUALIFICATION_ARTIFACT_REVIEW_SHA256:-}"
release_id="${WEEDITPRO_SAM31_QUALIFICATION_IMAGE_RELEASE_ID:-}"
release_sha="${WEEDITPRO_SAM31_QUALIFICATION_IMAGE_RELEASE_SHA256:-}"
issued_at="${WEEDITPRO_SAM31_QUALIFICATION_PACKAGE_ISSUED_AT:-}"

for value in "${qualification_id}" "${ingest_id}" "${review_id}" \
  "${release_id}"; do
  safe_id "${value}" || fail 'desired package ID is invalid'
done
for value in "${ingest_sha}" "${review_sha}" "${release_sha}"; do
  [[ "${value}" =~ ^[a-f0-9]{64}$ ]] \
    || fail 'desired package reference hash is invalid'
done
[[ "${issued_at}" \
  =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]] \
  || fail 'desired package issue timestamp is invalid'
[[ "$(gcloud config get-value project 2>/dev/null)" == "${PROJECT_ID}" ]] \
  || fail 'active Google Cloud project is not the fixed project'

job="$(gcloud run jobs describe "${JOB}" --project="${PROJECT_ID}" \
  --region="${REGION}" --format=json)"
executions="$(gcloud run jobs executions list --job="${JOB}" \
  --project="${PROJECT_ID}" --region="${REGION}" --format=json)"
policy="$(gcloud run jobs get-iam-policy "${JOB}" \
  --project="${PROJECT_ID}" --region="${REGION}" --format=json)"

blocker_codes='[]'
if ! jq -e --arg service_account "${SERVICE_ACCOUNT}" '
  .metadata.name == "weeditpro-sam31-package-publisher"
  and .metadata.labels.app == "weeditpro"
  and .metadata.labels.operation == "sam31-package-publisher"
  and .metadata.labels.scale == "zero"
  and .spec.template.metadata.labels.app == "weeditpro"
  and .spec.template.metadata.labels.operation == "sam31-package-publisher"
  and .spec.template.metadata.labels.scale == "zero"
  and (.status.conditions | any(.type == "Ready" and .status == "True"))
  and (.status.observedGeneration | tostring)
    == (.metadata.generation | tostring)
  and (.spec.template.spec.taskCount // 1) == 1
  and .spec.template.spec.parallelism == 1
  and (.spec.template.spec.template.spec.containers | length) == 1
  and .spec.template.spec.template.spec.maxRetries == 0
  and .spec.template.spec.template.spec.timeoutSeconds == "900"
  and .spec.template.spec.template.spec.serviceAccountName == $service_account
  and .spec.template.spec.template.spec.containers[0].resources.limits.cpu
    == "1"
  and .spec.template.spec.template.spec.containers[0].resources.limits.memory
    == "2Gi"
  and (.spec.template.spec.template.spec.containers[0].image
    | test("@sha256:[a-f0-9]{64}$"))
  and ((.spec.template.spec.template.spec.containers[0].command // [])
    | length) == 0
  and ((.spec.template.spec.template.spec.containers[0].args // [])
    | length) == 0
' <<<"${job}" >/dev/null; then
  add_blocker 'canonical_job_definition_mismatch'
fi

if jq -e 'any(.bindings[]?.members[]?;
  . == "allUsers" or . == "allAuthenticatedUsers")' \
  <<<"${policy}" >/dev/null; then
  add_blocker 'public_iam_principal_present'
fi

active_execution_count="$(jq '[.[]
  | select((.status.runningCount // 0) > 0)] | length' \
  <<<"${executions}")"
if [[ "${active_execution_count}" != '0' ]]; then
  add_blocker 'active_package_publication_present'
fi

current_env="$(jq -c '
  .spec.template.spec.template.spec.containers[0].env as $env
  | if (($env | length) != ([$env[]?.name] | unique | length))
      or any($env[]?; (.value == null))
    then null
    else [$env[] | {key: .name, value: .value}] | from_entries
    end
' <<<"${job}")"
desired_env="$(jq -cn \
  --arg confirmation "${PACKAGE_CONFIRMATION}" \
  --arg qualification_id "${qualification_id}" \
  --arg ingest_id "${ingest_id}" --arg ingest_sha "${ingest_sha}" \
  --arg review_id "${review_id}" --arg review_sha "${review_sha}" \
  --arg release_id "${release_id}" --arg release_sha "${release_sha}" \
  --arg issued_at "${issued_at}" '{
    WEEDITPRO_SAM31_QUALIFICATION_PACKAGE_CONFIRMATION: $confirmation,
    WEEDITPRO_SAM31_QUALIFICATION_ID: $qualification_id,
    WEEDITPRO_SAM31_QUALIFICATION_INGEST_ID: $ingest_id,
    WEEDITPRO_SAM31_QUALIFICATION_INGEST_SHA256: $ingest_sha,
    WEEDITPRO_SAM31_QUALIFICATION_ARTIFACT_REVIEW_ID: $review_id,
    WEEDITPRO_SAM31_QUALIFICATION_ARTIFACT_REVIEW_SHA256: $review_sha,
    WEEDITPRO_SAM31_QUALIFICATION_IMAGE_RELEASE_ID: $release_id,
    WEEDITPRO_SAM31_QUALIFICATION_IMAGE_RELEASE_SHA256: $release_sha,
    WEEDITPRO_SAM31_QUALIFICATION_PACKAGE_ISSUED_AT: $issued_at
  }')"
if ! jq -en --argjson current "${current_env}" \
  --argjson desired "${desired_env}" '$current == $desired' >/dev/null; then
  add_blocker 'desired_package_inputs_not_deployed'
fi

if [[ "$(jq 'length' <<<"${blocker_codes}")" == '0' ]]; then
  disposition='configuration_matches_pending_source_build_provenance'
else
  disposition='requires_reviewed_source_bound_redeploy'
fi

payload="$(jq -cn \
  --arg disposition "${disposition}" \
  --argjson blocker_codes "${blocker_codes}" \
  --arg desired_qualification_id "${qualification_id}" \
  --arg desired_release_id "${release_id}" \
  --arg current_qualification_id \
    "$(jq -r '.WEEDITPRO_SAM31_QUALIFICATION_ID // ""' \
      <<<"${current_env}")" \
  --arg current_release_id \
    "$(jq -r '.WEEDITPRO_SAM31_QUALIFICATION_IMAGE_RELEASE_ID // ""' \
      <<<"${current_env}")" \
  --arg immutable_image \
    "$(jq -r '.spec.template.spec.template.spec.containers[0].image' \
      <<<"${job}")" \
  --arg generation "$(jq -r '.metadata.generation | tostring' \
    <<<"${job}")" \
  --argjson active_execution_count "${active_execution_count}" '{
    schemaVersion:
      "canonical-sam3_1-qualification-package-publisher-configuration-audit-v1",
    source: "canonical_read_only_cloud_run_job_configuration_audit",
    evidenceClass: "google_cloud_read_only_configuration_observation",
    disposition: $disposition,
    blockerCodes: $blocker_codes,
    desiredQualificationId: $desired_qualification_id,
    desiredImageReleaseId: $desired_release_id,
    currentQualificationId: $current_qualification_id,
    currentImageReleaseId: $current_release_id,
    immutablePublisherImage: $immutable_image,
    cloudRunJobGeneration: $generation,
    activeExecutionCount: $active_execution_count,
    exactDesiredEnvironmentDeployed: ($blocker_codes
      | index("desired_package_inputs_not_deployed") | not),
    sourceBoundBuildProvenanceClaimed: false,
    cloudRunJobExecuted: false,
    gpuOrModelRuntimeStarted: false,
    customerCreditsMutated: false,
    billingSettlementPerformed: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false
  }')"
observation_sha256="$(printf '%s' "${payload}" | shasum -a 256 \
  | awk '{print $1}')"
jq -c --arg observation_sha256 "${observation_sha256}" \
  '. + {observationSha256: $observation_sha256}' <<<"${payload}"
