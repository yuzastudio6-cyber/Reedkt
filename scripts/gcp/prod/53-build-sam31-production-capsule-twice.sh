#!/usr/bin/env bash
set -Eeuo pipefail

readonly PROJECT_ID='reeditpro'
readonly REGION='us-central1'
readonly CONFIRMATION='start-two-independent-weeditpro-sam31-production-capsule-builds-v1'
readonly INPUT_CONFIRMATION='prepare-one-sam31-production-capsule-two-build-input-v1'
readonly CONTEXT='docker/prod/gpu-worker/sam3_1'
readonly CONFIG="${CONTEXT}/cloudbuild.production-capsule.yaml"
readonly IGNORE_FILE="${CONTEXT}/.gcloudignore.production-capsule"
readonly APPLE_COMMAND_LINE_TOOLS='/Library/Developer/CommandLineTools'

[[ $# -eq 0 ]] || { printf 'ERROR: caller arguments are forbidden.\n' >&2; exit 64; }
[[ "${WEEDITPRO_CONFIRM_SAM31_PRODUCTION_CAPSULE_TWO_BUILDS:-}" = "${CONFIRMATION}" ]] \
  || { printf 'ERROR: exact two-build confirmation is required.\n' >&2; exit 64; }
for variable_name in \
  WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_ID \
  WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_SHA256; do
  [[ -n "${!variable_name:-}" ]] \
    || { printf 'ERROR: missing %s.\n' "${variable_name}" >&2; exit 64; }
done
for command_name in gcloud git node npm python3; do
  command -v "${command_name}" >/dev/null \
    || { printf 'ERROR: missing %s.\n' "${command_name}" >&2; exit 1; }
done
[[ -f "${CONFIG}" ]]
[[ -f "${CONTEXT}/Dockerfile.production-capsule-builder" ]]
[[ -f "${CONTEXT}/build-production-capsule.sh" ]]
[[ -f "${IGNORE_FILE}" ]]
[[ -d "${APPLE_COMMAND_LINE_TOOLS}" ]] \
  || { printf 'ERROR: Apple Command Line Tools are unavailable.\n' >&2; exit 1; }
[[ -z "$(env COPYFILE_DISABLE=1 DEVELOPER_DIR="${APPLE_COMMAND_LINE_TOOLS}" \
  git status --short)" ]] \
  || { printf 'ERROR: source worktree must be clean.\n' >&2; exit 1; }
[[ "$(gcloud config get project 2>/dev/null)" = "${PROJECT_ID}" ]] \
  || { printf 'ERROR: active gcloud project changed.\n' >&2; exit 1; }

readonly COMMIT="$(env COPYFILE_DISABLE=1 \
  DEVELOPER_DIR="${APPLE_COMMAND_LINE_TOOLS}" git rev-parse HEAD)"
readonly TREE="$(env COPYFILE_DISABLE=1 \
  DEVELOPER_DIR="${APPLE_COMMAND_LINE_TOOLS}" git rev-parse 'HEAD^{tree}')"
readonly INPUTS="$(
  WEEDITPRO_SAM31_PRODUCTION_CAPSULE_BUILD_INPUT_CONFIRMATION="${INPUT_CONFIRMATION}" \
    npm run --silent prepare:sam3_1-production-capsule-build-inputs
)"
readonly SUBSTITUTIONS="$(INPUTS="${INPUTS}" \
  python3 -I -B - "${COMMIT}" "${TREE}" <<'PY'
import json
import os
import re
import sys

value = json.loads(os.environ['INPUTS'])
commit, tree = sys.argv[1:]
if (
    value.get('status') != 'ready_for_two_independent_cloud_builds'
    or value.get('canonicalReleaseManifestIngestAndBindingReread') is not True
    or value.get('callerPathUrlCommandImageTagBuildArgumentOrGpuAccepted')
       is not False
    or value.get('cloudBuildStarted') is not False
    or value.get('imageBuildStarted') is not False
    or value.get('modelExecuted') is not False
    or value.get('customerCreditsMutated') is not False
    or value.get('productionAuthorityGranted') is not False
    or re.fullmatch(r'[a-f0-9]{40}', commit) is None
    or re.fullmatch(r'[a-f0-9]{40}', tree) is None
):
    raise SystemExit('canonical production build inputs are not admissible')
records = {
    'SOURCE_CAPSULE_MANIFEST': value['sourceCapsuleManifestRecord'],
    'QUALIFICATION_RELEASE': value['qualificationReleaseRecord'],
    'ARTIFACT_BINDING': value['artifactBindingRecord'],
}
parts = [f'_REPOSITORY_COMMIT={commit}', f'_REPOSITORY_TREE={tree}']
for prefix, record in records.items():
    object_name = record['objectName']
    generation = record['generation']
    digest = record['sha256']
    if (
        ',' in object_name
        or re.fullmatch(r'[1-9][0-9]{0,30}', generation) is None
        or re.fullmatch(r'[a-f0-9]{64}', digest) is None
    ):
        raise SystemExit('canonical control record metadata is malformed')
    parts.extend([
        f'_{prefix}_OBJECT={object_name}',
        f'_{prefix}_GENERATION={generation}',
        f'_{prefix}_SHA256={digest}',
    ])
print(','.join(parts))
PY
)"

readonly PRIMARY="$(gcloud builds submit "${CONTEXT}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --config="${CONFIG}" \
  --ignore-file="${IGNORE_FILE}" \
  --substitutions="${SUBSTITUTIONS}" \
  --async --format=json --quiet)"
readonly CONFIRMATION_BUILD="$(gcloud builds submit "${CONTEXT}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --config="${CONFIG}" \
  --ignore-file="${IGNORE_FILE}" \
  --substitutions="${SUBSTITUTIONS}" \
  --async --format=json --quiet)"

PRIMARY="${PRIMARY}" CONFIRMATION_BUILD="${CONFIRMATION_BUILD}" \
python3 -I -B - <<'PY'
import json
import os

primary = json.loads(os.environ['PRIMARY'])
confirmation = json.loads(os.environ['CONFIRMATION_BUILD'])
primary_id = primary.get('id')
confirmation_id = confirmation.get('id')
if not primary_id or not confirmation_id or primary_id == confirmation_id:
    raise SystemExit('Cloud Build did not return two independent build ids')
print(json.dumps({
    'schemaVersion': 'weeditpro-sam3_1-production-capsule-two-build-submission-v1',
    'primaryBuildId': primary_id,
    'confirmationBuildId': confirmation_id,
    'independentBuildCount': 2,
    'sourceCheckpointQualificationRefReread': True,
    'customerCreditsMutated': False,
    'imageBuildStarted': False,
    'modelExecuted': False,
    'runtimeReleaseGranted': False,
    'productionAuthorityGranted': False,
}, sort_keys=True, separators=(',', ':')))
PY
