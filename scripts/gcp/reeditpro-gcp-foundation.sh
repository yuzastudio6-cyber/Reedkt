#!/usr/bin/env bash

# ReeditPro RP-GCP-01 Google Cloud foundation setup
# Creates APIs, Artifact Registry, service accounts, regional GCS buckets,
# Secret Manager placeholders, Pub/Sub topics, Cloud Tasks queues, and basic IAM.
# It does NOT deploy Cloud Run services/jobs, run providers, render media, or store real secrets.

set -uo pipefail

PROJECT_ID="${1:-${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || true)}}"
US_REGION="${US_REGION:-us-east1}"
EU_REGION="${EU_REGION:-europe-west1}"
ARTIFACT_REPO="${ARTIFACT_REPO:-reeditpro-runtime}"
BUCKET_PREFIX="${BUCKET_PREFIX:-reeditpro-prod-${PROJECT_ID}}"
LOG_FILE="${LOG_FILE:-$HOME/reeditpro-gcp-foundation-$(date +%Y%m%d-%H%M%S).log}"

if [[ -z "${PROJECT_ID}" || "${PROJECT_ID}" == "(unset)" || "${PROJECT_ID}" == "YOUR_PROJECT_ID_HERE" ]]; then
  echo "ERROR: No valid Google Cloud project detected."
  echo "Run: gcloud config set project reeditpro"
  echo "Then run this script again."
  exit 1
fi

exec > >(tee -a "$LOG_FILE") 2>&1

echo "============================================================"
echo "ReeditPro RP-GCP-01 foundation setup"
echo "============================================================"
echo "Project:       $PROJECT_ID"
echo "US region:     $US_REGION"
echo "EU region:     $EU_REGION"
echo "Artifact repo: $ARTIFACT_REPO"
echo "Bucket prefix: $BUCKET_PREFIX"
echo "Log file:      $LOG_FILE"
echo "============================================================"

gcloud config set project "$PROJECT_ID" --quiet >/dev/null

BILLING_ENABLED="$(gcloud billing projects describe "$PROJECT_ID" --format='value(billingEnabled)' 2>/dev/null || echo "False")"
if [[ "$BILLING_ENABLED" != "True" && "$BILLING_ENABLED" != "true" ]]; then
  echo "ERROR: Billing is not enabled for project '$PROJECT_ID'."
  echo "Open Google Cloud Console → Billing → link a billing account to '$PROJECT_ID'."
  echo "Then rerun this script."
  exit 1
fi

run_cmd() {
  echo ""
  echo "→ $*"
  "$@"
}

ensure_api() {
  local api="$1"
  if gcloud services list --enabled --filter="config.name:${api}" --format='value(config.name)' | grep -qx "$api"; then
    echo "API already enabled: $api"
  else
    run_cmd gcloud services enable "$api" --quiet
  fi
}

ensure_artifact_repo() {
  local region="$1"
  if gcloud artifacts repositories describe "$ARTIFACT_REPO" --location="$region" >/dev/null 2>&1; then
    echo "Artifact Registry repo exists in $region: $ARTIFACT_REPO"
  else
    run_cmd gcloud artifacts repositories create "$ARTIFACT_REPO" --repository-format=docker --location="$region" --description="ReeditPro runtime images for $region"
  fi
}

ensure_sa() {
  local name="$1"
  local display="$2"
  local email="${name}@${PROJECT_ID}.iam.gserviceaccount.com"
  if gcloud iam service-accounts describe "$email" >/dev/null 2>&1; then
    echo "Service account exists: $name"
  else
    echo "Creating service account: $name"
    # Slow down slightly to avoid per-minute service-account creation quota.
    sleep 7
    gcloud iam service-accounts create "$name" --display-name="$display" --description="$display for ReeditPro production runtime" || true
  fi
}

bucket_name() {
  local region="$1"
  local purpose="$2"
  echo "${BUCKET_PREFIX}-${region}-${purpose}"
}

ensure_bucket() {
  local region="$1"
  local purpose="$2"
  local bucket
  bucket="$(bucket_name "$region" "$purpose")"

  if gcloud storage buckets describe "gs://${bucket}" >/dev/null 2>&1; then
    echo "Bucket exists: gs://${bucket}"
  else
    run_cmd gcloud storage buckets create "gs://${bucket}" --project="$PROJECT_ID" --location="$region" --default-storage-class=STANDARD --uniform-bucket-level-access
  fi

  gcloud storage buckets update "gs://${bucket}" --public-access-prevention=enforced >/dev/null 2>&1 || true
}

