# AI Graphics Job Payload Queue Placeholder Validation Policy

Decision: `worker_ai_graphics_metadata_job_payload_schema_validation_approved_with_warnings`

Future validation may check `queuePlaceholderRef` as a placeholder-only field. Queue execution, dispatch, enqueue, dequeue, and worker runtime invocation remain blocked.

Every accepted row remains `placeholder only; no queue execution`.

No schema validation execution, worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
