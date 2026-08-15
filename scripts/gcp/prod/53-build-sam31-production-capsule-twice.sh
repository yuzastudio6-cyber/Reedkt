#!/usr/bin/env bash
set -Eeuo pipefail

readonly PROJECT_ID='reeditpro'
readonly REGION='us-central1'
readonly CONTROL_BUCKET='reeditpro-production-reeditpro-control-plane-state'
readonly LEDGER_PREFIX='private/sam3_1/production-capsule-dual-build/v3'
readonly CONFIRMATION='start-two-independent-weeditpro-sam31-production-capsule-builds-v3'
readonly INPUT_CONFIRMATION='prepare-one-sam31-production-capsule-two-vertex-build-input-v2'
readonly CONTEXT='docker/prod/gpu-worker/sam3_1'
readonly CONFIG="${CONTEXT}/cloudbuild.production-capsule.yaml"
readonly IGNORE_FILE='.gcloudignore.production-capsule'
readonly IGNORE_PATH="${CONTEXT}/${IGNORE_FILE}"
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
[[ -f "${IGNORE_PATH}" ]]
[[ -d "${APPLE_COMMAND_LINE_TOOLS}" ]] \
  || { printf 'ERROR: Apple Command Line Tools are unavailable.\n' >&2; exit 1; }
[[ -z "$(env COPYFILE_DISABLE=1 DEVELOPER_DIR="${APPLE_COMMAND_LINE_TOOLS}" \
  git status --short)" ]] \
  || { printf 'ERROR: source worktree must be clean.\n' >&2; exit 1; }
[[ "$(gcloud config get project 2>/dev/null)" = "${PROJECT_ID}" ]] \
  || { printf 'ERROR: active gcloud project changed.\n' >&2; exit 1; }
[[ "$(gcloud config get account 2>/dev/null)" = 'aiediting@reeditpro.com' ]] \
  || { printf 'ERROR: active gcloud account changed.\n' >&2; exit 1; }

readonly WORK="$(mktemp -d)"
trap 'rm -rf "${WORK}"' EXIT
COMMIT="$(env COPYFILE_DISABLE=1 \
  DEVELOPER_DIR="${APPLE_COMMAND_LINE_TOOLS}" git rev-parse HEAD)"
readonly COMMIT
TREE="$(env COPYFILE_DISABLE=1 \
  DEVELOPER_DIR="${APPLE_COMMAND_LINE_TOOLS}" git rev-parse 'HEAD^{tree}')"
readonly TREE
INPUTS="$(
  WEEDITPRO_SAM31_PRODUCTION_CAPSULE_VERTEX_BUILD_INPUT_CONFIRMATION="${INPUT_CONFIRMATION}" \
    WEEDITPRO_GCP_LOCAL_OPERATOR_AUTH=active-gcloud-image-builder-impersonation-v1 \
    npm run --silent prepare:sam3_1-production-capsule-vertex-build-inputs
)"
readonly INPUTS

env INPUTS="${INPUTS}" python3 -I -B - \
  "${COMMIT}" "${TREE}" "${CONFIG}" "${IGNORE_PATH}" \
  "${CONTEXT}/Dockerfile.production-capsule-builder" \
  "${CONTEXT}/build-production-capsule.sh" \
  >"${WORK}/admission.json" <<'PY'
import hashlib
import json
import os
from pathlib import Path
import re
import sys

