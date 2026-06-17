# AI Graphics Local Fixture Owner Approval Blocked-Use Register

Decision: `tool_route_ai_graphics_metadata_local_fixture_owner_approved_with_warnings`

| Blocked use | Owner status | Required follow-up |
| --- | --- | --- |
| Local fixture validation execution | `blocked` | Separate execution approval only; not this packet |
| Actual local fixture execution | `blocked` | Separate fixture execution gate |
| Route execution | `blocked` | Separate route execution gate after owner/status review |
| Actual tool execution | `blocked` | Separate controlled tool execution approval |
| Worker execution | `blocked` | Separate WORKER_RUNTIME_JOBS approval |
| Provider/model runtime | `blocked` | Provider Gateway approval only |
| Browser/WebGL/canvas runtime | `blocked` | Separate browser/runtime gate |
| `@resvg/resvg-js` rasterization | `blocked` | Linux import-proof and rasterization review |
| Remotion render/export | `blocked` | Track A handoff and render/export approval |
| Supabase mutation / SQL | `blocked` | Separate database approval |
| GCS upload/storage transfer | `blocked` | Separate storage approval |
| Signed URLs / public artifacts | `blocked` | Separate private artifact delivery review |
| Raw prompt execution | `blocked` | Approved plan snapshot path only |
| Internal/external beta or production | `blocked` | Separate beta/production go/no-go |

Blocked means no future gate-status packet may reinterpret this owner approval as runtime readiness.
