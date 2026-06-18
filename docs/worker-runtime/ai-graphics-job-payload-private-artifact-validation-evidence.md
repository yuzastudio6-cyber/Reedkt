# AI Graphics Job Payload Private Artifact Validation Evidence

Decision: `worker_ai_graphics_metadata_job_payload_schema_validation_passed_with_warnings`

Result: `passed_with_warnings`

Validation confirmed placeholder-only private artifact and checksum requirements:

- Valid example requires `<PRIVATE_ARTIFACT_MANIFEST_REF>` and `<CHECKSUM_REF>`.
- Blocked example remains private-ref/checksum placeholder evidence only.
- Invalid example remains fail-closed with `<MISSING_CHECKSUM_REF>`.

Public artifacts and signed URLs are not source of truth for this lane.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