value = json.loads(os.environ['INPUTS'])
commit, tree, *source_paths = sys.argv[1:]
if (
    value.get('status') != 'ready_for_two_independent_cloud_builds'
    or value.get('canonicalVertexReleaseManifestIngestAndBindingReread')
       is not True
    or value.get('legacyBatchRequestResultOrReleaseCastOrRelabelUsed')
       is not False
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

canonical = lambda item: json.dumps(
    item, sort_keys=True, separators=(',', ':'), ensure_ascii=False,
    allow_nan=False,
).encode('utf-8')
source_hashes = {
    path: hashlib.sha256(Path(path).read_bytes()).hexdigest()
    for path in source_paths
}
identity = {
    'sourceCheckpointQualificationRef': value[
        'sourceCheckpointQualificationRef'
    ],
    'sourceQualificationCapsuleManifestRef': value[
        'sourceQualificationCapsuleManifestRef'
    ],
    'artifactBindingRef': value['artifactBindingRef'],
    'sourceCapsuleManifestRecord': value['sourceCapsuleManifestRecord'],
    'qualificationReleaseRecord': value['qualificationReleaseRecord'],
    'artifactBindingRecord': value['artifactBindingRecord'],
    'repositoryCommit': commit,
    'repositoryTree': tree,
    'sourceFileSha256': source_hashes,
}
publication_id = hashlib.sha256(canonical(identity)).hexdigest()
payload = {
    'schemaVersion':
        'weeditpro-sam3_1-production-capsule-dual-build-admission-v3',
    'source': 'weeditpro_sam3_1_production_capsule_dual_build_owner',
    'publicationId': publication_id,
    **identity,
    'requiredBuildSlots': ['primary', 'confirmation'],
    'independentBuildCount': 2,
    'createOnlyAdmission': True,
    'createOnlyConsumptionPerSlot': True,
    'automaticRetryAllowed': False,
    'uncertainOutcomeRequiresObservation': True,
    'callerSelectedSourceBuildImageTagCommandOrRetryAllowed': False,
    'modelOrCheckpointExecuted': False,
    'customerCreditsMutated': False,
    'runtimeReleaseGranted': False,
    'productionAuthorityGranted': False,
}
record = dict(payload)
record['admissionHash'] = hashlib.sha256(canonical(payload)).hexdigest()
print(canonical(record).decode('utf-8'))
PY

PUBLICATION_ID="$(python3 -I -B - \
  "${WORK}/admission.json" <<'PY'
import json
from pathlib import Path
import re
import sys

value = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
publication_id = value.get('publicationId')
if re.fullmatch(r'[a-f0-9]{64}', publication_id or '') is None:
    raise SystemExit('production capsule publication id is malformed')
print(publication_id)
PY
)"
readonly PUBLICATION_ID
readonly LEDGER="gs://${CONTROL_BUCKET}/${LEDGER_PREFIX}/${PUBLICATION_ID}"

persist_exact_create_only() {
  local source_path="$1"
  local destination="$2"
  if gcloud storage cp --quiet --if-generation-match=0 \
    --content-type=application/json "${source_path}" "${destination}" \
    >/dev/null 2>"${WORK}/storage-error.log"; then
    return 0
  fi
  if ! gcloud storage cat "${destination}" >"${WORK}/reread.json" \
    2>/dev/null; then
    cat "${WORK}/storage-error.log" >&2
    printf 'ERROR: create-only cloud record outcome is uncertain; do not retry automatically.\n' >&2
    return 1
  fi
  cmp -s "${source_path}" "${WORK}/reread.json" \
    || { printf 'ERROR: create-only cloud record collision.\n' >&2; return 1; }
}

persist_exact_create_only "${WORK}/admission.json" "${LEDGER}/admission.json"

SUBSTITUTIONS_BASE="$(env INPUTS="${INPUTS}" \
  python3 -I -B - "${COMMIT}" "${TREE}" "${PUBLICATION_ID}" <<'PY'
import json
import os
import re
import sys

value = json.loads(os.environ['INPUTS'])
commit, tree, publication_id = sys.argv[1:]
records = {
    'SOURCE_CAPSULE_MANIFEST': value['sourceCapsuleManifestRecord'],
    'QUALIFICATION_RELEASE': value['qualificationReleaseRecord'],
    'ARTIFACT_BINDING': value['artifactBindingRecord'],
}
parts = [
    f'_REPOSITORY_COMMIT={commit}',
    f'_REPOSITORY_TREE={tree}',
    f'_PRODUCTION_CAPSULE_PUBLICATION_ID={publication_id}',
]
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
readonly SUBSTITUTIONS_BASE

write_consumption() {
  local slot="$1"
  python3 -I -B - "${PUBLICATION_ID}" "${slot}" \
    "${COMMIT}" "${TREE}" >"${WORK}/${slot}-consumption.json" <<'PY'
import hashlib
import json
import sys

publication_id, slot, commit, tree = sys.argv[1:]
canonical = lambda item: json.dumps(
    item, sort_keys=True, separators=(',', ':'), ensure_ascii=False,
    allow_nan=False,
).encode('utf-8')
payload = {
    'schemaVersion':
        'weeditpro-sam3_1-production-capsule-build-consumption-v3',
    'source': 'weeditpro_sam3_1_production_capsule_dual_build_owner',
    'publicationId': publication_id,
    'buildSlot': slot,
    'repositoryCommit': commit,
    'repositoryTree': tree,
    'consumedCreateOnly': True,
    'automaticRetryAllowed': False,
    'uncertainOutcomeRequiresObservation': True,
    'cloudBuildKnownStarted': False,
    'customerCreditsMutated': False,
    'productionAuthorityGranted': False,
}
record = dict(payload)
record['consumptionHash'] = hashlib.sha256(canonical(payload)).hexdigest()
print(canonical(record).decode('utf-8'))
PY
}

