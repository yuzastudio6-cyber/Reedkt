# RP-INTERNAL-BETA Google Cloud Environment Matrix

| Environment field | Decision | Runtime status |
| --- | --- | --- |
| Google Cloud project ID | `not_supplied` | `not_run` |
| Region | `not_supplied` | `not_run` |
| Environment class | `google_cloud_managed_internal_beta` | `planning_only` |
| Production separation | `required_not_supplied` | `not_run` |
| Cloud Run API service names | `not_supplied` | `not_created` |
| Cloud Run worker job names | `not_supplied` | `not_created` |
| Worker dispatcher name | `not_supplied` | `not_created` |
| Render worker job name | `not_supplied` | `not_created` |
| QA/cleanup worker job name | `not_supplied` | `not_created` |
| Service account names | `not_supplied` | `not_created` |
| IAM bindings | `not_supplied_not_approved` | `not_mutated` |
| Secret Manager secret names | `not_supplied_no_payload_access` | `not_accessed` |
| GCS private artifact bucket names | `not_supplied` | `not_created` |
| Supabase target project | `not_supplied` | `not_touched` |
| Deployment target | `not_supplied_not_approved` | `not_run` |

Environment boundary decision: `blocked_pending_google_cloud_environment_names`

Internal beta end-to-end status: `not_ready_pending_environment_boundary`
