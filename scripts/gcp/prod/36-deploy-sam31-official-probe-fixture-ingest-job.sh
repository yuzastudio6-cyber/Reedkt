#!/usr/bin/env bash
set -euo pipefail

# Deploys but never executes the private official probe ingest job.

readonly PROJECT_ID='reeditpro'
readonly REGION='us-central1'
readonly JOB='weeditpro-sam31-official-probe-fixture-ingest'
readonly SERVICE_ACCOUNT_ID='weeditpro-sam31-probe-ingest-sa'
readonly SERVICE_ACCOUNT="${SERVICE_ACCOUNT_ID}@${PROJECT_ID}.iam.gserviceaccount.com"
readonly IMAGE_NAME='weeditpro-sam31-official-probe-fixture-ingest'
readonly REPOSITORY='reeditpro-workers'
readonly PRIVATE_BUCKET='reeditpro-production-sam31-qualification-private'
readonly CONTROL_BUCKET='reeditpro-production-reeditpro-control-plane-state'
readonly KMS_KEY_RING='weeditpro-private-artifacts'
readonly KMS_KEY='sam31-qualification'
readonly KMS_KEY_RESOURCE="projects/${PROJECT_ID}/locations/${REGION}/keyRings/${KMS_KEY_RING}/cryptoKeys/${KMS_KEY}"
readonly CONFIRMATION='deploy-weeditpro-sam31-official-probe-fixture-ingest-v1'
readonly COMMAND_LINE_TOOLS='/Library/Developer/CommandLineTools'

fail() {
  printf 'ERROR: %s.\n' "$1" >&2
  exit 1
}

add_project_log_writer_binding_with_propagation_retry() {
  local attempt diagnostic_file
  diagnostic_file="$(mktemp \
    "${TMPDIR:-/tmp}/weeditpro-sam31-probe-ingest-iam.XXXXXX")"
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
      fail 'new probe ingest service account did not propagate'
    fi
    sleep 5
  done
}

[[ "${WEEDITPRO_CONFIRM_SAM31_PROBE_FIXTURE_INGEST_JOB_DEPLOY:-}" \
  == "${CONFIRMATION}" ]] || fail 'exact job-deployment confirmation is missing'
[[ "$(gcloud config get-value project 2>/dev/null)" == "${PROJECT_ID}" ]] \
  || fail 'active Google Cloud project is not the fixed project'
[[ -x "${COMMAND_LINE_TOOLS}/usr/bin/git" ]] \
  || fail 'pinned Apple Command Line Tools Git is unavailable'

source_commit="$(DEVELOPER_DIR="${COMMAND_LINE_TOOLS}" git rev-parse HEAD)"
source_tree="$(DEVELOPER_DIR="${COMMAND_LINE_TOOLS}" \
  git rev-parse 'HEAD^{tree}')"
[[ -z "$(DEVELOPER_DIR="${COMMAND_LINE_TOOLS}" \
  git status --porcelain=v1)" ]] || fail 'source worktree must be clean'
build_id="${WEEDITPRO_SAM31_PROBE_FIXTURE_INGEST_BUILD_ID:-}"
[[ "${build_id}" =~ ^[a-f0-9-]{36}$ ]] || fail 'exact Cloud Build ID is missing'

image_tag="sam31-probe-ingest-${source_commit:0:16}"
tagged_image="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:${image_tag}"
build="$(gcloud builds describe "${build_id}" --project="${PROJECT_ID}" \
  --region="${REGION}" --format=json)"
digest="$(jq -r '.results.images[0].digest // empty' <<<"${build}")"
[[ "${digest}" =~ ^sha256:[a-f0-9]{64}$ ]] || fail 'build digest is invalid'
image="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}@${digest}"
jq -e \
  --arg image "${tagged_image}" \
  --arg source_commit "${source_commit}" \
  --arg source_tree "${source_tree}" '
    .status == "SUCCESS"
    and .substitutions._IMAGE == $image
    and .substitutions._SOURCE_COMMIT_SHA == $source_commit
    and .substitutions._SOURCE_TREE_HASH == $source_tree
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
    and (
      .discovery_summary.discovery[0].discovery
        .analysisCompleted.analysisType
      | contains(["NPM", "OS", "SECRET"])
    )
    and (
      .discovery_summary.discovery[0].discovery.lastScanTime
      | type == "string" and length > 10
    )
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
    --display-name='WeEditPro SAM 3.1 official probe fixture ingest' \
    --description='Pinned official fixture byte ingest; no media processing or inference'
fi
add_project_log_writer_binding_with_propagation_retry
for bucket in "${PRIVATE_BUCKET}" "${CONTROL_BUCKET}"; do
  for role in roles/storage.objectCreator roles/storage.objectViewer; do
    gcloud storage buckets add-iam-policy-binding "gs://${bucket}" \
      --project="${PROJECT_ID}" \
      --member="serviceAccount:${SERVICE_ACCOUNT}" \
      --role="${role}" --condition=None --quiet >/dev/null
  done
done
gcloud kms keys add-iam-policy-binding "${KMS_KEY}" \
  --project="${PROJECT_ID}" --location="${REGION}" \
  --keyring="${KMS_KEY_RING}" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role=roles/cloudkms.cryptoKeyEncrypterDecrypter \
  --condition=None --quiet >/dev/null

gcloud run jobs deploy "${JOB}" \
  --project="${PROJECT_ID}" --region="${REGION}" \
  --image="${image}" --service-account="${SERVICE_ACCOUNT}" \
  --cpu=1 --memory=1Gi --tasks=1 --parallelism=1 \
  --max-retries=0 --task-timeout=15m --execution-environment=gen2 \
  --set-env-vars='WEEDITPRO_SAM31_OFFICIAL_PROBE_FIXTURE_CONFIRM=publish-official-sam31-probe-fixture-once' \
  --labels='app=weeditpro,operation=sam31-official-probe-ingest,scale=zero' \
  --quiet

policy="$(gcloud run jobs get-iam-policy "${JOB}" \
  --project="${PROJECT_ID}" --region="${REGION}" --format=json)"
if jq -e 'any(.bindings[]?.members[]?;
  . == "allUsers" or . == "allAuthenticatedUsers")' \
  <<<"${policy}" >/dev/null; then
  fail 'official probe ingest job has a public IAM principal'
fi

printf '{"operation":"weeditpro_sam31_probe_fixture_ingest_job_deploy_v1",'
printf '"job":"projects/%s/locations/%s/jobs/%s",' \
  "${PROJECT_ID}" "${REGION}" "${JOB}"
printf '"immutableImage":"%s","minimumIdleInstances":0,' "${image}"
printf '"jobExecuted":false,"mediaProcessed":false,'
printf '"gpuOrModelRuntimeStarted":false,'
printf '"customerCreditsMutated":false,"productionAuthorityGranted":false}\n'
