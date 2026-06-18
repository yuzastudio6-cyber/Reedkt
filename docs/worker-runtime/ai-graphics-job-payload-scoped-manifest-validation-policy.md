# AI Graphics Job Payload Scoped Manifest Validation Policy

Decision: `worker_ai_graphics_metadata_job_payload_schema_validation_approved_with_warnings`

Future validation requires `scopedToolCallManifestId` to be placeholder-only and present. Scoped manifest validation only proves intake shape for metadata/manifest handoff.

Validation must fail closed when the manifest placeholder is missing, out of scope, tied to runtime execution, or claims route/tool/provider output. Scoped manifest validation does not execute routes, tools, or workers.

No schema validation execution, worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
