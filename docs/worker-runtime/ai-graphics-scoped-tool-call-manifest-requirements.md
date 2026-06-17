# AI Graphics Scoped Tool-Call Manifest Requirements

Decision: `worker_ai_graphics_metadata_handoff_approved_with_warnings`

Future Worker Runtime planning may consume a scoped tool-call manifest reference only after Tool Route metadata handoff QA and owner approval.

## Requirements

- `scopedToolCallManifestId` must remain a placeholder: `<SCOPED_TOOL_CALL_MANIFEST_REF>`.
- The manifest must identify exactly one accepted AI graphics tool or an explicitly scoped metadata-only multi-tool family.
- The manifest must include owner id, capability id, blocked runtime uses, private artifact refs, checksum refs, and no-execution proof expectations.
- The manifest must not authorize route execution, actual tool execution, worker execution, job claim, lease mutation, queue execution, provider runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, GCS upload, signed URLs, public artifacts, raw prompts, beta, or production.
