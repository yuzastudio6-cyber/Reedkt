# AI Graphics Job Payload Invalid Schema Validation Policy

Decision: `worker_ai_graphics_metadata_job_payload_schema_validation_approved_with_warnings`

Future validation must reject malformed placeholder payloads without attempting repair, execution, queue mutation, or artifact creation. The docs-only invalid example is `docs/worker-runtime/fixtures/ai-graphics-metadata-job-payload-example.invalid.json`.

Invalid cases must check missing required placeholder fields, invalid owner/capability/tool combinations, missing checksum placeholder, unsafe artifact scope, runtime flag values that are not `false`, and any executable instruction marker. Invalid examples are evidence of rejection policy only.

No schema validation execution, worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
