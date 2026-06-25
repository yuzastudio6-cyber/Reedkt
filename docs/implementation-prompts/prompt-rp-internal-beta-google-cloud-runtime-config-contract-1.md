# RP-INTERNAL-BETA-GOOGLE-CLOUD-RUNTIME-CONFIG-CONTRACT-1

Implement a backend-only runtime configuration contract for the Google Cloud managed internal beta lane.

Source inputs:

- `RP-INTERNAL-BETA-GOOGLE-CLOUD-ENVIRONMENT-OWNER-INPUT-1`
- `docs/internal-beta/rp-internal-beta-google-cloud-environment-owner-input-1/google-cloud-environment-owner-input-record.json`
- `docs/google-cloud/RP-GCP-02-live-resource-map.md`
- `server/config/gcp-production-config.ts`

Required behavior:

- Define typed source/config references for project `reeditpro`, runtime regions `us-east1` and `europe-west1`, staging activation region `us-central1`, service/job names, service accounts, bucket names, queue/topic names, and Secret Manager reference names.
- Keep all values non-secret.
- Keep runtime disabled by default.
- Do not read Secret Manager payloads.
- Do not call Google Cloud APIs.
- Do not mutate Supabase.
- Do not execute SQL.
- Do not deploy Cloud Run.
- Do not enqueue jobs, claim worker leases, execute workers, process media, call providers/models, create signed URLs, create public artifacts, or unlock beta/production.

Expected decision:

`completed_backend_only_google_cloud_runtime_config_contract_no_runtime_execution`

Expected next milestone:

`RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1`
