# AI Graphics Local Fixture Gate Status Owner Approval Blocked-Use Register

Decision: `tool_route_ai_graphics_metadata_local_fixture_gate_status_owner_approved_with_warnings`

| Blocked use | Status | Owner note |
| --- | --- | --- |
| Local fixture validation execution | `blocked` | Owner approval accepts PR #473 QA evidence only. |
| Actual local fixture execution | `blocked` | Metadata gate status is not fixture output. |
| Route execution | `blocked` | Route execution requires a separate future lane. |
| Actual tool execution | `blocked` | The 13 tools remain metadata/manifest-only in this lane. |
| Worker execution | `blocked` | Worker Runtime needs separate handoff approval. |
| Provider/model runtime | `blocked` | Provider-generated graphics remain Provider Gateway-owned. |
| Browser/WebGL/canvas runtime | `blocked` | Browser, WebGL, and canvas runtimes remain unapproved. |
| `resvg` rasterization | `blocked` | Rasterization remains a separate AI graphics lane. |
| Remotion render/export | `blocked` | Track A owns render/export. |
| Supabase/GCS/storage | `blocked` | Supabase remains `no write` / `docs_only`; GCS upload remains unapproved. |
| Signed URLs and public artifacts | `blocked` | They are not source of truth. |
| Raw prompt execution | `blocked` | Workers must consume approved snapshots and scoped manifests only. |
| Internal beta, external beta, production | `blocked` | No unlock is approved. |
