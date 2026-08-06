#!/usr/bin/env bash
set -euo pipefail

# Adds one operator-entered Hugging Face read token directly to the existing
# cloud-only SAM 3.1 Secret Manager container. The token is read from the
# terminal without echo, is streamed over stdin to gcloud, and is never written
# to a local file or supplied as a process argument.

set +x
umask 077

readonly PROJECT_ID='reeditpro'
readonly PROJECT_NUMBER='390722338345'
readonly SECRET_NAME='HUGGINGFACE_TOKEN'
readonly CONFIRMATION='add-weeditpro-sam31-hugging-face-token-version-v1'

token=''
cleanup() {
  unset token
}
trap cleanup EXIT HUP INT TERM

fail() {
  printf 'ERROR: %s.\n' "$1" >&2
  exit 1
}

[[ "${WEEDITPRO_CONFIRM_SAM31_HF_TOKEN_VERSION:-}" == "${CONFIRMATION}" ]] \
  || fail 'exact SAM 3.1 credential-version confirmation is missing'
[[ -t 0 && -t 1 ]] \
  || fail 'run this command directly in a trusted interactive terminal'
[[ "$(gcloud config get-value project 2>/dev/null)" == "${PROJECT_ID}" ]] \
  || fail 'active Google Cloud project is not the fixed project'
[[ "$(gcloud projects describe "${PROJECT_ID}" \
  --format='value(projectNumber)')" == "${PROJECT_NUMBER}" ]] \
  || fail 'GCP project number does not match the reviewed project'
gcloud secrets describe "${SECRET_NAME}" \
  --project="${PROJECT_ID}" --format=none >/dev/null \
  || fail 'the canonical Hugging Face secret container is unavailable'

printf '%s\n' \
  'Enter the Hugging Face read token for the manually accepted facebook/sam3.1 repository.' \
  'The value will not be displayed, written to disk, or printed.'
IFS= read -r -s -p 'Hugging Face token: ' token </dev/tty
printf '\n'

[[ "${token}" =~ ^hf_[A-Za-z0-9]{20,220}$ ]] \
  || fail 'the entered Hugging Face token shape is invalid'

version_resource="$(printf '%s' "${token}" \
  | gcloud secrets versions add "${SECRET_NAME}" \
      --project="${PROJECT_ID}" --data-file=- --format='value(name)')"
unset token

[[ "${version_resource}" =~ ^projects/${PROJECT_NUMBER}/secrets/${SECRET_NAME}/versions/[1-9][0-9]*$ ]] \
  || fail 'Secret Manager did not return the expected version resource'
version_number="${version_resource##*/}"
[[ "$(gcloud secrets versions describe "${version_number}" \
  --secret="${SECRET_NAME}" --project="${PROJECT_ID}" \
  --format='value(state)')" == 'ENABLED' ]] \
  || fail 'the new secret version did not reread as enabled'

printf '%s\n' '{'
printf '  "operation":"weeditpro_sam31_hugging_face_token_version_v1",\n'
printf '  "secretResource":"projects/%s/secrets/%s/versions/%s",\n' \
  "${PROJECT_ID}" "${SECRET_NAME}" "${version_number}"
printf '  "secretValuePrinted":false,\n'
printf '  "secretValueWrittenToDeveloperDisk":false,\n'
printf '  "modelOrCheckpointDownloaded":false,\n'
printf '  "modelInstalledOnDeveloperMachine":false,\n'
printf '  "gpuJobStarted":false,\n'
printf '  "customerCreditsMutated":false,\n'
printf '  "productionAuthorityGranted":false\n'
printf '%s\n' '}'
