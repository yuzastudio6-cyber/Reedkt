# AI Graphics Job Payload Scoped Manifest Owner Review

Decision: `worker_ai_graphics_metadata_job_payload_owner_review_after_dry_run_passed_with_warnings`

Scoped manifest owner review: `accepted_with_warnings`.

Owner requirements:
- Keep scoped manifest refs placeholder-only, including `<SCOPED_TOOL_CALL_MANIFEST_REF>`.
- Preserve metadata/manifest-only intake.
- Fail closed when a payload attempts route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, or public artifact creation.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
