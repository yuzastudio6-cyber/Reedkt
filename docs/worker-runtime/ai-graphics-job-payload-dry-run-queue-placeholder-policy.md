# AI Graphics Job Payload Dry-Run Queue Placeholder Policy

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_approved_with_warnings`

Future dry-run validation may inspect queue placeholders only. It must not enqueue work, dequeue work, claim work, mutate a queue, update queue state, run a worker, or mark any live job complete.

Queue placeholder validation may check placeholder field presence, local/static consistency with plan snapshot and scoped manifest placeholders, and fail-closed handling for missing or unsafe queue fields. `queueExecutionApprovedNow` is `false`.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
