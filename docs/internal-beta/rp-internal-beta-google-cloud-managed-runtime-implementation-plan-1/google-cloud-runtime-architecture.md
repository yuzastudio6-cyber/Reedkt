# RP-INTERNAL-BETA Google Cloud Managed Runtime Architecture

Decision: `completed_google_cloud_managed_runtime_implementation_plan_ready_for_guarded_runtime_scaffold_sequence`

Execution: `completed_docs_only_google_cloud_managed_runtime_implementation_plan_no_runtime_execution`

Approved runtime target: `google_cloud_managed_runtime_target`

Runtime implementation scope: `architecture_plan_only_no_cloud_runtime_execution`

## Planned Environment Boundary

- Environment class: `google_cloud_managed_internal_beta`
- Google Cloud project ID: `not_named_pending_owner_environment_packet`
- Region: `not_named_pending_owner_environment_packet`
- Cloud Run services: `planned_not_created`
- Cloud Run jobs: `planned_not_created`
- GCS buckets: `planned_not_created`
- Secret Manager secrets: `planned_names_only_no_payload_access`
- Supabase target: `not_named_pending_owner_environment_packet`
- Deployment status: `not_run`

## Planned Service Topology

| Component | Future responsibility | Current status |
| --- | --- | --- |
| Internal beta API service | backend-only service-role route handlers for approved-session, approval, credit, job, artifact, and QA contracts | `planned_not_created` |
| Worker dispatcher | validates approved snapshot, credit reservation, idempotency key, and job lease before worker launch | `planned_not_created` |
| Render worker job | executes approved Remotion preview/export path after render gate and private artifact policy pass | `planned_not_created` |
| Tool/media worker job | future bounded tool execution only after tool-specific proof and approved snapshot | `planned_not_created` |
| QA/cleanup worker job | validates manifest, checksums, QA report, cleanup, and retry/fallback status | `planned_not_created` |
| Provider adapter boundary | backend-only disabled-by-default provider calls with secret and cost controls | `planned_not_created` |

## Planned Storage Topology

| Storage class | Future use | Current status |
| --- | --- | --- |
| `source-media` | private uploaded media | `planned_not_created` |
| `generated-assets` | provider/tool generated assets | `planned_not_created` |
| `processed-media` | worker processed intermediates | `planned_not_created` |
| `previews` | private internal beta previews | `planned_not_created` |
| `exports` | private export records after QA | `planned_not_created` |
| `qa-artifacts` | private QA report evidence | `planned_not_created` |
| `worker-temp` | short-lived worker scratch outputs | `planned_not_created` |

Storage object creation: `false`

Storage object read: `false`

GCS object access: `none`

Signed URL creation: `false`

Public artifact creation: `false`

## Planned IAM Boundary

Future IAM must be least-privilege and split by runtime role:

- API service account: service-role backend mutation boundary, no broad storage admin.
- Worker dispatcher account: enqueue/launch approved jobs only.
- Render worker account: read approved snapshot inputs and write private manifest artifacts only.
- QA/cleanup account: read private artifacts, write QA/cleanup records, no provider secrets unless explicitly approved.
- Provider adapter account: read only provider-specific secret names after provider runtime approval.

Service account creation: `not_run`

IAM mutation: `not_run`

Secret Manager payload access: `none`