ensure_secret() {
  local secret="$1"
  if gcloud secrets describe "$secret" >/dev/null 2>&1; then
    echo "Secret placeholder exists: $secret"
  else
    run_cmd gcloud secrets create "$secret" --replication-policy=automatic
  fi
}

ensure_topic() {
  local topic="$1"
  if gcloud pubsub topics describe "$topic" >/dev/null 2>&1; then
    echo "Pub/Sub topic exists: $topic"
  else
    run_cmd gcloud pubsub topics create "$topic"
  fi
}

ensure_queue() {
  local region="$1"
  local queue="$2"
  if gcloud tasks queues describe "$queue" --location="$region" >/dev/null 2>&1; then
    echo "Cloud Tasks queue exists in $region: $queue"
  else
    run_cmd gcloud tasks queues create "$queue" --location="$region" --max-dispatches-per-second=5 --max-concurrent-dispatches=10 --max-attempts=3
  fi
}

grantee_email() {
  local sa="$1"
  echo "${sa}@${PROJECT_ID}.iam.gserviceaccount.com"
}

grant_project_role() {
  local sa="$1"
  local role="$2"
  gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$(grantee_email "$sa")" --role="$role" --quiet >/dev/null 2>&1 || true
}

grant_secret_access() {
  local secret="$1"
  local sa="$2"
  gcloud secrets add-iam-policy-binding "$secret" --member="serviceAccount:$(grantee_email "$sa")" --role="roles/secretmanager.secretAccessor" --quiet >/dev/null 2>&1 || true
}

grant_bucket_role() {
  local region="$1"
  local purpose="$2"
  local sa="$3"
  local role="$4"
  local bucket
  bucket="$(bucket_name "$region" "$purpose")"
  gcloud storage buckets add-iam-policy-binding "gs://${bucket}" --member="serviceAccount:$(grantee_email "$sa")" --role="$role" --quiet >/dev/null 2>&1 || true
}

echo ""
echo "=== 1. Enable APIs ==="
APIS=(
  serviceusage.googleapis.com
  run.googleapis.com
  artifactregistry.googleapis.com
  cloudbuild.googleapis.com
  storage.googleapis.com
  secretmanager.googleapis.com
  workflows.googleapis.com
  cloudtasks.googleapis.com
  pubsub.googleapis.com
  logging.googleapis.com
  monitoring.googleapis.com
  iam.googleapis.com
  iamcredentials.googleapis.com
  cloudresourcemanager.googleapis.com
)
for api in "${APIS[@]}"; do
  ensure_api "$api"
done

echo ""
echo "=== 2. Artifact Registry ==="
ensure_artifact_repo "$US_REGION"
ensure_artifact_repo "$EU_REGION"

echo ""
echo "=== 3. Service accounts ==="
SERVICE_ACCOUNTS=(
  "sa-api-orchestrator:ReeditPro API Orchestrator"
  "sa-provider-gateway:ReeditPro Provider Gateway"
  "sa-signed-url-service:ReeditPro Signed URL Service"
  "sa-media-analysis-worker:ReeditPro Media Analysis Worker"
  "sa-ffmpeg-media-worker:ReeditPro FFmpeg Media Worker"
  "sa-audio-soundsync-worker:ReeditPro Audio SoundSync Worker"
  "sa-browser-capture-worker:ReeditPro Browser Capture Worker"
  "sa-image-asset-worker:ReeditPro Image Asset Worker"
  "sa-ai-video-asset-worker:ReeditPro AI Video Asset Worker"
  "sa-remotion-render-worker:ReeditPro Remotion Render Worker"
  "sa-qa-worker:ReeditPro QA Worker"
  "sa-export-worker:ReeditPro Export Worker"
)
for entry in "${SERVICE_ACCOUNTS[@]}"; do
  ensure_sa "${entry%%:*}" "${entry#*:}"
done

echo ""
echo "=== 4. Regional GCS buckets ==="
PURPOSES=(source-media generated-assets processed-media previews exports thumbnails qa-artifacts worker-temp)
for region in "$US_REGION" "$EU_REGION"; do
  for purpose in "${PURPOSES[@]}"; do
    ensure_bucket "$region" "$purpose"
  done
done

echo ""
echo "=== 5. Secret Manager placeholders ==="
SECRETS=(
  reeditpro-prod-supabase-url
  reeditpro-prod-supabase-service-role-key
  reeditpro-prod-openai-api-key
  reeditpro-prod-wan-api-key
  reeditpro-prod-hailuo-api-key
  reeditpro-prod-veo-vertex-config
  reeditpro-prod-lyria-api-key
  reeditpro-prod-provider-webhook-signing-secret
  reeditpro-prod-stripe-webhook-secret
)
for secret in "${SECRETS[@]}"; do
  ensure_secret "$secret"
