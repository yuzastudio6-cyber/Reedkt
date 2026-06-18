# AI Graphics Job Payload Claim Lease Placeholder Validation Policy

Decision: `worker_ai_graphics_metadata_job_payload_schema_validation_approved_with_warnings`

Future validation may check `claimPlaceholderRef` and `leasePlaceholderRef` as placeholder-only fields. It must not perform a real job claim, mutate a lease, or infer queue readiness.

Every accepted row remains `placeholder only; no job claim or lease mutation`.

No schema validation execution, worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
