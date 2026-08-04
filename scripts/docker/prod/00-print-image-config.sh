#!/usr/bin/env bash
set -euo pipefail

REEDITPRO_SOURCE_BUILD_ARGS=()

require_image_env() {
  : "${GCP_PROJECT_ID:?GCP_PROJECT_ID is required}"
  : "${GCP_ARTIFACT_REGION:?GCP_ARTIFACT_REGION is required}"
  : "${REEDITPRO_ARTIFACT_REPOSITORY:?REEDITPRO_ARTIFACT_REPOSITORY is required}"
  : "${REEDITPRO_IMAGE_TAG:?REEDITPRO_IMAGE_TAG is required}"
  if [[ "${REEDITPRO_IMAGE_TAG}" == "manual-not-set" ]]; then
    echo "ERROR: set REEDITPRO_IMAGE_TAG to an explicit reviewed tag before building." >&2
    exit 1
  fi
}

image_name() {
  local image="$1"
  echo "${GCP_ARTIFACT_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${REEDITPRO_ARTIFACT_REPOSITORY}/${image}:${REEDITPRO_IMAGE_TAG}"
}

require_clean_source_identity() {
  command -v git >/dev/null 2>&1 || {
    echo "ERROR: git is required to bind the image to reviewed source." >&2
    exit 1
  }

  local repository_root current_root status_output detected_commit detected_tree
  repository_root="$(GIT_OPTIONAL_LOCKS=0 git rev-parse --show-toplevel)"
  current_root="$(pwd -P)"
  repository_root="$(cd "${repository_root}" && pwd -P)"
  if [[ "${current_root}" != "${repository_root}" ]]; then
    echo "ERROR: run the production image build from the repository root." >&2
    exit 1
  fi

  status_output="$(GIT_OPTIONAL_LOCKS=0 git status --porcelain=v1 --untracked-files=all)"
  if [[ -n "${status_output}" ]]; then
    echo "ERROR: production image source must be an exactly clean checkout." >&2
    exit 1
  fi

  detected_commit="$(GIT_OPTIONAL_LOCKS=0 git rev-parse HEAD)"
  detected_tree="$(GIT_OPTIONAL_LOCKS=0 git rev-parse 'HEAD^{tree}')"
  [[ "${detected_commit}" =~ ^[a-f0-9]{40}$ ]] || {
    echo "ERROR: source commit identity is invalid." >&2
    exit 1
  }
  [[ "${detected_tree}" =~ ^[a-f0-9]{40}$ ]] || {
    echo "ERROR: source tree identity is invalid." >&2
    exit 1
  }
  if [[ -n "${REEDITPRO_SOURCE_COMMIT_SHA:-}" && "${REEDITPRO_SOURCE_COMMIT_SHA}" != "${detected_commit}" ]]; then
    echo "ERROR: supplied source commit does not match the clean checkout." >&2
    exit 1
  fi
  if [[ -n "${REEDITPRO_SOURCE_TREE_HASH:-}" && "${REEDITPRO_SOURCE_TREE_HASH}" != "${detected_tree}" ]]; then
    echo "ERROR: supplied source tree does not match the clean checkout." >&2
    exit 1
  fi

  export REEDITPRO_SOURCE_COMMIT_SHA="${detected_commit}"
  export REEDITPRO_SOURCE_TREE_HASH="${detected_tree}"
  export REEDITPRO_SOURCE_CLEAN=true
  REEDITPRO_SOURCE_BUILD_ARGS=(
    --build-arg "REEDITPRO_SOURCE_COMMIT_SHA=${REEDITPRO_SOURCE_COMMIT_SHA}"
    --build-arg "REEDITPRO_SOURCE_TREE_HASH=${REEDITPRO_SOURCE_TREE_HASH}"
    --build-arg "REEDITPRO_SOURCE_CLEAN=${REEDITPRO_SOURCE_CLEAN}"
  )
}

print_source_identity() {
  echo "Source commit: ${REEDITPRO_SOURCE_COMMIT_SHA}"
  echo "Source tree: ${REEDITPRO_SOURCE_TREE_HASH}"
  echo "Source clean: ${REEDITPRO_SOURCE_CLEAN}"
}

print_image_config() {
  require_image_env
  echo "Project: ${GCP_PROJECT_ID}"
  echo "Artifact region: ${GCP_ARTIFACT_REGION}"
  echo "Repository: ${REEDITPRO_ARTIFACT_REPOSITORY}"
  echo "Image tag: ${REEDITPRO_IMAGE_TAG}"
  echo "Images:"
  for image in reeditpro-api reeditpro-cpu-worker reeditpro-gpu-worker reeditpro-render-worker reeditpro-qa-worker reeditpro-tool-readiness-worker; do
    echo "  - $(image_name "${image}")"
  done
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  print_image_config
fi
