# WORKER-8 Fixture Acceptance Matrix

QA result: `worker_runtime_controlled_noop_qa_passed_with_warnings`

workerReadinessState: `ready_with_warnings_for_worker_9_controlled_job_claim_lease_gate_plan`

controlled no-op rerun: `false`

| Fixture id | Source scoped fixture | Plan snapshot ref | Scoped manifest ref | WORKER-7 result | WORKER-8 acceptance | Warning carried forward |
| --- | --- | --- | --- | --- | --- | --- |
| `worker_route_ai_tools_creative_graphics` | `docs/tool-route-execution/fixtures/ai-tools-creative-graphics.scoped-tool-call.fixture.json` | `<APPROVED_PLAN_SNAPSHOT_FIXTURE>` | `<SCOPED_TOOL_CALL_MANIFEST_AI_TOOLS_CREATIVE_GRAPHICS>` | `passed_with_warnings` | `accepted_with_warnings` | Tool/capability/route coverage remains inherited from TOOL-ROUTE diagnostics; no live AI tool execution is approved. |
| `worker_route_track_a_render_export` | `docs/tool-route-execution/fixtures/track-a-render-export.scoped-tool-call.fixture.json` | `<APPROVED_PLAN_SNAPSHOT_FIXTURE>` | `<SCOPED_TOOL_CALL_MANIFEST_TRACK_A_RENDER_EXPORT>` | `passed_with_warnings` | `accepted_with_warnings` | Final render/export remains blocked. |
| `worker_route_track_b_media_processing` | `docs/tool-route-execution/fixtures/track-b-media-processing.scoped-tool-call.fixture.json` | `<APPROVED_PLAN_SNAPSHOT_FIXTURE>` | `<SCOPED_TOOL_CALL_MANIFEST_TRACK_B_MEDIA_PROCESSING>` | `passed_with_warnings` | `accepted_with_warnings` | Media processing remains blocked. |
| `worker_route_sound_music_audio` | `docs/tool-route-execution/fixtures/sound-music-audio.scoped-tool-call.fixture.json` | `<APPROVED_PLAN_SNAPSHOT_FIXTURE>` | `<SCOPED_TOOL_CALL_MANIFEST_SOUND_MUSIC_AUDIO>` | `passed_with_warnings` | `accepted_with_warnings` | Audio runtime, audio generation, SFX/music generation, FFmpeg/FFprobe, DeepFilterNet, and Demucs remain blocked. |
| `worker_route_web_search_capture` | `docs/tool-route-execution/fixtures/web-search-capture.scoped-tool-call.fixture.json` | `<APPROVED_PLAN_SNAPSHOT_FIXTURE>` | `<SCOPED_TOOL_CALL_MANIFEST_WEB_SEARCH_CAPTURE>` | `passed_with_warnings` | `accepted_with_warnings` | Browser capture remains blocked. |
| `worker_route_map_geospatial` | `docs/tool-route-execution/fixtures/map-geospatial.scoped-tool-call.fixture.json` | `<APPROVED_PLAN_SNAPSHOT_FIXTURE>` | `<SCOPED_TOOL_CALL_MANIFEST_MAP_GEOSPATIAL>` | `passed_with_warnings` | `accepted_with_warnings` | Map rendering remains blocked. |
| `worker_route_multi_tool_plan` | `docs/tool-route-execution/fixtures/multi-tool-plan.scoped-tool-call.fixture.json` | `<APPROVED_PLAN_SNAPSHOT_FIXTURE>` | `<SCOPED_TOOL_CALL_MANIFEST_MULTI_TOOL_PLAN>` | `passed_with_warnings` | `accepted_with_warnings` | Multi-tool route/tool/provider/media/audio runtime remains blocked until later owner gates. |

## Accepted With Warnings Criteria

Each reviewed fixture retains placeholder refs for approved plan snapshot, scoped tool-call manifest, worker job payload, idempotency, private artifact manifest, checksum/provenance, QA, observability, and cleanup evidence. WORKER-8 accepts those rows as QA-reviewed controlled no-op evidence only.

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
