# AI Graphics Job Payload Plan Snapshot Validation Policy

Decision: `worker_ai_graphics_metadata_job_payload_schema_validation_approved_with_warnings`

Future validation requires `planSnapshotId` to be placeholder-only and present in valid payloads. The placeholder proves source-of-truth linkage without allowing worker execution or direct raw prompt use.

Validation must fail closed when the approved plan snapshot placeholder is missing, malformed, replaced by raw prompt material, or points to a non-private artifact path.

No schema validation execution, worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
