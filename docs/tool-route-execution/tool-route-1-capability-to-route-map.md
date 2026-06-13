# TOOL-ROUTE-1 Capability To Route Map

Map status: `created_for_static_contract_tests`

This map binds owner-study capability families to future route placeholders without invoking any route, tool, worker, provider, or media runtime.

| Capability family | Owner workstream | Future route refs | Future worker/tool refs | Blocked execution notes |
| --- | --- | --- | --- | --- |
| Creative graphics visual assets | `AI_TOOLS_CREATIVE_GRAPHICS` | `server/routes/worker-routes.ts::future_scoped_tool_route_placeholder` | SVG/dataviz/card/diagram tool refs from owner studies. | Tool execution, route execution, worker execution, provider runtime, public artifacts, and production remain blocked. |
| Private preview composition and final render/export | `TRACK_A_RENDER_EXPORT` | `server/routes/render-routes.ts::future_render_record_placeholder` | Track A private preview manifest placeholders. | Remotion render/export and final render/export remain blocked and Track A-owned. |
| Metadata route and media processing | `TRACK_B_MEDIA_PROCESSING` | Track B prior dry-run evidence plus future worker route placeholders. | DuckDB/Polars/no-op metadata route placeholders. | Media processing, route execution, worker execution, and broad media remain blocked. |
| Audio, timing, music, and SFX manifests | `SOUND_MUSIC_AUDIO` | `server/routes/worker-routes.ts::future_audio_tool_route_placeholder` | SoundSync/SFX/music manifest placeholders. | Audio processing, provider calls, worker execution, and public artifacts remain blocked. |
| Web evidence capture | `WEB_SEARCH_CAPTURE` | `server/routes/worker-routes.ts::future_web_capture_route_placeholder` | Web search capture manifest placeholders. | Browser capture, route execution, and storage transfer remain blocked. |
| Map and geospatial visuals | `MAP_GEOSPATIAL` | `server/routes/worker-routes.ts::future_map_tool_route_placeholder` | Map/location card manifest placeholders. | Map rendering, browser capture, tool execution, and public artifacts remain blocked. |
| Multi-tool plan | `TOOL_ROUTE_EXECUTION` | Worker, job, render, and route helper placeholders. | Cross-workstream manifest-only placeholders. | All runtime paths remain blocked until later owner-approved execution prompts. |

Required shared route fields for later prompts: `approvedPlanSnapshotId`, `workspaceId`, `projectId`, `requestingUserId`, `capabilityRoutingId`, `selectedToolMix`, `scopedToolCallManifestId`, `routeInvocationId`, `idempotencyKey`, `correlationId`, `workerJobId`, `workerClaimId`, `privateArtifactManifestId`, `inputArtifactScopeRef`, `outputArtifactScopeRef`, `qaEvidenceRef`, `observabilityRef`, and `cleanupEvidenceRef`.

Route execution approved: `false`
Tool execution approved: `false`
Worker execution approved: `false`
Provider/model runtime approved: `false`
Supabase mutation approved: `false`
Internal beta approved: `false`
Production approved: `false`
