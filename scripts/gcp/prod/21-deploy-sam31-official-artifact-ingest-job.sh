#!/usr/bin/env bash
set -euo pipefail

# Deploys, but never executes, the dedicated cloud-only SAM 3.1 official
# artifact ingest job. The caller must supply an immutable source-bound image,
# one enabled secret version, and one exact canonical human-acceptance object.

readonly PROJECT_ID='reeditpro'
readonly REGION='us-central1'
readonly JOB='weeditpro-sam31-official-artifact-ingest'
readonly SERVICE_ACCOUNT_ID='weeditpro-sam31-ingest-sa'
readonly SERVICE_ACCOUNT="${SERVICE_ACCOUNT_ID}@${PROJECT_ID}.iam.gserviceaccount.com"
readonly MODEL_BUCKET='reeditpro-production-reeditpro-model-artifacts'
readonly CONTROL_BUCKET='reeditpro-production-reeditpro-control-plane-state'
readonly IMAGE_PREFIX="${REGION}-docker.pkg.dev/${PROJECT_ID}/reeditpro-workers/weeditpro-sam31-official-artifact-ingest@sha256:"
readonly TERMS_PREFIX='private/sam3_1/terms-acceptance/v1/'
readonly CONFIRMATION='deploy-weeditpro-sam31-official-artifact-ingest-v1'

fail() {
  printf 'ERROR: %s.\n' "$1" >&2
  exit 1
}

[[ "${WEEDITPRO_CONFIRM_SAM31_ARTIFACT_INGEST_JOB_DEPLOY:-}" \
  == "${CONFIRMATION}" ]] || fail 'exact job-deployment confirmation is missing'
[[ "$(gcloud config get-value project 2>/dev/null)" == "${PROJECT_ID}" ]] \
  || fail 'active Google Cloud project is not the fixed project'

image="${WEEDITPRO_SAM31_ARTIFACT_INGEST_IMAGE:-}"
secret_resource="${WEEDITPRO_SAM31_HF_SECRET_RESOURCE_NAME:-}"
terms_name="${WEEDITPRO_SAM31_TERMS_ACCEPTANCE_OBJECT_NAME:-}"
terms_generation="${WEEDITPRO_SAM31_TERMS_ACCEPTANCE_GENERATION:-}"
terms_etag="${WEEDITPRO_SAM31_TERMS_ACCEPTANCE_ETAG:-}"
terms_length="${WEEDITPRO_SAM31_TERMS_ACCEPTANCE_BYTE_LENGTH:-}"
terms_sha256="${WEEDITPRO_SAM31_TERMS_ACCEPTANCE_SHA256:-}"
publication_attempt="${WEEDITPRO_SAM31_PUBLICATION_ATTEMPT_ID:-}"

[[ "${image}" =~ ^${IMAGE_PREFIX}[a-f0-9]{64}$ ]] \
  || fail 'immutable source-bound image is invalid'
[[ "${secret_resource}" =~ ^projects/${PROJECT_ID}/secrets/(HUGGINGFACE_TOKEN|MODEL_WEIGHT_ACCESS_TOKEN)/versions/[1-9][0-9]*$ ]] \
  || fail 'pinned checkpoint credential version is invalid'
[[ "${terms_name}" == "${TERMS_PREFIX}"*.json \
  && "${terms_name}" != *'..'* \
  && "${terms_name}" != *'\\'* \
  && "${terms_name}" != *'//'* ]] \
  || fail 'canonical terms-acceptance object is invalid'
[[ "${terms_generation}" =~ ^[1-9][0-9]{0,30}$ ]] \
  || fail 'terms generation is invalid'
[[ -n "${terms_etag}" ]] || fail 'terms ETag is missing'
[[ "${terms_length}" =~ ^[1-9][0-9]{0,8}$ \
  && "${terms_length}" -le 524288 ]] || fail 'terms byte length is invalid'
[[ "${terms_sha256}" =~ ^[a-f0-9]{64}$ ]] \
  || fail 'terms SHA-256 is invalid'
[[ "${publication_attempt}" =~ ^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$ \
  && "${publication_attempt}" != *'..'* ]] \
  || fail 'publication attempt identity is invalid'

gcloud artifacts docker images describe "${image}" \
  --project="${PROJECT_ID}" --format=json >/dev/null
