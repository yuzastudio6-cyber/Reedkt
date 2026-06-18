# AI Graphics Job Payload No-Execution Validation Policy

Decision: `worker_ai_graphics_metadata_job_payload_schema_validation_approved_with_warnings`

Future validation must prove no runtime path is entered. It may parse committed JSON fixtures and docs only. It may not import worker runtime, route handler, tool runtime, provider client, Supabase client, browser/WebGL/canvas/render module, resvg, Remotion, media/audio code, or network-capable code.

The validation result may set only schema-validation evidence booleans true; all live/runtime booleans remain false.

No schema validation execution, worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
