# AI Graphics Job Payload Dry-Run Fail Closed Policy

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_approved_with_warnings`

Future dry-run validation must fail closed for missing placeholders, unknown tools, unsafe runtime claims, true runtime booleans, URLs, signed URL markers, public artifact refs, raw prompt text, secrets, real user data, provider raw output, unscoped artifact paths, generated output paths, executable route/tool/worker/provider instructions, or any attempt to treat public delivery as source of truth.

Fail-closed evidence may be local/static only. It must not trigger worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL, GCS, signed URLs, public artifacts, beta, or production.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
