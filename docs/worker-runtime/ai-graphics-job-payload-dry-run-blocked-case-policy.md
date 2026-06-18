# AI Graphics Job Payload Dry-Run Blocked Case Policy

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_approved_with_warnings`

Future blocked-case dry-run validation must fail closed for payloads requesting worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URLs, public artifacts, raw prompt execution, internal beta, external beta, production, or broad service-role behavior.

Blocked cases must also reject URLs, signed URL markers, public artifact refs, raw prompt text, secrets, real user data, provider raw output, runtime instructions, unscoped paths, and claims that dry-run or generated local fixture pass status already exists.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
