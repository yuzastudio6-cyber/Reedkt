# WORKER-5 Fixture Acceptance Matrix

QA result: `worker_runtime_offline_dry_run_qa_passed_with_warnings`

Controlled no-op readiness: `ready_with_warnings_for_controlled_noop_worker_gate_plan`

| Fixture id | Source scoped fixture | Plan snapshot ref | Scoped manifest ref | Acceptance | Warning |
| --- | --- | --- | --- | --- | --- |
| `worker_route_ai_tools_creative_graphics` | `docs/tool-route-execution/fixtures/ai-tools-creative-graphics.scoped-tool-call.fixture.json` | `<APPROVED_PLAN_SNAPSHOT_FIXTURE>` | `<SCOPED_TOOL_CALL_MANIFEST_AI_TOOLS_CREATIVE_GRAPHICS>` | `accepted_with_warnings` | Tool/capability/route coverage is inherited from TOOL-ROUTE diagnostics. |
| `worker_route_track_a_render_export` | `docs/tool-route-execution/fixtures/track-a-render-export.scoped-tool-call.fixture.json` | `<APPROVED_PLAN_SNAPSHOT_FIXTURE>` | `<SCOPED_TOOL_CALL_MANIFEST_TRACK_A_RENDER_EXPORT>` | `accepted_with_warnings` | Final render/export remains blocked. |
| `worker_route_track_b_media_processing` | `docs/tool-route-execution/fixtures/track-b-media-processing.scoped-tool-call.fixture.json` | `<APPROVED_PLAN_SNAPSHOT_FIXTURE>` | `<SCOPED_TOOL_CALL_MANIFEST_TRACK_B_MEDIA_PROCESSING>` | `accepted_with_warnings` | Media processing remains blocked. |
| `worker_route_sound_music_audio` | `docs/tool-route-execution/fixtures/sound-music-audio.scoped-tool-call.fixture.json` | `<APPROVED_PLAN_SNAPSHOT_FIXTURE>` | `<SCOPED_TOOL_CALL_MANIFEST_SOUND_MUSIC_AUDIO>` | `accepted_with_warnings` | Audio generation, SFX/music generation, FFmpeg/FFprobe, DeepFilterNet, and Demucs remain blocked. |
| `worker_route_web_search_capture` | `docs/tool-route-execution/fixtures/web-search-capture.scoped-tool-call.fixture.json` | `<APPROVED_PLAN_SNAPSHOT_FIXTURE>` | `<SCOPED_TOOL_CALL_MANIFEST_WEB_SEARCH_CAPTURE>` | `accepted_with_warnings` | Browser capture remains blocked. |
| `worker_route_map_geospatial` | `docs/tool-route-execution/fixtures/map-geospatial.scoped-tool-call.fixture.json` | `<APPROVED_PLAN_SNAPSHOT_FIXTURE>` | `<SCOPED_TOOL_CALL_MANIFEST_MAP_GEOSPATIAL>` | `accepted_with_warnings` | Map rendering remains blocked. |
| `worker_route_multi_tool_plan` | `docs/tool-route-execution/fixtures/multi-tool-plan.scoped-tool-call.fixture.json` | `<APPROVED_PLAN_SNAPSHOT_FIXTURE>` | `<SCOPED_TOOL_CALL_MANIFEST_MULTI_TOOL_PLAN>` | `accepted_with_warnings` | Multi-tool runtime remains blocked until later owner gates. |

## Common Accepted Fields

Each accepted fixture keeps worker job refs, idempotency refs, claim/lease placeholders, private artifact manifest refs, checksum refs, QA refs, observability refs, cleanup refs, artifact scopes, and blocked-use declarations in committed placeholder form.

Selected tool refs, capability refs, route refs, and artifact scopes are accepted through the source scoped-tool-call fixture and inherited TOOL-ROUTE diagnostics, not duplicated as live worker runtime behavior.

liveWorkerExecutionApprovedNow: `false`
workerJobClaimApprovedNow: `false`
workerLeaseMutationApprovedNow: `false`
queueExecutionApprovedNow: `false`
routeExecutionApprovedNow: `false`
toolExecutionApprovedNow: `false`
providerRuntimeApprovedNow: `false`
mediaRuntimeApprovedNow: `false`
audioRuntimeApprovedNow: `false`
supabaseMutationApprovedNow: `false`
publicArtifactsApproved: `false`
signedUrlsApproved: `false`
rawPromptExecutionApproved: `false`
internalBetaApproved: `false`
externalBetaApproved: `false`
productionApproved: `false`
