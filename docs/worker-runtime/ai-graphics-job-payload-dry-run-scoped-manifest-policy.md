# AI Graphics Job Payload Dry-Run Scoped Manifest Policy

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_approved_with_warnings`

Future dry-run payloads must reference a scoped tool-call manifest placeholder, not a live route invocation and not an executable tool call. The placeholder must remain metadata-only, for example `<SCOPED_TOOL_CALL_MANIFEST_REF>`, and must map back to the Tool Route AI graphics metadata source chain.

Scoped manifest validation may check tool id, owner id, capability id, blocked runtime use, private artifact refs, checksum refs, and no-execution assertions. It may not execute routes, tools, workers, providers, browser/WebGL/canvas runtime, resvg, Remotion, Supabase, SQL, GCS, signed URLs, public artifacts, beta, or production.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
