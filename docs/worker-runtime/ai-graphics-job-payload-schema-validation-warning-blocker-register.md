# AI Graphics Job Payload Schema Validation Warning Blocker Register

Decision: `worker_ai_graphics_metadata_job_payload_schema_validation_qa_passed_with_warnings`

| Item | Status | Notes |
| --- | --- | --- |
| PR #491 source stack | warning | PR #491 and parent stack remain draft/open. |
| Static validation evidence | accepted_with_warnings | Evidence is committed and sanitized; local ignored artifacts are not source of truth. |
| Worker execution | blocked | Worker execution, job claim, lease mutation, and queue execution remain false. |
| Route/tool/provider runtime | blocked | Route execution, actual tool execution, and provider/model runtime remain false. |
| Browser/WebGL/canvas/resvg/Remotion | blocked | Runtime output and render/export remain separately gated. |
| Supabase/GCS/public/signed URLs | blocked | Supabase remains `no write` / `docs_only`; storage and delivery remain false. |
| Beta/production | blocked | Internal beta, external beta, paid production, and production remain false. |
