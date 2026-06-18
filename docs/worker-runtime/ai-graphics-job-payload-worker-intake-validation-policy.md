# AI Graphics Job Payload Worker Intake Validation Policy

Decision: `worker_ai_graphics_metadata_job_payload_schema_validation_approved_with_warnings`

Future validation may approve only shape-level worker intake checks for the AI graphics metadata payload. Worker runtime, worker execution, job claim, lease mutation, queue execution, and route/tool/provider handoff remain blocked.

Worker intake validation requirements:
- All 13 tools are present with `accepted_with_warnings`.
- Owner id remains `AI_TOOLS_CREATIVE_GRAPHICS`.
- Capability ids remain metadata/manifest-only.
- Tool ids match the approved Tool Route and Worker handoff matrices.
- Claim, lease, and queue refs are placeholders only.

No schema validation execution, worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
