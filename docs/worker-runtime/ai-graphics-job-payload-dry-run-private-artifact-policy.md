# AI Graphics Job Payload Dry-Run Private Artifact Policy

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_approved_with_warnings`

Future dry-run payloads may validate private artifact placeholders and checksum placeholders only. Public artifacts and signed URLs are not source of truth. Accepted placeholders include private manifest-style refs such as `<PRIVATE_ARTIFACT_MANIFEST_REF>` and checksum refs such as `<CHECKSUM_REF>`.

The future dry-run must fail closed for URLs, signed URL markers, public artifact refs, unscoped artifact paths, provider raw output, real user data, secrets, or generated media/render/browser/canvas/WebGL/public outputs.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
