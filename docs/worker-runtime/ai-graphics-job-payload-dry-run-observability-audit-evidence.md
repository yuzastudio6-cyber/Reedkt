# AI Graphics Job Payload Dry-Run Observability Audit Evidence

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_passed_with_warnings`

The dry-run accepted sanitized local/static observability placeholders only.

| Field | Required Value | Result |
| --- | --- | --- |
| observabilityAuditRef | `<OBSERVABILITY_AUDIT_REF>` | `passed_with_warnings` |
| local evidence path | `.local-artifacts/worker-runtime/ai-graphics-job-payload-dry-run/ai-graphics-job-payload-dry-run-local-static/` | `passed_with_warnings` |
| committed local artifacts | `false` | `passed_with_warnings` |

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
