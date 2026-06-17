# AI Graphics Scoped Tool-Call Manifest Requirements QA

Decision: `worker_ai_graphics_metadata_handoff_qa_passed_with_warnings`

QA result: `accepted_with_warnings`

The scoped tool-call manifest requirement is accepted because PR #478 requires `<SCOPED_TOOL_CALL_MANIFEST_REF>`, owner id, capability id, blocked runtime uses, private artifact refs, checksum refs, and no-execution proof expectations.

This QA does not approve route execution, actual tool execution, worker execution, job claim, lease mutation, queue execution, provider runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, GCS upload, signed URLs, public artifacts, raw prompts, beta, or production.
