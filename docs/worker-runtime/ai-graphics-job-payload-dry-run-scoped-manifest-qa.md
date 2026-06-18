# AI Graphics Job Payload Dry-Run Scoped Manifest QA

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_qa_passed_with_warnings`

Scoped manifest mapping is `accepted_with_warnings`. The QA boundary requires placeholder-only refs such as `<SCOPED_TOOL_CALL_MANIFEST_REF>`, metadata/manifest-only intake, and fail-closed handling when a payload attempts route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, or public artifact creation.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
