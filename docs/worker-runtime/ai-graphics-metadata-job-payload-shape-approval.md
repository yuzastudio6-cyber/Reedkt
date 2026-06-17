# AI Graphics Metadata Job Payload Shape Approval

Decision: `worker_ai_graphics_metadata_job_payload_shape_approved_with_warnings`

This packet approves a future Worker Runtime job payload shape for AI graphics metadata handoff only. It uses PR #480 handoff QA evidence and keeps `readyForWorkerExecutionPlanning` false.

The payload shape requires a placeholder approved plan snapshot, scoped tool-call manifest, owner/capability/tool ids, private artifact refs, checksum refs, validation-only fixture refs, blocked runtime flags, claim/lease placeholders, queue placeholders, no-execution proof fields, observability/audit fields, and fail-closed fields.

This approval is not worker execution, job claim approval, lease mutation approval, queue execution approval, route execution approval, or actual tool execution approval.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
