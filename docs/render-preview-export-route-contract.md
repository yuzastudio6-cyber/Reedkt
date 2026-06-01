# Render, Preview, And Export Route Contract

Prompt 10 route contracts are backend API boundaries only. They validate requests, read guarded record summaries when backend runtime is available, and fail closed for execution.

| Route ID | Method/path | Purpose | Idempotency | Tables touched | Status | Forbidden side effects |
| --- | --- | --- | --- | --- | --- | --- |
| `render.readiness.check` | `POST /v1/render/readiness` | Check render readiness against approved snapshot, credit, media/storage, timing, and QA gates. | No | `projects`, `workspace_members`, `approved_plan_snapshots`, `credit_reservations`, `media_assets`, `storage_object_records`, `master_timing_maps`, `qa_reports` | implemented | No render job, worker, Remotion, FFmpeg, storage write, provider, tool, or credit mutation. |
| `render.manifest.readiness` | `POST /v1/render/manifest/readiness` | Check whether a manifest can be built from canonical references. | No | Same readiness references | implemented | No persisted manifest and no render execution. |
| `render.manifest.build` | `POST /v1/render/manifest/build` | Validate idempotent manifest build boundary and return intended manifest summary. | Yes | Same readiness references | backend_required | No manifest persistence, render job, Remotion, FFmpeg, or storage write. |
| `render.preview.readiness` | `POST /v1/render/preview/readiness` | Check preview request prerequisites. | No | Readiness references plus QA | implemented | No preview artifact generation. |
| `render.preview.request` | `POST /v1/render/preview/request` | Validate idempotent preview request boundary. | Yes | `approved_plan_snapshots`, `credit_reservations`, `render_jobs`, `render_job_inputs`, `renders` as intended references | backend_required | No job creation, worker claim, Remotion, FFmpeg, storage write, or credit mutation. |
| `render.preview.status` | `GET /v1/render/preview/:renderId/status` | Read sanitized preview status. | No | `renders` | backend_required | No polling worker runtime, storage download, or signed URL creation. |
| `render.get` | `GET /v1/renders/:renderId` | Read sanitized render metadata. | No | `renders` | backend_required | No execution or artifact delivery. |
| `render.listForProject` | `GET /v1/projects/:projectId/renders` | List sanitized project render records. | No | `renders` | backend_required | No execution or artifact delivery. |
| `render.blockers` | `POST /v1/render/blockers` | Return explicit render/export blockers. | No | Readiness references | implemented | No downstream execution. |
| `render.events.list` | `GET /v1/renders/:renderId/events` | List sanitized append-style render events. | No | `renders`, `render_events` | backend_required | No event append. |
| `export.readiness.check` | `POST /v1/export/readiness` | Check final export readiness and QA/runtime blockers. | No | `approved_plan_snapshots`, `credit_reservations`, `renders`, `qa_reports`, `final_exports` | implemented | No FFmpeg, export artifact creation, storage write, or delivery URL. |
| `export.request` | `POST /v1/export/request` | Validate idempotent final export request boundary. | Yes | `renders`, `final_exports` as intended references | backend_required | No FFmpeg, storage write, export job, or signed URL. |
| `export.status` | `GET /v1/export/:exportId/status` | Read sanitized final export status. | No | `final_exports` | backend_required | No export delivery or signed URL. |
| `export.get` | `GET /v1/exports/:exportId` | Read sanitized final export metadata. | No | `final_exports` | backend_required | No export delivery or signed URL. |
| `export.listForProject` | `GET /v1/projects/:projectId/exports` | List sanitized project export records. | No | `final_exports` | backend_required | No export delivery or signed URL. |

## Shared Requirements

- Caller must be authenticated.
- Request must include workspace/project context.
- Project access must resolve through workspace membership.
- Mutation-style boundaries must include `Idempotency-Key`.
- Metadata must not include secrets, provider keys, service-role data, signed URLs, Stripe keys, raw credentials, or private env-like values.
- Service-role data must not be returned to the frontend.
- Signed URLs must never be stored or returned as source-of-truth values.

## Output

All routes return the standard server envelope with `status: "ok"` for HTTP transport success and a `renderReadiness` payload. The payload status may still be `backend_required` or `blocked`.