write_submission() {
  local slot="$1"
  local build_id="$2"
  python3 -I -B - "${PUBLICATION_ID}" "${slot}" "${build_id}" \
    "${COMMIT}" "${TREE}" >"${WORK}/${slot}-submission.json" <<'PY'
import hashlib
import json
import re
import sys

publication_id, slot, build_id, commit, tree = sys.argv[1:]
if re.fullmatch(
    r'[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}',
    build_id,
) is None:
    raise SystemExit('Cloud Build id is malformed')
canonical = lambda item: json.dumps(
    item, sort_keys=True, separators=(',', ':'), ensure_ascii=False,
    allow_nan=False,
).encode('utf-8')
payload = {
    'schemaVersion':
        'weeditpro-sam3_1-production-capsule-build-submission-v3',
    'source': 'weeditpro_sam3_1_production_capsule_dual_build_owner',
    'publicationId': publication_id,
    'buildSlot': slot,
    'repositoryCommit': commit,
    'repositoryTree': tree,
    'cloudBuildId': build_id,
    'cloudBuildResource':
        f'projects/reeditpro/locations/us-central1/builds/{build_id}',
    'providerOutcome': 'executed',
    'automaticRetryAllowed': False,
    'modelOrCheckpointExecuted': False,
    'customerCreditsMutated': False,
    'runtimeReleaseGranted': False,
    'productionAuthorityGranted': False,
}
record = dict(payload)
record['submissionHash'] = hashlib.sha256(canonical(payload)).hexdigest()
print(canonical(record).decode('utf-8'))
PY
}

reread_submission_id() {
  local slot="$1"
  local destination="${LEDGER}/submissions/${slot}.json"
  if ! gcloud storage cat "${destination}" >"${WORK}/${slot}-reread.json" \
    2>/dev/null; then
    return 1
  fi
  python3 -I -B - "${WORK}/${slot}-reread.json" \
    "${PUBLICATION_ID}" "${slot}" "${COMMIT}" "${TREE}" <<'PY'
import hashlib
import json
from pathlib import Path
import re
import sys

path, publication_id, slot, commit, tree = sys.argv[1:]
value = json.loads(Path(path).read_text(encoding='utf-8'))
canonical = lambda item: json.dumps(
    item, sort_keys=True, separators=(',', ':'), ensure_ascii=False,
    allow_nan=False,
).encode('utf-8')
payload = dict(value)
observed_hash = payload.pop('submissionHash', None)
expected_keys = {
    'schemaVersion', 'source', 'publicationId', 'buildSlot',
    'repositoryCommit', 'repositoryTree', 'cloudBuildId',
    'cloudBuildResource', 'providerOutcome', 'automaticRetryAllowed',
    'modelOrCheckpointExecuted', 'customerCreditsMutated',
    'runtimeReleaseGranted', 'productionAuthorityGranted', 'submissionHash',
}
if (
    set(value) != expected_keys
    or value.get('schemaVersion')
      != 'weeditpro-sam3_1-production-capsule-build-submission-v3'
    or value.get('source')
      != 'weeditpro_sam3_1_production_capsule_dual_build_owner'
    or value.get('publicationId') != publication_id
    or value.get('buildSlot') != slot
    or value.get('repositoryCommit') != commit
    or value.get('repositoryTree') != tree
    or value.get('providerOutcome') != 'executed'
    or value.get('automaticRetryAllowed') is not False
    or value.get('modelOrCheckpointExecuted') is not False
    or value.get('customerCreditsMutated') is not False
    or value.get('runtimeReleaseGranted') is not False
    or value.get('productionAuthorityGranted') is not False
    or hashlib.sha256(canonical(payload)).hexdigest() != observed_hash
    or re.fullmatch(
        r'[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}',
        value.get('cloudBuildId', ''),
    ) is None
    or value.get('cloudBuildResource')
      != 'projects/reeditpro/locations/us-central1/builds/'
         + value.get('cloudBuildId', '')
):
    raise SystemExit('persisted Cloud Build submission changed')
print(value['cloudBuildId'])
PY
}

