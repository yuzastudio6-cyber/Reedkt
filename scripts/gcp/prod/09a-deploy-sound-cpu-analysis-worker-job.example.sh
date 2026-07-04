#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib/gcloud-common.sh
source "${SCRIPT_DIR}/lib/gcloud-common.sh"

# Requires REEDITPRO_CONFIRM_PROD_SETUP=true through confirm_prod_action.
# Human-run template only. Codex must not deploy or execute this job in this gate.
confirm_prod_action

run_gcloud run jobs deploy reeditpro-sound-cpu-analysis-worker \
  --project="${GCP_PROJECT_ID}" \
  --region="${GCP_REGION}" \
  --image="$(artifact_image reeditpro-sound-cpu-analysis-worker)" \
  --service-account="$(service_account_email "${REEDITPRO_CPU_WORKER_SERVICE_ACCOUNT}")" \
  --cpu=2 \
  --memory=4Gi \
  --tasks=1 \
  --parallelism=1 \
  --max-retries=0 \
  --set-env-vars="REEDITPRO_ENV=${REEDITPRO_ENV},WORKER_GROUP=cpu_analysis_worker,SOUND_CPU_WORKER_NAME=sound-cpu-analysis-worker,REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0,REEDITPRO_WORKER_EXECUTION_ENABLED=0,REEDITPRO_MEDIA_PROCESSING_ENABLED=0,REEDITPRO_SUPABASE_MUTATION_ENABLED=0,REEDITPRO_ARTIFACT_WRITE_ENABLED=0"
