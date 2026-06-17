# AI_TOOLS_CREATIVE_GRAPHICS Route Owner Handoff Contract

Decision: `approved_with_warnings_for_ai_graphics_route_manifest_integration`

## Owner Boundaries

| Owner | Owns | Does not own here |
| --- | --- | --- |
| AI_TOOLS_CREATIVE_GRAPHICS | accepted tool eligibility, capability metadata, proof status mapping, blocked runtime uses | route execution, worker execution, render/export, provider execution |
| TOOL_ROUTE_EXECUTION | future route-manifest metadata integration and route policy validation | AI graphics package proof ownership |
| WORKER_RUNTIME_JOBS | future worker handoff and job payload gates | tool eligibility proof |
| TRACK_A_RENDER_EXPORT | future final composition/render/export ownership | AI graphics package proof |
| TRACK_B_MEDIA_PROCESSING | Track B route manifest policy context | AI graphics owner lane decisions |
| PROVIDER_GATEWAY | provider-generated graphics and model runtime gates | open-source tool proof |

## Handoff Rules

- Tool-route handoff may consume only metadata from the eligibility matrix and scoped manifest shape.
- Worker handoff must require an approved plan snapshot and scoped tool-call manifest.
- Track A handoff is required before any Remotion render/export or final composition claim.
- Provider-generated graphics remain Provider Gateway only.
- `@resvg/resvg-js` rasterization remains blocked; Linux import proof requires a separate later packet.

No route execution, actual tool execution, worker execution, provider/model call, Remotion render/export, resvg rasterization, Supabase mutation, GCS/storage transfer, signed URL creation, public artifact creation, beta unlock, or production unlock was enabled.
