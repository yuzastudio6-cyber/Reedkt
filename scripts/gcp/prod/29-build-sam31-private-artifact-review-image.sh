#!/usr/bin/env bash
set -euo pipefail

# Builds only the source-bound exact-byte review image. It contains current
# ClamAV signatures but no SAM source/checkpoint and starts no cloud job.

readonly PROJECT_ID='reeditpro'
readonly REGION='us-central1'
readonly REPOSITORY='reeditpro-workers'
readonly IMAGE_NAME='weeditpro-sam31-private-artifact-review'
readonly CONFIG='scripts/gcp/prod/cloudbuild-sam31-private-artifact-review.yaml'
readonly CONFIRMATION='build-weeditpro-sam31-private-artifact-review-v1'

fail() {
  printf 'ERROR: %s.\n' "$1" >&2
  exit 1
}

[[ "${WEEDITPRO_CONFIRM_SAM31_PRIVATE_ARTIFACT_REVIEW_IMAGE_BUILD:-}" \
  == "${CONFIRMATION}" ]] || fail 'exact image-build confirmation is missing'
[[ "$(gcloud config get-value project 2>/dev/null)" == "${PROJECT_ID}" ]] \
  || fail 'active Google Cloud project is not the fixed project'
[[ -f "${CONFIG}" ]] || fail 'fixed Cloud Build configuration is missing'

readonly COMMAND_LINE_TOOLS='/Library/Developer/CommandLineTools'
[[ -x "${COMMAND_LINE_TOOLS}/usr/bin/git" ]] \
  || fail 'pinned Apple Command Line Tools Git is unavailable'
source_commit="$(DEVELOPER_DIR="${COMMAND_LINE_TOOLS}" git rev-parse HEAD)"
source_tree="$(DEVELOPER_DIR="${COMMAND_LINE_TOOLS}" git rev-parse 'HEAD^{tree}')"
[[ "${source_commit}" =~ ^[a-f0-9]{40}$ ]] \
  || fail 'source commit is invalid'
[[ "${source_tree}" =~ ^[a-f0-9]{40}$ ]] || fail 'source tree is invalid'
[[ -z "$(DEVELOPER_DIR="${COMMAND_LINE_TOOLS}" git status --porcelain=v1)" ]] \
  || fail 'source worktree must be clean'

image_tag="sam31-private-review-${source_commit:0:16}"
image="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:${image_tag}"
gcloud builds submit . \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --config="${CONFIG}" \
  --substitutions="_IMAGE=${image},_SOURCE_COMMIT_SHA=${source_commit},_SOURCE_TREE_HASH=${source_tree}" \
  --quiet

digest="$(gcloud artifacts docker images describe "${image}" \
  --project="${PROJECT_ID}" --format='value(image_summary.digest)')"
[[ "${digest}" =~ ^sha256:[a-f0-9]{64}$ ]] \
  || fail 'immutable image digest was not observed'

printf '{"operation":"weeditpro_sam31_private_artifact_review_image_build_v1",'
printf '"sourceCommit":"%s","sourceTree":"%s",' \
  "${source_commit}" "${source_tree}"
printf '"immutableImage":"%s@%s",' \
  "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}" \
  "${digest}"
printf '"samSourceOrCheckpointIncluded":false,'
printf '"modelExecuted":false,"cloudJobStarted":false,'
printf '"customerCreditsMutated":false,"productionAuthorityGranted":false}\n'
