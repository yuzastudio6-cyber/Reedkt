#!/usr/bin/env bash
set -euo pipefail

readonly ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "${ROOT_DIR}"

if [[ "${WEEDITPRO_CONFIRM_SAM31_SOURCE_PREPARATION_IMAGE_BUILD:-false}" != true ]]; then
  echo 'ERROR: refusing the private SAM 3.1 source-preparation image build without confirmation.' >&2
  exit 1
fi
if [[ "${WEEDITPRO_CONFIRM_SAM31_SOURCE_PREPARATION_IMAGE_BUILD_EXACT_SOURCE:-false}" != true ]]; then
  echo 'ERROR: refusing the private image build without the exact-source confirmation.' >&2
  exit 1
fi
if [[ -n "$(git status --porcelain --untracked-files=all)" ]]; then
  echo 'ERROR: the SAM 3.1 image build requires a clean source tree.' >&2
  exit 1
fi

readonly PROJECT_ID='reeditpro'
readonly REGION='us-central1'
readonly REPOSITORY='reeditpro-workers'
readonly IMAGE_NAME='reeditpro-sam31-source-preparation-l4'
readonly COMMIT_SHA="$(git rev-parse HEAD)"
readonly TREE_SHA="$(git rev-parse HEAD^{tree})"
readonly SHORT_ID="${COMMIT_SHA:0:16}"
readonly TAGGED_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:source-prep-${SHORT_ID}"
readonly SOURCE_ARCHIVE="/tmp/weeditpro-sam31-source-preparation-${COMMIT_SHA}.tar.gz"

if [[ ! "${COMMIT_SHA}" =~ ^[0-9a-f]{40}$ || ! "${TREE_SHA}" =~ ^[0-9a-f]{40}$ ]]; then
  echo 'ERROR: source commit or tree identity is invalid.' >&2
  exit 1
fi
if ! git merge-base --is-ancestor "${COMMIT_SHA}" "origin/codex/backend-workflow-pipeline-continuation"; then
  echo 'ERROR: source commit is not published on the canonical milestone branch.' >&2
  exit 1
fi

trap 'find "${SOURCE_ARCHIVE}" -maxdepth 0 -type f -delete 2>/dev/null || true' EXIT
git archive --format=tar.gz --output="${SOURCE_ARCHIVE}" "${COMMIT_SHA}"
readonly SOURCE_SHA256="$(shasum -a 256 "${SOURCE_ARCHIVE}" | awk '{print $1}')"
readonly SOURCE_BYTES="$(stat -f '%z' "${SOURCE_ARCHIVE}")"

gcloud builds submit "${SOURCE_ARCHIVE}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --config=docker/prod/gpu-worker/sam3_1-source-preparation/cloudbuild.candidate.yaml \
  --substitutions="_IMMUTABLE_CANDIDATE_TAG=${TAGGED_IMAGE},_SOURCE_COMMIT_SHA=${COMMIT_SHA},_SOURCE_TREE_HASH=${TREE_SHA}" \
  --format=json

printf 'source_commit_sha=%s\n' "${COMMIT_SHA}"
printf 'source_tree_sha=%s\n' "${TREE_SHA}"
printf 'source_archive_sha256=%s\n' "${SOURCE_SHA256}"
printf 'source_archive_bytes=%s\n' "${SOURCE_BYTES}"
printf 'candidate_tag=%s\n' "${TAGGED_IMAGE}"
printf 'runtime_release_granted=false\n'
printf 'gpu_job_dispatched=false\n'
printf 'customer_credits_mutated=false\n'
printf 'production_ready=false\n'
