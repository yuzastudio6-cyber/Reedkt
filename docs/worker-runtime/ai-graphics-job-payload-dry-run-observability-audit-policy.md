# AI Graphics Job Payload Dry-Run Observability Audit Policy

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_approved_with_warnings`

Future dry-run validation may produce local/static observability and audit evidence that records fixture ids, tool ids, owner ids, capability ids, placeholder refs, validation categories, warnings, blockers, and checksum metadata. The evidence must be local and ignored, and committed summaries must remain sanitized.

Observability evidence cannot include secrets, real user data, provider raw output, URLs, signed URLs, public artifact refs, runtime logs from workers/routes/tools/providers, Supabase writes, GCS writes, or beta/production state changes.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
