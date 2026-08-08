#!/usr/bin/env bash
set -euo pipefail

# Deploys the private scale-from-zero all-route GPU price publisher permanently
# unarmed. The linked billing-account coordinate is execution-only input.

readonly PROJECT_ID='reeditpro'
readonly PROJECT_NUMBER='390722338345'
readonly REGION='us-central1'
readonly JOB='weeditpro-gpu-rate-publisher'
readonly SERVICE_ACCOUNT='reeditpro-api-sa@reeditpro.iam.gserviceaccount.com'
readonly IMAGE_NAME='weeditpro-gpu-rate-publisher'
readonly REPOSITORY='reeditpro-workers'
readonly CONFIRMATION='deploy-weeditpro-gpu-rate-publisher-v1'
readonly COMMAND_LINE_TOOLS='/Library/Developer/CommandLineTools'

fail() {
  printf 'ERROR: %s.\n' "$1" >&2
  exit 1
}

[[ "${WEEDITPRO_CONFIRM_GPU_RATE_PUBLISHER_JOB_DEPLOY:-}" \
  == "${CONFIRMATION}" ]] || fail 'exact job-deployment confirmation is missing'
[[ "$(gcloud config get-value project 2>/dev/null)" == "${PROJECT_ID}" ]] \
  || fail 'active Google Cloud project is not the fixed project'
[[ "$(gcloud projects describe "${PROJECT_ID}" \
  --format='value(projectNumber)')" == "${PROJECT_NUMBER}" ]] \
  || fail 'project number changed'
[[ -x "${COMMAND_LINE_TOOLS}/usr/bin/git" ]] \
  || fail 'pinned Apple Command Line Tools Git is unavailable'

source_commit="$(DEVELOPER_DIR="${COMMAND_LINE_TOOLS}" git rev-parse HEAD)"
source_tree="$(DEVELOPER_DIR="${COMMAND_LINE_TOOLS}" \
  git rev-parse 'HEAD^{tree}')"
[[ -z "$(DEVELOPER_DIR="${COMMAND_LINE_TOOLS}" \
  git status --porcelain=v1)" ]] || fail 'source worktree must be clean'
build_id="${WEEDITPRO_GPU_RATE_PUBLISHER_BUILD_ID:-}"
[[ "${build_id}" =~ ^[a-f0-9-]{36}$ ]] || fail 'exact Cloud Build ID is missing'
image_tag="gpu-rate-publisher-${source_commit:0:16}"
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

gcloud iam service-accounts describe "${SERVICE_ACCOUNT}" \
  --project="${PROJECT_ID}" >/dev/null
for role in roles/storage.objectCreator roles/storage.objectViewer; do
  bucket_policy="$(gcloud storage buckets get-iam-policy \
    'gs://reeditpro-production-reeditpro-control-plane-state' \
    --project="${PROJECT_ID}" --format=json)"
  jq -e --arg role "${role}" \
    --arg member "serviceAccount:${SERVICE_ACCOUNT}" '
      any(.bindings[]?; .role == $role
        and (((.members // []) | index($member)) != null))
    ' <<<"${bucket_policy}" >/dev/null \
    || fail 'GPU rate publisher bucket IAM changed'
done

gcloud run jobs deploy "${JOB}" \
  --project="${PROJECT_ID}" --region="${REGION}" \
  --image="${image}" --service-account="${SERVICE_ACCOUNT}" \
  --cpu=1 --memory=1Gi --tasks=1 --parallelism=1 \
  --max-retries=0 --task-timeout=5m --execution-environment=gen2 \
  --set-env-vars='WEEDITPRO_GPU_RATE_OPERATOR_ACTION=disabled' \
  --labels='app=weeditpro,operation=gpu-rate-publisher,scale=zero' \
  --quiet
policy="$(gcloud run jobs get-iam-policy "${JOB}" \
  --project="${PROJECT_ID}" --region="${REGION}" --format=json)"
if jq -e 'any(.bindings[]?.members[]?;
  . == "allUsers" or . == "allAuthenticatedUsers")' \
  <<<"${policy}" >/dev/null; then
  fail 'GPU rate publisher has a public IAM principal'
fi
job="$(gcloud run jobs describe "${JOB}" --project="${PROJECT_ID}" \
  --region="${REGION}" --format=json)"
jq -e --arg image "${image}" --arg serviceAccount "${SERVICE_ACCOUNT}" '
  .spec.template.spec.template.spec.containers[0].image == $image
  and .spec.template.spec.template.spec.serviceAccountName == $serviceAccount
  and .spec.template.spec.template.spec.maxRetries == 0
  and (.spec.template.spec.template.spec.containers[0].env | length) == 1
  and .spec.template.spec.template.spec.containers[0].env[0]
    == {name:"WEEDITPRO_GPU_RATE_OPERATOR_ACTION",value:"disabled"}
' <<<"${job}" >/dev/null || fail 'deployed publisher is not exactly unarmed'

printf '{"operation":"weeditpro_gpu_rate_publisher_job_deploy_v1",'
printf '"job":"projects/%s/locations/%s/jobs/%s",' \
  "${PROJECT_ID}" "${REGION}" "${JOB}"
printf '"immutableImage":"%s","operatorAction":"disabled",' "${image}"
printf '"minimumIdleInstances":0,"jobExecuted":false,'
printf '"canonicalGpuRouteCount":3,"billingAccountCoordinatePersisted":false,'
printf '"gpuOrModelRuntimeStarted":false,"customerCreditsMutated":false,'
printf '"productionAuthorityGranted":false}\n'
