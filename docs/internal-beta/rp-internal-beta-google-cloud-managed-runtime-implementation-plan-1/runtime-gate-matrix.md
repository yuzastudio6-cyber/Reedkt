# RP-INTERNAL-BETA Google Cloud Managed Runtime Gate Matrix

Decision: `completed_google_cloud_managed_runtime_implementation_plan_ready_for_guarded_runtime_scaffold_sequence`

Execution: `completed_docs_only_google_cloud_managed_runtime_implementation_plan_no_runtime_execution`

| Gate | Planned implementation packet | Current status |
| --- | --- | --- |
| Google Cloud environment naming | `RP-INTERNAL-BETA-GOOGLE-CLOUD-ENVIRONMENT-BOUNDARY-1` | `blocked_pending_owner_environment_names` |
| Supabase target and RLS/storage validation | `RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1` | `blocked_pending_named_supabase_target` |
| Secret Manager naming and access policy | `RP-INTERNAL-BETA-SECRET-BOUNDARY-PLAN-1` | `planned_names_only_no_payload_access` |
| Service-role API runtime | `RP-INTERNAL-BETA-SERVICE-ROLE-API-RUNTIME-1` | `blocked_pending_target_and_database_validation` |
| Approved snapshot persistence runtime | `RP-INTERNAL-BETA-APPROVED-SNAPSHOT-PERSISTENCE-RUNTIME-1` | `blocked_pending_service_role_runtime` |
| Credit reservation/release/refund runtime | `RP-INTERNAL-BETA-CREDIT-LEDGER-RUNTIME-1` | `blocked_pending_service_role_runtime` |
| Job queue and worker lease runtime | `RP-INTERNAL-BETA-JOB-QUEUE-WORKER-LEASE-RUNTIME-1` | `blocked_pending_service_role_runtime` |
| Private artifact manifest runtime | `RP-INTERNAL-BETA-PRIVATE-ARTIFACT-MANIFEST-RUNTIME-1` | `blocked_pending_storage_target_policy` |
| Private artifact access policy | `RP-INTERNAL-BETA-PRIVATE-ARTIFACT-ACCESS-POLICY-1` | `blocked_pending_signed_url_policy_or_rejection` |
| Remotion private preview/export runtime | `RP-INTERNAL-BETA-REMOTION-PRIVATE-PREVIEW-RUNTIME-1` | `blocked_pending_snapshot_credit_job_artifact_runtime` |
| Provider/model adapter runtime | `RP-INTERNAL-BETA-PROVIDER-ADAPTER-RUNTIME-1` | `blocked_pending_provider_owner_approval_and_secret_policy` |
| QA/readback/cleanup runtime | `RP-INTERNAL-BETA-QA-CLEANUP-RUNTIME-1` | `blocked_pending_artifact_manifest_and_render_runtime` |
| Internal beta E2E execution | `RP-INTERNAL-BETA-GOOGLE-CLOUD-MANAGED-E2E-VALIDATION-1` | `blocked_pending_all_runtime_gates` |

## Non-Approvals

- Remote Supabase mutation approval: `not_approved_in_this_packet`
- SQL execution approval: `not_approved_in_this_packet`
- Service-role route execution approval: `not_approved_in_this_packet`
- Credit reservation approval: `not_approved_in_this_packet`
- Job enqueue approval: `not_approved_in_this_packet`
- Worker dispatch approval: `not_approved_in_this_packet`
- GCS object access approval: `not_approved_in_this_packet`
- Signed URL creation approval: `not_approved_in_this_packet`
- Remotion execution approval: `not_approved_in_this_packet`
- Provider/model call approval: `not_approved_in_this_packet`
- Deployment approval: `not_approved_in_this_packet`
- Internal beta unlock approval: `not_approved_in_this_packet`
