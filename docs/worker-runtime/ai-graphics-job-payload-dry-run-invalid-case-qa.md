# AI Graphics Job Payload Dry-Run Invalid Case QA

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_qa_passed_with_warnings`

PR #500 invalid-case evidence is `accepted_with_warnings`. The invalid case requires missing, malformed, unsafe, unscoped, or executable-looking payload values to fail closed without worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider calls, Supabase mutation, or public artifact creation.

Invalid-case QA covers all 13 accepted tools and preserves placeholder-only source-of-truth boundaries.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
