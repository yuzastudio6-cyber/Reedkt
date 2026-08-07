#!/usr/bin/env bash
set -Eeuo pipefail

readonly PROJECT_ID='reeditpro'
readonly REGION='us-central1'
readonly CONFIRMATION='ingest-one-weeditpro-sam31-qualification-pycocotools-wheel-v1'
readonly CONTEXT='docker/prod/gpu-worker/sam3_1'
readonly CONFIG="${CONTEXT}/cloudbuild.qualification-pycocotools-ingest.yaml"
readonly APPLE_COMMAND_LINE_TOOLS='/Library/Developer/CommandLineTools'

[[ $# -eq 0 ]] || { printf 'ERROR: caller arguments are forbidden.\n' >&2; exit 64; }
[[ "${WEEDITPRO_CONFIRM_SAM31_QUALIFICATION_PYCOCOTOOLS_INGEST:-}" = "${CONFIRMATION}" ]] \
  || { printf 'ERROR: exact pycocotools-ingest confirmation is required.\n' >&2; exit 64; }
for command_name in gcloud git; do
  command -v "${command_name}" >/dev/null \
    || { printf 'ERROR: missing %s.\n' "${command_name}" >&2; exit 1; }
done
[[ -f "${CONFIG}" ]]
[[ -d "${APPLE_COMMAND_LINE_TOOLS}" ]] \
  || { printf 'ERROR: Apple Command Line Tools are unavailable.\n' >&2; exit 1; }
[[ -z "$(env DEVELOPER_DIR="${APPLE_COMMAND_LINE_TOOLS}" \
  git status --short)" ]] \
  || { printf 'ERROR: source worktree must be clean.\n' >&2; exit 1; }
[[ "$(gcloud config get project 2>/dev/null)" = "${PROJECT_ID}" ]] \
  || { printf 'ERROR: active gcloud project changed.\n' >&2; exit 1; }

readonly COMMIT="$(env DEVELOPER_DIR="${APPLE_COMMAND_LINE_TOOLS}" \
  git rev-parse HEAD)"
readonly TREE="$(env DEVELOPER_DIR="${APPLE_COMMAND_LINE_TOOLS}" \
  git rev-parse 'HEAD^{tree}')"
exec gcloud builds submit "${CONTEXT}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --config="${CONFIG}" \
  --substitutions="_REPOSITORY_COMMIT=${COMMIT},_REPOSITORY_TREE=${TREE}" \
  --async --format=json --quiet
