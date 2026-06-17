# AI Graphics Job Payload No-Execution Fields

Decision: `worker_ai_graphics_metadata_job_payload_shape_approved_with_warnings`

Future payloads must carry `noExecutionProof`, `blockedRuntimeFlags`, `executionApprovalState`, and `runtimeBoundaryNotes`.

Required blocked flags include worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, GCS upload, signed URLs, public artifacts, raw prompts, beta, and production.
