#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./require-env.sh
source "${SCRIPT_DIR}/require-env.sh"
# shellcheck source=./confirm-prod-action.sh
source "${SCRIPT_DIR}/confirm-prod-action.sh"

required_apis() {
  cat <<'EOF'
run.googleapis.com
artifactregistry.googleapis.com
storage.googleapis.com
secretmanager.googleapis.com
iam.googleapis.com
cloudbuild.googleapis.com
logging.googleapis.com
monitoring.googleapis.com
eventarc.googleapis.com
pubsub.googleapis.com
EOF
}

bucket_purposes() {
  cat <<'EOF'
source-media
proxy-media
analysis-artifacts
transcripts
masks
generated-assets
previews
final-exports
worker-temp
qa-artifacts
EOF
}

bucket_name() {
  local purpose="$1"
  echo "reeditpro-${REEDITPRO_ENV}-${GCP_PROJECT_ID}-${purpose}"
}

service_accounts() {
  cat <<EOF
${REEDITPRO_API_SERVICE_ACCOUNT}:ReeditPro production API service
${REEDITPRO_CPU_WORKER_SERVICE_ACCOUNT}:ReeditPro production CPU analysis worker
${REEDITPRO_GPU_WORKER_SERVICE_ACCOUNT}:ReeditPro production GPU AI worker
${REEDITPRO_RENDER_WORKER_SERVICE_ACCOUNT}:ReeditPro production render worker
${REEDITPRO_QA_WORKER_SERVICE_ACCOUNT}:ReeditPro production QA worker
${REEDITPRO_TOOL_READINESS_SERVICE_ACCOUNT}:ReeditPro production tool readiness worker
EOF
}

secret_placeholders() {
  cat <<'EOF'
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
PROVIDER_GATEWAY_SHARED_SECRET
WORKER_WEBHOOK_SECRET
STRIPE_SECRET_KEY
SFX_PROVIDER_API_KEY
MUSIC_PROVIDER_API_KEY
MODEL_WEIGHT_ACCESS_TOKEN
HUGGINGFACE_TOKEN
EOF
}

service_account_email() {
  local account_id="$1"
  echo "${account_id}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"
}

artifact_image() {
  local image_name="$1"
  echo "${GCP_ARTIFACT_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${REEDITPRO_ARTIFACT_REPOSITORY}/${image_name}:${REEDITPRO_IMAGE_TAG}"
}

run_gcloud() {
  echo ""
  echo "+ gcloud $*"
  gcloud "$@"
}
