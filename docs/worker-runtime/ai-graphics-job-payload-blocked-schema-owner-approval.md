# AI Graphics Job Payload Blocked Schema Owner Approval

Decision: `worker_ai_graphics_metadata_job_payload_owner_approved_with_warnings`

Owner approval accepts the blocked schema example and QA evidence from PR #493/PR #491 with warnings. The blocked case must remain fail-closed when a payload requests unsupported capability, runtime execution, public artifact delivery, signed URL delivery, raw prompt routing, or unscoped artifact refs.

Result: `accepted_with_warnings`.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