reconcile_consumed_slot() {
  local slot="$1"
  gcloud builds list --project="${PROJECT_ID}" --region="${REGION}" \
    --limit=1000 --format=json --quiet >"${WORK}/${slot}-build-list.json"
  python3 -I -B - "${WORK}/${slot}-build-list.json" \
    "${PUBLICATION_ID}" "${slot}" "${COMMIT}" "${TREE}" <<'PY'
import json
from pathlib import Path
import re
import sys

path, publication_id, slot, commit, tree = sys.argv[1:]
builds = json.loads(Path(path).read_text(encoding='utf-8'))
matches = []
for build in builds:
    substitutions = build.get('substitutions') or {}
    if (
        substitutions.get('_PRODUCTION_CAPSULE_PUBLICATION_ID')
          == publication_id
        and substitutions.get('_PRODUCTION_CAPSULE_BUILD_SLOT') == slot
        and substitutions.get('_REPOSITORY_COMMIT') == commit
        and substitutions.get('_REPOSITORY_TREE') == tree
    ):
        build_id = build.get('id')
        if re.fullmatch(
            r'[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}',
            build_id or '',
        ) is None:
            raise SystemExit('matching Cloud Build has a malformed id')
        matches.append(build_id)
if len(matches) == 0:
    raise SystemExit(
        'consumed Cloud Build outcome remains unknown; automatic retry is forbidden'
    )
if len(matches) != 1:
    raise SystemExit('multiple Cloud Builds crossed one consumed slot')
print(matches[0])
PY
}

submit_or_reread_slot() {
  local slot="$1"
  local build_id
  if build_id="$(reread_submission_id "${slot}")"; then
    printf '%s' "${build_id}"
    return 0
  fi

  write_consumption "${slot}"
  local consumption_destination="${LEDGER}/consumptions/${slot}.json"
  local newly_consumed=true
  if gcloud storage cat "${consumption_destination}" \
    >"${WORK}/${slot}-existing-consumption.json" 2>/dev/null; then
    cmp -s "${WORK}/${slot}-consumption.json" \
      "${WORK}/${slot}-existing-consumption.json" \
      || { printf 'ERROR: consumed build slot collided.\n' >&2; return 1; }
    newly_consumed=false
  else
    persist_exact_create_only "${WORK}/${slot}-consumption.json" \
      "${consumption_destination}"
  fi

  if [[ "${newly_consumed}" = false ]]; then
    build_id="$(reconcile_consumed_slot "${slot}")"
  else
    local response_file="${WORK}/${slot}-submit.json"
    if ! gcloud builds submit "${CONTEXT}" \
      --project="${PROJECT_ID}" \
      --region="${REGION}" \
      --config="${CONFIG}" \
      --ignore-file="${IGNORE_FILE}" \
      --substitutions="${SUBSTITUTIONS_BASE},_PRODUCTION_CAPSULE_BUILD_SLOT=${slot}" \
      --async --format=json --quiet >"${response_file}"; then
      printf 'ERROR: Cloud Build outcome is uncertain; the slot was consumed and will not be retried automatically.\n' >&2
      return 1
    fi
    build_id="$(python3 -I -B - "${response_file}" <<'PY'
import json
from pathlib import Path
import re
import sys

value = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
build_id = value.get('id')
if re.fullmatch(
    r'[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}',
    build_id or '',
) is None:
    raise SystemExit('Cloud Build did not return an exact build id')
print(build_id)
PY
)"
  fi

  write_submission "${slot}" "${build_id}"
  persist_exact_create_only "${WORK}/${slot}-submission.json" \
    "${LEDGER}/submissions/${slot}.json"
  reread_submission_id "${slot}"
}

PRIMARY_BUILD_ID="$(submit_or_reread_slot primary)"
readonly PRIMARY_BUILD_ID
CONFIRMATION_BUILD_ID="$(submit_or_reread_slot confirmation)"
readonly CONFIRMATION_BUILD_ID
[[ "${PRIMARY_BUILD_ID}" != "${CONFIRMATION_BUILD_ID}" ]] \
  || { printf 'ERROR: two independent Cloud Build ids are required.\n' >&2; exit 1; }

python3 -I -B - "${PUBLICATION_ID}" "${PRIMARY_BUILD_ID}" \
  "${CONFIRMATION_BUILD_ID}" <<'PY'
import json
import sys

publication_id, primary_id, confirmation_id = sys.argv[1:]
print(json.dumps({
    'schemaVersion':
        'weeditpro-sam3_1-production-capsule-two-build-submission-v3',
    'publicationId': publication_id,
    'primaryBuildId': primary_id,
    'confirmationBuildId': confirmation_id,
    'independentBuildCount': 2,
    'durableCreateOnlyAdmissionReread': True,
    'durableCreateOnlyConsumptionPerSlot': True,
    'durableSubmissionRereadPerSlot': True,
    'automaticRetryAllowed': False,
    'uncertainOutcomeRequiresObservation': True,
    'sourceCheckpointQualificationRefReread': True,
    'vertexQualificationEvidenceReread': True,
    'historicalBatchQualificationCastOrRelabelUsed': False,
    'customerCreditsMutated': False,
    'imageBuildStarted': False,
    'modelExecuted': False,
    'runtimeReleaseGranted': False,
    'productionAuthorityGranted': False,
}, sort_keys=True, separators=(',', ':')))
PY
