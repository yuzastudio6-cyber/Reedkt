#!/usr/bin/env bash
set -euo pipefail

# Builds the source-bound, metadata-only SAM 3.1 qualification package
# publisher. It neither publishes a package nor starts a model runtime.

readonly PROJECT_ID='reeditpro'
readonly REGION='us-central1'
readonly REPOSITORY='reeditpro-workers'
readonly IMAGE_NAME='weeditpro-sam31-qualification-package-publisher'
readonly CONFIG='scripts/gcp/prod/cloudbuild-sam31-qualification-package-publisher.yaml'
readonly CONFIRMATION='build-weeditpro-sam31-qualification-package-publisher-v1'
readonly COMMAND_LINE_TOOLS='/Library/Developer/CommandLineTools'

fail() {
  printf 'ERROR: %s.\n' "$1" >&2
  exit 1
}

[[ "${WEEDITPRO_CONFIRM_SAM31_QUALIFICATION_PACKAGE_PUBLISHER_IMAGE_BUILD:-}" \
  == "${CONFIRMATION}" ]] || fail 'exact image-build confirmation is missing'
[[ "$(gcloud config get-value project 2>/dev/null)" == "${PROJECT_ID}" ]] \
  || fail 'active Google Cloud project is not the fixed project'
[[ -f "${CONFIG}" ]] || fail 'fixed Cloud Build configuration is missing'
[[ -x "${COMMAND_LINE_TOOLS}/usr/bin/git" ]] \
  || fail 'pinned Apple Command Line Tools Git is unavailable'

source_commit="$(DEVELOPER_DIR="${COMMAND_LINE_TOOLS}" git rev-parse HEAD)"
source_tree="$(DEVELOPER_DIR="${COMMAND_LINE_TOOLS}" \
  git rev-parse 'HEAD^{tree}')"
[[ "${source_commit}" =~ ^[a-f0-9]{40}$ ]] \
  || fail 'source commit is invalid'
[[ "${source_tree}" =~ ^[a-f0-9]{40}$ ]] || fail 'source tree is invalid'
[[ -z "$(DEVELOPER_DIR="${COMMAND_LINE_TOOLS}" \
  git status --porcelain=v1)" ]] || fail 'source worktree must be clean'

image_tag="sam31-package-publisher-${source_commit:0:16}"
image="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:${image_tag}"
build="$(gcloud builds submit . \
  --project="${PROJECT_ID}" --region="${REGION}" --config="${CONFIG}" \
  --substitutions="_IMAGE=${image},_SOURCE_COMMIT_SHA=${source_commit},_SOURCE_TREE_HASH=${source_tree}" \
  --format=json --quiet)"
build_id="$(jq -r '.id // empty' <<<"${build}")"
[[ "${build_id}" =~ ^[a-f0-9-]{36}$ ]] || fail 'Cloud Build ID is invalid'
[[ "$(jq -r '.status // empty' <<<"${build}")" == 'SUCCESS' ]] \
  || fail 'Cloud Build did not complete successfully'
digest="$(gcloud artifacts docker images describe "${image}" \
  --project="${PROJECT_ID}" --format='value(image_summary.digest)')"
[[ "${digest}" =~ ^sha256:[a-f0-9]{64}$ ]] \
  || fail 'immutable image digest was not observed'

printf '{"operation":"weeditpro_sam31_qualification_package_publisher_image_build_v1",'
printf '"buildId":"%s","sourceCommit":"%s","sourceTree":"%s",' \
  "${build_id}" "${source_commit}" "${source_tree}"
printf '"immutableImage":"%s@%s",' \
  "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}" \
  "${digest}"
printf '"packagePublished":false,"gpuOrModelRuntimeStarted":false,'
printf '"customerCreditsMutated":false,"productionAuthorityGranted":false}\n'