done

echo ""
echo "=== 6. Pub/Sub topics ==="
TOPICS=(
  reeditpro-job-events
  reeditpro-worker-events
  reeditpro-provider-events
  reeditpro-render-events
  reeditpro-qa-events
  reeditpro-dead-letter
)
for topic in "${TOPICS[@]}"; do
  ensure_topic "$topic"
done

echo ""
echo "=== 7. Cloud Tasks queues ==="
QUEUES=(
  reeditpro-provider-calls
  reeditpro-worker-dispatch
  reeditpro-render-dispatch
  reeditpro-webhooks
  reeditpro-status-sync
)
for region in "$US_REGION" "$EU_REGION"; do
  for queue in "${QUEUES[@]}"; do
    ensure_queue "$region" "$queue"
  done
done

echo ""
echo "=== 8. Basic IAM bindings ==="
ALL_RUNTIME_SAS=(
  sa-api-orchestrator
  sa-provider-gateway
  sa-signed-url-service
  sa-media-analysis-worker
  sa-ffmpeg-media-worker
  sa-audio-soundsync-worker
  sa-browser-capture-worker
  sa-image-asset-worker
  sa-ai-video-asset-worker
  sa-remotion-render-worker
  sa-qa-worker
  sa-export-worker
)
for sa in "${ALL_RUNTIME_SAS[@]}"; do
  grant_project_role "$sa" roles/logging.logWriter
  grant_project_role "$sa" roles/monitoring.metricWriter
done

grant_project_role sa-api-orchestrator roles/cloudtasks.enqueuer
grant_project_role sa-api-orchestrator roles/pubsub.publisher
grant_project_role sa-api-orchestrator roles/pubsub.subscriber
grant_project_role sa-api-orchestrator roles/workflows.invoker

for sa in sa-provider-gateway sa-media-analysis-worker sa-ffmpeg-media-worker sa-audio-soundsync-worker sa-browser-capture-worker sa-image-asset-worker sa-ai-video-asset-worker sa-remotion-render-worker sa-qa-worker sa-export-worker; do
  grant_project_role "$sa" roles/pubsub.publisher
done

# Allow signed-url service to mint signed URLs through IAM Credentials later.
gcloud iam service-accounts add-iam-policy-binding "$(grantee_email sa-signed-url-service)" --member="serviceAccount:$(grantee_email sa-signed-url-service)" --role="roles/iam.serviceAccountTokenCreator" --quiet >/dev/null 2>&1 || true

echo ""
echo "=== 9. Secret access IAM ==="
for sa in sa-api-orchestrator sa-provider-gateway sa-media-analysis-worker sa-ffmpeg-media-worker sa-audio-soundsync-worker sa-browser-capture-worker sa-image-asset-worker sa-ai-video-asset-worker sa-remotion-render-worker sa-qa-worker sa-export-worker; do
  grant_secret_access reeditpro-prod-supabase-url "$sa"
  grant_secret_access reeditpro-prod-supabase-service-role-key "$sa"
done

for secret in reeditpro-prod-openai-api-key reeditpro-prod-wan-api-key reeditpro-prod-hailuo-api-key reeditpro-prod-veo-vertex-config reeditpro-prod-provider-webhook-signing-secret; do
  grant_secret_access "$secret" sa-provider-gateway
  grant_secret_access "$secret" sa-image-asset-worker
  grant_secret_access "$secret" sa-ai-video-asset-worker
done

grant_secret_access reeditpro-prod-lyria-api-key sa-provider-gateway
grant_secret_access reeditpro-prod-lyria-api-key sa-audio-soundsync-worker
grant_secret_access reeditpro-prod-stripe-webhook-secret sa-api-orchestrator

