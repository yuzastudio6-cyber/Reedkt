# AI Graphics Local Fixture Gate Status Blocked-Use Register

Decision: `tool_route_ai_graphics_metadata_local_fixture_gate_status_ready_with_warnings`

| Blocked use | Status | Reason |
| --- | --- | --- |
| Local fixture validation execution | `blocked` | This packet records status only and does not rerun PR #464 validation. |
| Actual local fixture execution | `blocked` | Generated fixture execution is not approved. |
| Route execution | `blocked` | Route runtime remains separately gated. |
| Actual tool execution | `blocked` | Tool runtime remains separately gated. |
| Worker execution | `blocked` | Worker runtime remains separately gated. |
| Provider/model runtime | `blocked` | Provider/model calls are out of scope. |
| Browser/WebGL/canvas runtime | `blocked` | Batch 3 warnings remain in force. |
| Resvg rasterization | `blocked` | Rasterization remains separately gated. |
| Remotion render/export | `blocked` | Track A owns render/export handoff and no output is produced here. |
| Supabase mutation or SQL | `blocked` | Supabase remains `no write` / `docs_only`. |
| GCS/storage transfer | `blocked` | No storage operation is performed. |
| Signed URLs | `blocked` | Signed URLs are not source of truth. |
| Public artifacts | `blocked` | Public artifacts are not approved. |
| Raw prompt execution | `blocked` | Workers must consume approved snapshots, not raw chat. |
| Internal beta, external beta, production | `blocked` | This status packet does not unlock beta or production. |
