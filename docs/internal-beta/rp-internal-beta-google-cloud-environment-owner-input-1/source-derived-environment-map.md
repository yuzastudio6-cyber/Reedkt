# Source-Derived Google Cloud Environment Map

Packet: `RP-INTERNAL-BETA-GOOGLE-CLOUD-ENVIRONMENT-OWNER-INPUT-1`

Decision: `completed_source_derived_google_cloud_environment_names_for_internal_beta_planning`

Environment boundary status: `source_derived_environment_names_recorded`

Readiness: `ready_for_internal_beta_runtime_config_contract_scaffold`

Internal beta end-to-end status: `not_ready_pending_backend_supabase_storage_worker_implementation`

Product-ready end-to-end local OSS tools: `0`

## Project And Regions

- Google Cloud project ID: `reeditpro`
- Primary runtime region: `us-east1`
- Secondary runtime region: `europe-west1`
- Staging activation region: `us-central1`
- Environment class: `google_cloud_managed_internal_beta`

The checked-in production live resource map names `reeditpro` with `us-east1` and `europe-west1` regional production foundation resources. Existing staging activation policy names `reeditpro/us-central1` for the private SearXNG service.

## Cloud Run Service Names

- Backend API service template: `reeditpro-api`
- Existing staging private service target: `reeditpro-staging-private-searxng`
- Production plan service templates: `api-orchestrator-service`, `provider-gateway-service`, `signed-url-service`

The existing staging private SearXNG service is web-search activation evidence only. It is not the internal beta editing API and does not unlock runtime execution.

## Cloud Run Worker Job Names

Production typed templates:

- `reeditpro-cpu-analysis-worker`
- `reeditpro-gpu-ai-worker`
- `reeditpro-render-worker`
- `reeditpro-qa-worker`
- `reeditpro-tool-readiness-worker`

Production resource-plan job names:

- `media-analysis-worker-job`
- `ffmpeg-media-worker-job`
- `audio-soundsync-worker-job`
- `browser-capture-worker-job`
- `image-asset-worker-job`
- `ai-video-asset-worker-job`
- `remotion-render-worker-job`
- `qa-worker-job`
- `export-worker-job`

No Cloud Run job was created or executed in this phase.

## Service Accounts

Live resource map service accounts:

- `sa-api-orchestrator@reeditpro.iam.gserviceaccount.com`
- `sa-provider-gateway@reeditpro.iam.gserviceaccount.com`
- `sa-signed-url-service@reeditpro.iam.gserviceaccount.com`
- `sa-media-analysis-worker@reeditpro.iam.gserviceaccount.com`
- `sa-ffmpeg-media-worker@reeditpro.iam.gserviceaccount.com`
- `sa-audio-soundsync-worker@reeditpro.iam.gserviceaccount.com`
- `sa-browser-capture-worker@reeditpro.iam.gserviceaccount.com`
- `sa-image-asset-worker@reeditpro.iam.gserviceaccount.com`
- `sa-ai-video-asset-worker@reeditpro.iam.gserviceaccount.com`
- `sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com`
- `sa-qa-worker@reeditpro.iam.gserviceaccount.com`
- `sa-export-worker@reeditpro.iam.gserviceaccount.com`

Existing staging activation service account:

- `reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com`

No IAM mutation occurred in this phase.

## Private Buckets

Production live resource map, `us-east1`:

- `reeditpro-prod-reeditpro-us-east1-source-media`
- `reeditpro-prod-reeditpro-us-east1-generated-assets`
- `reeditpro-prod-reeditpro-us-east1-processed-media`
- `reeditpro-prod-reeditpro-us-east1-previews`
- `reeditpro-prod-reeditpro-us-east1-exports`
- `reeditpro-prod-reeditpro-us-east1-thumbnails`
- `reeditpro-prod-reeditpro-us-east1-qa-artifacts`
- `reeditpro-prod-reeditpro-us-east1-worker-temp`

Production live resource map, `europe-west1`:

- `reeditpro-prod-reeditpro-europe-west1-source-media`
- `reeditpro-prod-reeditpro-europe-west1-generated-assets`
- `reeditpro-prod-reeditpro-europe-west1-processed-media`
- `reeditpro-prod-reeditpro-europe-west1-previews`
- `reeditpro-prod-reeditpro-europe-west1-exports`
- `reeditpro-prod-reeditpro-europe-west1-thumbnails`
- `reeditpro-prod-reeditpro-europe-west1-qa-artifacts`
- `reeditpro-prod-reeditpro-europe-west1-worker-temp`

Existing staging activation buckets:

- `reeditpro-staging-reeditpro-generated-assets`
- `reeditpro-staging-reeditpro-qa-artifacts`

No GCS bucket or object was created, read, or mutated in this phase.

## Secret Manager Reference Names

Live resource map / secret plan reference names:

- `reeditpro-prod-supabase-url`
- `reeditpro-prod-supabase-service-role-key`
- `reeditpro-prod-openai-api-key`
- `reeditpro-prod-wan-api-key`
- `reeditpro-prod-hailuo-api-key`
- `reeditpro-prod-veo-vertex-config`
- `reeditpro-prod-lyria-api-key`
- `reeditpro-prod-mirelo-api-key`
- `reeditpro-prod-mmaudio-api-key`
- `reeditpro-prod-provider-webhook-signing-secret`
- `reeditpro-prod-stripe-webhook-secret`

Logical backend placeholders:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `PROVIDER_GATEWAY_SHARED_SECRET`
- `WORKER_WEBHOOK_SECRET`

Reference names are source metadata only. Secret payload access was not performed.

## Queues And Topics

Pub/Sub topics:

- `projects/reeditpro/topics/reeditpro-job-events`
- `projects/reeditpro/topics/reeditpro-worker-events`
- `projects/reeditpro/topics/reeditpro-provider-events`
- `projects/reeditpro/topics/reeditpro-render-events`
- `projects/reeditpro/topics/reeditpro-qa-events`
- `projects/reeditpro/topics/reeditpro-dead-letter`

Cloud Tasks queues in both `us-east1` and `europe-west1`:

- `reeditpro-provider-calls`
- `reeditpro-worker-dispatch`
- `reeditpro-render-dispatch`
- `reeditpro-webhooks`
- `reeditpro-status-sync`

No queue, topic, task, or event write occurred in this phase.
