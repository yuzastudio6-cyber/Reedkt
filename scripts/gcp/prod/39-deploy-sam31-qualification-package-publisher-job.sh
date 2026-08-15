#!/usr/bin/env bash
set -euo pipefail

# Deploys but never executes the private metadata-only package publisher.

readonly PROJECT_ID='reeditpro'
readonly REGION='us-central1'
readonly JOB='weeditpro-sam31-package-publisher'
readonly SERVICE_ACCOUNT_ID='weeditpro-sam31-package-sa'
readonly SERVICE_ACCOUNT="${SERVICE_ACCOUNT_ID}@${PROJECT_ID}.iam.gserviceaccount.com"
readonly IMAGE_NAME='weeditpro-sam31-qualification-package-publisher'
readonly REPOSITORY='reeditpro-workers'
readonly CONTROL_BUCKET='reeditpro-production-reeditpro-control-plane-state'
readonly FIXTURE_BUCKET='reeditpro-production-sam31-qualification-private'
readonly KMS_KEY_RING='weeditpro-private-artifacts'
readonly KMS_KEY='sam31-qualification'
readonly CONFIRMATION='deploy-weeditpro-sam31-qualification-package-publisher-v1'
readonly PACKAGE_CONFIRMATION='publish-one-sam31-source-checkpoint-qualification-package-v1'
readonly COMMAND_LINE_TOOLS='/Library/Developer/CommandLineTools'

fail() {
  printf 'ERROR: %s.\n' "$1" >&2
  exit 1
}

safe_id() {
  [[ "$1" =~ ^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$ \
    && "$1" != *'..'* ]]
}

add_project_log_writer_binding_with_propagation_retry() {
  local attempt diagnostic_file
  diagnostic_file="$(mktemp \
    "${TMPDIR:-/tmp}/weeditpro-sam31-package-publisher-iam.XXXXXX")"
  for attempt in {1..12}; do
    if gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
      --member="serviceAccount:${SERVICE_ACCOUNT}" \
      --role=roles/logging.logWriter --condition=None --quiet \
      >/dev/null 2>"${diagnostic_file}"; then
      rm -f "${diagnostic_file}"
      return 0
    fi
    if ! grep -Fq 'does not exist' "${diagnostic_file}"; then
      cat "${diagnostic_file}" >&2
      rm -f "${diagnostic_file}"
      fail 'project log-writer binding failed'
    fi
    if [[ "${attempt}" -eq 12 ]]; then
      cat "${diagnostic_file}" >&2
      rm -f "${diagnostic_file}"
      fail 'new package publisher service account did not propagate'
    fi
    sleep 5
  done
}

add_bucket_binding_with_propagation_retry() {
  local bucket="$1" role="$2" attempt diagnostic_file
  diagnostic_file="$(mktemp \
    "${TMPDIR:-/tmp}/weeditpro-sam31-package-bucket-iam.XXXXXX")"
  for attempt in {1..12}; do
    if gcloud storage buckets add-iam-policy-binding "gs://${bucket}" \
      --project="${PROJECT_ID}" --member="serviceAccount:${SERVICE_ACCOUNT}" \
      --role="${role}" --condition=None --quiet \
      >/dev/null 2>"${diagnostic_file}"; then
      rm -f "${diagnostic_file}"
      return 0
    fi
    if ! grep -Fq 'does not exist' "${diagnostic_file}"; then
      cat "${diagnostic_file}" >&2
      rm -f "${diagnostic_file}"
      fail 'bucket IAM binding failed'
    fi
    if [[ "${attempt}" -eq 12 ]]; then
      cat "${diagnostic_file}" >&2
      rm -f "${diagnostic_file}"
      fail 'new package publisher account did not propagate to storage'
    fi
    sleep 5
  done
}

[[ "${WEEDITPRO_CONFIRM_SAM31_QUALIFICATION_PACKAGE_PUBLISHER_JOB_DEPLOY:-}" \
  == "${CONFIRMATION}" ]] || fail 'exact job-deployment confirmation is missing'
