# AI Graphics Job Payload Fail Closed Owner Approval

Decision: `worker_ai_graphics_metadata_job_payload_owner_approved_with_warnings`

Owner approval accepts fail-closed fields with warnings. Future payloads must fail closed for missing approved snapshot refs, missing scoped manifest refs, unaccepted tool ids, unsupported capabilities, non-placeholder claim/lease refs, non-placeholder queue refs, public artifact refs, signed URL refs, raw prompt refs, or runtime execution requests.

Result: `accepted_with_warnings`.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
