# AI Graphics Job Payload Invalid Schema Owner Approval

Decision: `worker_ai_graphics_metadata_job_payload_owner_approved_with_warnings`

Owner approval accepts the invalid schema example and QA evidence from PR #493/PR #491 with warnings. Invalid payloads must fail closed when required placeholder refs, owner/capability/tool ids, no-execution assertions, observability/audit refs, private artifact refs, or checksum refs are missing or malformed.

Result: `accepted_with_warnings`.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
