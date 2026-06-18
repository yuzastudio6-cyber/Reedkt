# AI Graphics Job Payload Shape QA Warning Blocker Register

Decision: `worker_ai_graphics_metadata_job_payload_shape_qa_passed_with_warnings`

| Item | Status | Warning | Blocker |
| --- | --- | --- | --- |
| Draft PR stack | `accepted_with_warnings` | PR #482 and source PRs remain draft/open. | None |
| Schema validation | `accepted_with_warnings` | Schema validation is a later approval lane. | None |
| Worker execution | `blocked` | Worker execution remains blocked. | Runtime gate required. |
| Job claim | `blocked` | Real job claims remain blocked. | Runtime gate required. |
| Lease mutation | `blocked` | Real lease mutation remains blocked. | Runtime gate required. |
| Queue execution | `blocked` | Queue execution remains blocked. | Runtime gate required. |
| Route/tool execution | `blocked` | Route and actual tool execution remain blocked. | Route/tool runtime gates required. |
| Browser/WebGL/canvas runtime | `blocked` | Graphics runtime remains blocked. | Runtime boundary review required. |
| Remotion/resvg output | `blocked` | Render/export and rasterization remain blocked. | Track A/resvg gates required. |
| Supabase/GCS/public delivery | `blocked` | Supabase writes, GCS upload, signed URLs, and public artifacts remain blocked. | Backend/storage gates required. |
| Beta/production | `blocked` | Internal beta, external beta, paid production, and production remain blocked. | Production readiness gates required. |