[[ "$(gcloud config get-value project 2>/dev/null)" == "${PROJECT_ID}" ]] \
  || fail 'active Google Cloud project is not the fixed project'
[[ -x "${COMMAND_LINE_TOOLS}/usr/bin/git" ]] \
  || fail 'pinned Apple Command Line Tools Git is unavailable'

qualification_id="${WEEDITPRO_SAM31_QUALIFICATION_ID:-}"
ingest_id="${WEEDITPRO_SAM31_QUALIFICATION_INGEST_ID:-}"
ingest_sha="${WEEDITPRO_SAM31_QUALIFICATION_INGEST_SHA256:-}"
review_id="${WEEDITPRO_SAM31_QUALIFICATION_ARTIFACT_REVIEW_ID:-}"
review_sha="${WEEDITPRO_SAM31_QUALIFICATION_ARTIFACT_REVIEW_SHA256:-}"
release_id="${WEEDITPRO_SAM31_QUALIFICATION_IMAGE_RELEASE_ID:-}"
release_sha="${WEEDITPRO_SAM31_QUALIFICATION_IMAGE_RELEASE_SHA256:-}"
issued_at="${WEEDITPRO_SAM31_QUALIFICATION_PACKAGE_ISSUED_AT:-}"
safe_id "${qualification_id}" || fail 'qualification ID is invalid'
safe_id "${ingest_id}" || fail 'ingest ID is invalid'
safe_id "${review_id}" || fail 'review ID is invalid'
safe_id "${release_id}" || fail 'image release ID is invalid'
for value in "${ingest_sha}" "${review_sha}" "${release_sha}"; do
  [[ "${value}" =~ ^[a-f0-9]{64}$ ]] || fail 'canonical reference hash is invalid'
done
[[ "${issued_at}" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]] \
  || fail 'package issue timestamp is invalid'

source_commit="$(DEVELOPER_DIR="${COMMAND_LINE_TOOLS}" git rev-parse HEAD)"
source_tree="$(DEVELOPER_DIR="${COMMAND_LINE_TOOLS}" \
  git rev-parse 'HEAD^{tree}')"
[[ -z "$(DEVELOPER_DIR="${COMMAND_LINE_TOOLS}" \
  git status --porcelain=v1)" ]] || fail 'source worktree must be clean'
build_id="${WEEDITPRO_SAM31_QUALIFICATION_PACKAGE_PUBLISHER_BUILD_ID:-}"
[[ "${build_id}" =~ ^[a-f0-9-]{36}$ ]] || fail 'exact Cloud Build ID is missing'
image_tag="sam31-package-publisher-${source_commit:0:16}"
tagged_image="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:${image_tag}"
build="$(gcloud builds describe "${build_id}" --project="${PROJECT_ID}" \
  --region="${REGION}" --format=json)"
digest="$(jq -r '.results.images[0].digest // empty' <<<"${build}")"
[[ "${digest}" =~ ^sha256:[a-f0-9]{64}$ ]] || fail 'build digest is invalid'
image="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}@${digest}"
jq -e --arg image "${tagged_image}" --arg commit "${source_commit}" \
  --arg tree "${source_tree}" '
    .status == "SUCCESS"
    and .substitutions._IMAGE == $image
    and .substitutions._SOURCE_COMMIT_SHA == $commit
    and .substitutions._SOURCE_TREE_HASH == $tree
    and .options.requestedVerifyOption == "VERIFIED"
    and .options.sourceProvenanceHash == ["SHA256"]
    and (.results.images | length) == 1
  ' <<<"${build}" >/dev/null || fail 'source-bound build provenance changed'
image_observation="$(gcloud artifacts docker images describe "${image}" \
  --project="${PROJECT_ID}" --show-package-vulnerability --format=json)"
