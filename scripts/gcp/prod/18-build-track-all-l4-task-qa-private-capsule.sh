#!/usr/bin/env bash
set -Eeuo pipefail

readonly PROJECT_ID='reeditpro'
readonly REGION='us-central1'
readonly CONFIRMATION='start-weeditpro-track-all-l4-task-qa-private-capsule-build-v1'
readonly CONTEXT='docker/prod/gpu-worker/track-all-task-qa'
readonly CONFIG="${CONTEXT}/cloudbuild.private-capsule.yaml"

if [[ $# -ne 0 ]]; then
  printf 'ERROR: caller arguments are forbidden.\n' >&2
  exit 64
fi
if [[ "${WEEDITPRO_CONFIRM_TRACK_ALL_L4_TASK_QA_PRIVATE_CAPSULE_BUILD:-}" \
  != "${CONFIRMATION}" ]]; then
  printf 'ERROR: exact private-capsule build confirmation is required.\n' >&2
  exit 64
fi

for command_name in gcloud git; do
  command -v "${command_name}" >/dev/null \
    || { printf 'ERROR: missing %s.\n' "${command_name}" >&2; exit 1; }
done

[[ -f "${CONFIG}" ]]
[[ -f "${CONTEXT}/Dockerfile.private-capsule-builder" ]]
[[ -f "${CONTEXT}/build-private-capsule.sh" ]]
[[ -z "$(env -u DEVELOPER_DIR git status --short)" ]] \
  || { printf 'ERROR: source worktree must be clean.\n' >&2; exit 1; }
[[ "$(gcloud config get project 2>/dev/null)" = "${PROJECT_ID}" ]] \
  || { printf 'ERROR: active gcloud project changed.\n' >&2; exit 1; }

exec gcloud builds submit "${CONTEXT}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --config="${CONFIG}" \
  --async \
  --format=json \
  --quiet
