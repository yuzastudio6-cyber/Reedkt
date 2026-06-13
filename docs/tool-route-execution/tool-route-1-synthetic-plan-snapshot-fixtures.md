# TOOL-ROUTE-1 Synthetic Plan Snapshot Fixtures

Fixture status: `created_for_offline_contract_tests`

These fixtures model future approved-plan-snapshot to scoped-tool-call manifest handoffs. They are static JSON records under `docs/tool-route-execution/fixtures/` and are not executable runtime configuration.

## Fixture Inventory

| Fixture | Plan snapshot placeholder | Capability refs | Selected tool mix | Approval state |
| --- | --- | --- | --- | --- |
| `ai-tools-creative-graphics.scoped-tool-call.fixture.json` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER_AI_TOOLS_CREATIVE_GRAPHICS>` | `AI_TOOLS_CREATIVE_GRAPHICS.synthetic_vector_dataviz_card_motion_planning` | Synthetic static creative graphics fixture mix. | `dry_run_fixture_plan_only` |
| `track-a-render-export.scoped-tool-call.fixture.json` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER_TRACK_A_RENDER_EXPORT>` | `TRACK_A_RENDER_EXPORT.private_preview_manifest_planning` | Track A manifest-only fixture mix. | `dry_run_fixture_plan_only` |
| `track-b-media-processing.scoped-tool-call.fixture.json` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER_TRACK_B_MEDIA_PROCESSING>` | `TRACK_B_MEDIA_PROCESSING.metadata_route_planning` | Track B metadata-only fixture mix. | `dry_run_fixture_plan_only` |
| `sound-music-audio.scoped-tool-call.fixture.json` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER_SOUND_MUSIC_AUDIO>` | `SOUND_MUSIC_AUDIO.timing_audio_metadata_planning` | Sound/Music manifest-only fixture mix. | `dry_run_fixture_plan_only` |
| `web-search-capture.scoped-tool-call.fixture.json` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER_WEB_SEARCH_CAPTURE>` | `WEB_SEARCH_CAPTURE.evidence_capture_planning` | Web Search Capture manifest-only fixture mix. | `dry_run_fixture_plan_only` |
| `map-geospatial.scoped-tool-call.fixture.json` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER_MAP_GEOSPATIAL>` | `MAP_GEOSPATIAL.route_card_map_planning` | Map Geospatial manifest-only fixture mix. | `dry_run_fixture_plan_only` |
| `multi-tool-plan.scoped-tool-call.fixture.json` | `<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER_MULTI_TOOL_PLAN>` | All six owner-study workstreams. | Multi-tool manifest-only fixture mix. | `dry_run_fixture_plan_only` |

## Common Fixture Expectations

Each fixture includes:

- owner-study references from PR #360, completed Web Search Capture and Map Geospatial evidence, and TOOL-ROUTE-0 PR #366.
- requested capabilities, selected tool candidates, route references, edit intent references, and worker job placeholders.
- input artifact placeholders, output artifact scope placeholders, private artifact manifest placeholders, checksum requirements, QA requirements, and observability requirements.
- blocked uses and false approval booleans for route/tool/worker/provider/Supabase/public/signed URL/raw prompt/beta/production paths.

No fixture includes real user data, real URLs, private URLs, signed URLs, real GCS paths, secrets, raw provider output, SQL, Supabase commands, generated media, browser capture, map rendering, media processing, route execution, tool execution, worker execution, provider/model calls, public artifact creation, beta unlock, or production unlock.

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`
