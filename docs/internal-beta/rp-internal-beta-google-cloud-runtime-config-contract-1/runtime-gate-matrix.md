# Runtime Gate Matrix

Packet: `RP-INTERNAL-BETA-GOOGLE-CLOUD-RUNTIME-CONFIG-CONTRACT-1`

Decision: `completed_backend_only_google_cloud_runtime_config_contract_no_runtime_execution`

| Gate | Status |
| --- | --- |
| Google Cloud project names | `source_configured_reeditpro` |
| Runtime regions | `source_configured_us_east1_and_europe_west1` |
| Staging activation region | `source_configured_us_central1` |
| Cloud Run service/job names | `source_configured_no_creation` |
| Service accounts | `source_configured_no_iam_mutation` |
| Secret Manager references | `source_configured_reference_names_only_no_payload_access` |
| Private bucket names | `source_configured_no_gcs_access` |
| Supabase target project | `source_reference_names_recorded_no_remote_target_selected` |
| Supabase RLS/storage validation | `not_run` |
| Service-role route runtime | `blocked_pending_supabase_target_rls_storage_validation` |
| Approved snapshot persistence | `not_implemented` |
| Credit ledger runtime | `not_implemented` |
| Job queue runtime | `not_implemented` |
| Worker dispatch | `not_implemented` |
| Private artifact access | `not_implemented` |
| Remotion render worker | `not_enabled` |
| Provider/model calls | `not_approved` |
| Internal beta unlock | `false` |

## Disabled Reasons

- `supabase_target_not_validated`
- `service_role_routes_not_implemented`
- `credit_ledger_not_implemented`
- `job_queue_not_implemented`
- `worker_dispatch_not_implemented`
- `private_artifact_access_not_implemented`
- `render_worker_not_enabled`
- `provider_model_calls_not_approved`
- `deployment_not_approved`
