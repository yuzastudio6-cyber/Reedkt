# AI Graphics Job Payload Observability Audit Owner Approval

Decision: `worker_ai_graphics_metadata_job_payload_owner_approved_with_warnings`

Owner approval accepts observability/audit fields with warnings. Future payloads must include placeholder audit refs sufficient to trace the approved snapshot, scoped manifest, tool id, capability id, private artifact refs, checksum refs, and fail-closed outcome without creating public artifacts.

Result: `accepted_with_warnings`.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