jq -e --arg digest "${digest}" '
    .image_summary.digest == $digest
    and .image_summary.slsa_build_level == 3
    and .discovery_summary.discovery[0].discovery.analysisStatus
      == "FINISHED_SUCCESS"
    and (.discovery_summary.discovery[0].discovery.analysisCompleted.analysisType
      | contains(["NPM", "OS", "SECRET"]))
    and ([
      (.package_vulnerability_summary.vulnerabilities // {})
      | to_entries[]?.value[]?
    ] | length) == 0
  ' <<<"${image_observation}" >/dev/null \
  || fail 'immutable image supply-chain evidence is not release-clean'

if ! gcloud iam service-accounts describe "${SERVICE_ACCOUNT}" \
  --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud iam service-accounts create "${SERVICE_ACCOUNT_ID}" \
    --project="${PROJECT_ID}" \
    --display-name='WeEditPro SAM 3.1 qualification package publisher' \
    --description='Metadata-only canonical qualification package publication'
fi
add_project_log_writer_binding_with_propagation_retry
for role in roles/storage.objectCreator roles/storage.objectViewer; do
  add_bucket_binding_with_propagation_retry "${CONTROL_BUCKET}" "${role}"
done
add_bucket_binding_with_propagation_retry \
  "${FIXTURE_BUCKET}" roles/storage.objectViewer
gcloud kms keys add-iam-policy-binding "${KMS_KEY}" \
  --project="${PROJECT_ID}" --location="${REGION}" \
  --keyring="${KMS_KEY_RING}" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role=roles/cloudkms.cryptoKeyDecrypter --condition=None --quiet >/dev/null

gcloud run jobs deploy "${JOB}" \
  --project="${PROJECT_ID}" --region="${REGION}" \
  --image="${image}" --service-account="${SERVICE_ACCOUNT}" \
  --cpu=1 --memory=2Gi --tasks=1 --parallelism=1 \
  --max-retries=0 --task-timeout=15m --execution-environment=gen2 \
  --set-env-vars="WEEDITPRO_SAM31_QUALIFICATION_PACKAGE_CONFIRMATION=${PACKAGE_CONFIRMATION},WEEDITPRO_SAM31_QUALIFICATION_ID=${qualification_id},WEEDITPRO_SAM31_QUALIFICATION_INGEST_ID=${ingest_id},WEEDITPRO_SAM31_QUALIFICATION_INGEST_SHA256=${ingest_sha},WEEDITPRO_SAM31_QUALIFICATION_ARTIFACT_REVIEW_ID=${review_id},WEEDITPRO_SAM31_QUALIFICATION_ARTIFACT_REVIEW_SHA256=${review_sha},WEEDITPRO_SAM31_QUALIFICATION_IMAGE_RELEASE_ID=${release_id},WEEDITPRO_SAM31_QUALIFICATION_IMAGE_RELEASE_SHA256=${release_sha},WEEDITPRO_SAM31_QUALIFICATION_PACKAGE_ISSUED_AT=${issued_at}" \
  --labels='app=weeditpro,operation=sam31-package-publisher,scale=zero' \
  --quiet
policy="$(gcloud run jobs get-iam-policy "${JOB}" \
  --project="${PROJECT_ID}" --region="${REGION}" --format=json)"
if jq -e 'any(.bindings[]?.members[]?;
  . == "allUsers" or . == "allAuthenticatedUsers")' \
  <<<"${policy}" >/dev/null; then
  fail 'qualification package publisher has a public IAM principal'
fi

printf '{"operation":"weeditpro_sam31_qualification_package_publisher_job_deploy_v1",'
printf '"job":"projects/%s/locations/%s/jobs/%s",' \
  "${PROJECT_ID}" "${REGION}" "${JOB}"
printf '"immutableImage":"%s","qualificationId":"%s",' \
  "${image}" "${qualification_id}"
printf '"minimumIdleInstances":0,"jobExecuted":false,'
printf '"gpuOrModelRuntimeStarted":false,"customerCreditsMutated":false,'
printf '"productionAuthorityGranted":false}\n'
