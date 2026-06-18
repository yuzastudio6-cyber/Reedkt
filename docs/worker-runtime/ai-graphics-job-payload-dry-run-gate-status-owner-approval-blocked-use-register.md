# AI Graphics Job Payload Dry-Run Gate Status Owner Approval Blocked-Use Register

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_gate_status_owner_approved_with_warnings`

Blocked uses:

- Dry-run execution rerun.
- Schema validation rerun.
- Worker execution, job claim, lease mutation, and queue execution.
- Route execution and actual tool execution.
- Provider/model runtime.
- Browser/WebGL/canvas runtime.
- Resvg rasterization and Remotion render/export.
- Supabase mutation, SQL execution, GCS/storage transfer, signed URLs, and public artifacts.
- Raw prompt execution, internal beta, external beta, production, and broad service-role handler enablement.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