echo ""
echo "=== 10. Bucket IAM ==="
for region in "$US_REGION" "$EU_REGION"; do
  grant_bucket_role "$region" source-media sa-signed-url-service roles/storage.objectAdmin
  grant_bucket_role "$region" source-media sa-api-orchestrator roles/storage.objectViewer
  grant_bucket_role "$region" source-media sa-media-analysis-worker roles/storage.objectViewer
  grant_bucket_role "$region" source-media sa-ffmpeg-media-worker roles/storage.objectViewer
  grant_bucket_role "$region" source-media sa-audio-soundsync-worker roles/storage.objectViewer
  grant_bucket_role "$region" source-media sa-remotion-render-worker roles/storage.objectViewer

  grant_bucket_role "$region" generated-assets sa-image-asset-worker roles/storage.objectAdmin
  grant_bucket_role "$region" generated-assets sa-ai-video-asset-worker roles/storage.objectAdmin
  grant_bucket_role "$region" generated-assets sa-provider-gateway roles/storage.objectViewer
  grant_bucket_role "$region" generated-assets sa-remotion-render-worker roles/storage.objectViewer
  grant_bucket_role "$region" generated-assets sa-qa-worker roles/storage.objectViewer
  grant_bucket_role "$region" generated-assets sa-export-worker roles/storage.objectViewer

  grant_bucket_role "$region" processed-media sa-ffmpeg-media-worker roles/storage.objectAdmin
  grant_bucket_role "$region" processed-media sa-audio-soundsync-worker roles/storage.objectAdmin
  grant_bucket_role "$region" processed-media sa-remotion-render-worker roles/storage.objectViewer
  grant_bucket_role "$region" processed-media sa-qa-worker roles/storage.objectViewer
  grant_bucket_role "$region" processed-media sa-export-worker roles/storage.objectViewer

  grant_bucket_role "$region" previews sa-remotion-render-worker roles/storage.objectAdmin
  grant_bucket_role "$region" previews sa-qa-worker roles/storage.objectViewer
  grant_bucket_role "$region" previews sa-signed-url-service roles/storage.objectViewer
  grant_bucket_role "$region" previews sa-api-orchestrator roles/storage.objectViewer

  grant_bucket_role "$region" exports sa-export-worker roles/storage.objectAdmin
  grant_bucket_role "$region" exports sa-remotion-render-worker roles/storage.objectAdmin
  grant_bucket_role "$region" exports sa-qa-worker roles/storage.objectViewer
  grant_bucket_role "$region" exports sa-signed-url-service roles/storage.objectViewer
  grant_bucket_role "$region" exports sa-api-orchestrator roles/storage.objectViewer

  grant_bucket_role "$region" thumbnails sa-remotion-render-worker roles/storage.objectAdmin
  grant_bucket_role "$region" thumbnails sa-export-worker roles/storage.objectAdmin
  grant_bucket_role "$region" thumbnails sa-signed-url-service roles/storage.objectViewer
  grant_bucket_role "$region" thumbnails sa-api-orchestrator roles/storage.objectViewer

  grant_bucket_role "$region" qa-artifacts sa-qa-worker roles/storage.objectAdmin
  grant_bucket_role "$region" qa-artifacts sa-api-orchestrator roles/storage.objectViewer

  for sa in sa-media-analysis-worker sa-ffmpeg-media-worker sa-audio-soundsync-worker sa-browser-capture-worker sa-image-asset-worker sa-ai-video-asset-worker sa-remotion-render-worker sa-qa-worker sa-export-worker; do
    grant_bucket_role "$region" worker-temp "$sa" roles/storage.objectAdmin
  done
done

echo ""
echo "============================================================"
echo "REEDITPRO_GCP_FOUNDATION_DONE"
echo "============================================================"
echo "Project: $PROJECT_ID"
echo "Log file: $LOG_FILE"
echo ""
echo "Artifact Registry repos:"
gcloud artifacts repositories list --location="$US_REGION" --filter="name:$ARTIFACT_REPO" --format="table(name,format,location)"
gcloud artifacts repositories list --location="$EU_REGION" --filter="name:$ARTIFACT_REPO" --format="table(name,format,location)"
echo ""
echo "Service accounts:"
gcloud iam service-accounts list --filter="email~sa-.*@${PROJECT_ID}.iam.gserviceaccount.com" --format="table(email,displayName)"
echo ""
echo "Buckets:"
gcloud storage buckets list --filter="name:${BUCKET_PREFIX}" --format="table(name,location)"
echo ""
echo "Secrets:"
gcloud secrets list --filter="name:reeditpro-prod" --format="table(name)"
echo ""
echo "Pub/Sub topics:"
gcloud pubsub topics list --filter="name:reeditpro" --format="table(name)"
echo ""
echo "Cloud Tasks queues:"
gcloud tasks queues list --location="$US_REGION" --filter="name:reeditpro" --format="table(name,state)"
gcloud tasks queues list --location="$EU_REGION" --filter="name:reeditpro" --format="table(name,state)"
echo ""
echo "Next: send the output from REEDITPRO_GCP_FOUNDATION_DONE down to the end."
