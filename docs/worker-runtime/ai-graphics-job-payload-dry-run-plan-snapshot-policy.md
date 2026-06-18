# AI Graphics Job Payload Dry-Run Plan Snapshot Policy

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_approved_with_warnings`

Future dry-run payloads must reference an approved plan snapshot placeholder, not raw chat text and not provider raw output. The placeholder must remain local/static, for example `<APPROVED_PLAN_SNAPSHOT_FIXTURE>`, and must be validated as an identifier boundary rather than executed.

The approved plan snapshot mapping may be checked for presence, placeholder shape, and consistency with the 13-tool worker intake matrix. It may not trigger plan execution, route execution, tool execution, worker execution, provider/model runtime, or credit mutation.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
