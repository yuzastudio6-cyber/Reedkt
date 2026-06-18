# AI Graphics Job Payload Private Artifact Validation Policy

Decision: `worker_ai_graphics_metadata_job_payload_schema_validation_approved_with_warnings`

Future validation requires placeholder-only private artifact refs and checksum refs. Public artifacts and signed URLs are not source of truth and must remain blocked.

Valid payloads require `<PRIVATE_ARTIFACT_MANIFEST_REF>` and `<CHECKSUM_REF>`. Blocked or invalid payloads must fail closed when private artifact scope is missing, public, executable, or tied to generated output.

No schema validation execution, worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
