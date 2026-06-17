# AI_TOOLS_CREATIVE_GRAPHICS Route Blocked Use Register

Decision: `approved_with_warnings_for_ai_graphics_route_manifest_integration`

| Blocked use | Status | Reason | Follow-up |
| --- | --- | --- | --- |
| Route execution | `blocked` | This packet approves metadata planning only. | TOOL_ROUTE owner gate. |
| Actual tool execution | `blocked` | Import/proof evidence is not execution readiness. | Tool execution approval. |
| Worker execution | `blocked` | Worker handoff requires a later WORKER_RUNTIME_JOBS gate. | Worker integration approval. |
| Provider/model calls | `blocked` | Provider-generated graphics belong to PROVIDER_GATEWAY. | Provider Gateway packet. |
| Browser runtime | `blocked` | Batch 2/3 browser-capable packages are manifest-only. | Runtime boundary review. |
| WebGL runtime | `blocked` | Three/Pixi/Babylon proof did not create WebGL contexts. | Runtime boundary review. |
| Canvas runtime | `blocked` | ECharts/Pixi/Konva canvas output is not approved. | Runtime boundary review. |
| `@resvg/resvg-js` rasterization | `blocked` | Batch 4 accepted policy only. | Resvg Linux import proof first. |
| Remotion render/export | `blocked` | Track A owns final render/export. | Track A handoff review. |
| Supabase mutation / SQL | `blocked` | Supabase is docs-only for this packet. | Separate Supabase owner gate. |
| GCS/storage transfer | `blocked` | Private artifact refs are placeholders only. | Storage owner gate. |
| Signed URL delivery | `blocked` | Signed URLs are not source of truth. | Delivery owner gate. |
| Public artifacts | `blocked` | Public output is not approved. | Public delivery gate. |
| Raw prompt execution | `blocked` | Workers consume approved snapshots, not raw prompts. | Plan snapshot owner gate. |
| Internal/external beta and production | `blocked` | Route metadata planning is not launch readiness. | Release owner gate. |

No blocked use in this register was enabled.
