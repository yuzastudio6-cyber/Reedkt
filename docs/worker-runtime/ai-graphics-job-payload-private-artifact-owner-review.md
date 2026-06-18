# AI Graphics Job Payload Private Artifact Owner Review

Decision: `worker_ai_graphics_metadata_job_payload_owner_review_after_dry_run_passed_with_warnings`

Private artifact and checksum owner review: `accepted_with_warnings`.

Owner requirements:
- Keep refs placeholder-only, including `<PRIVATE_ARTIFACT_MANIFEST_REF>` and `<CHECKSUM_REF>`.
- Preserve private artifact scope.
- Do not use public artifacts or signed URLs as source of truth.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