secret_name="${secret_resource#projects/${PROJECT_ID}/secrets/}"
secret_name="${secret_name%%/versions/*}"
secret_version="${secret_resource##*/versions/}"
[[ "$(gcloud secrets versions describe "${secret_version}" \
  --secret="${secret_name}" --project="${PROJECT_ID}" \
  --format='value(state)')" == 'ENABLED' ]] \
  || fail 'pinned checkpoint credential version is not enabled'

metadata="$(gcloud storage objects describe \
  "gs://${CONTROL_BUCKET}/${terms_name}#${terms_generation}" \
  --project="${PROJECT_ID}" --format=json)"
[[ "$(jq -r '.generation' <<<"${metadata}")" == "${terms_generation}" \
  && "$(jq -r '.etag' <<<"${metadata}")" == "${terms_etag}" \
  && "$(jq -r '.size' <<<"${metadata}")" == "${terms_length}" \
  && "$(jq -r '.content_type' <<<"${metadata}")" == 'application/json' ]] \
  || fail 'terms-acceptance object metadata changed'
observed_terms_sha256="$(gcloud storage cat \
  "gs://${CONTROL_BUCKET}/${terms_name}#${terms_generation}" \
  --project="${PROJECT_ID}" | shasum -a 256 | awk '{print $1}')"
[[ "${observed_terms_sha256}" == "${terms_sha256}" ]] \
  || fail 'terms-acceptance object bytes changed'

if ! gcloud iam service-accounts describe "${SERVICE_ACCOUNT}" \
  --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud iam service-accounts create "${SERVICE_ACCOUNT_ID}" \
    --project="${PROJECT_ID}" \
    --display-name='WeEditPro SAM 3.1 official artifact ingest' \
    --description='Cloud-only byte-stream ingest; no model inference or media processing'
fi
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role=roles/logging.logWriter --condition=None --quiet >/dev/null
for role in roles/storage.objectCreator roles/storage.objectViewer; do
  gcloud storage buckets add-iam-policy-binding "gs://${MODEL_BUCKET}" \
    --project="${PROJECT_ID}" --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="${role}" --quiet >/dev/null
  gcloud storage buckets add-iam-policy-binding "gs://${CONTROL_BUCKET}" \
    --project="${PROJECT_ID}" --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="${role}" --quiet >/dev/null
done
gcloud secrets add-iam-policy-binding "${secret_name}" \
  --project="${PROJECT_ID}" --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role=roles/secretmanager.secretAccessor --condition=None --quiet >/dev/null

gcloud run jobs deploy "${JOB}" \
  --project="${PROJECT_ID}" --region="${REGION}" \
  --image="${image}" --service-account="${SERVICE_ACCOUNT}" \
  --cpu=2 --memory=4Gi --tasks=1 --parallelism=1 \
  --max-retries=0 --task-timeout=4h --execution-environment=gen2 \
  --set-env-vars="WEEDITPRO_SAM31_OFFICIAL_ARTIFACT_INGEST_CONFIRM=publish-official-sam31-artifacts-once,WEEDITPRO_SAM31_PUBLICATION_ATTEMPT_ID=${publication_attempt},WEEDITPRO_SAM31_HF_SECRET_RESOURCE_NAME=${secret_resource},WEEDITPRO_SAM31_TERMS_ACCEPTANCE_OBJECT_NAME=${terms_name},WEEDITPRO_SAM31_TERMS_ACCEPTANCE_GENERATION=${terms_generation},WEEDITPRO_SAM31_TERMS_ACCEPTANCE_ETAG=${terms_etag},WEEDITPRO_SAM31_TERMS_ACCEPTANCE_BYTE_LENGTH=${terms_length},WEEDITPRO_SAM31_TERMS_ACCEPTANCE_SHA256=${terms_sha256}" \
  --quiet

policy="$(gcloud run jobs get-iam-policy "${JOB}" \
  --project="${PROJECT_ID}" --region="${REGION}" --format=json)"
if jq -e 'any(.bindings[]?.members[]?;
  . == "allUsers" or . == "allAuthenticatedUsers")' \
  <<<"${policy}" >/dev/null; then
  fail 'artifact ingest job has a public IAM principal'
fi

printf '{"operation":"weeditpro_sam31_artifact_ingest_job_deploy_v1",'
printf '"job":"projects/%s/locations/%s/jobs/%s",' \
  "${PROJECT_ID}" "${REGION}" "${JOB}"
printf '"immutableImage":"%s","minimumInstances":0,' "${image}"
printf '"jobExecuted":false,"modelOrCheckpointDownloaded":false,'
printf '"customerCreditsMutated":false,"productionAuthorityGranted":false}\n'
