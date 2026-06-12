# TOOL-STUDY-0 Map Geospatial Capability Routing Contract

Owner: `MAP_GEOSPATIAL`

## Goal

Create the MAP_GEOSPATIAL tool study and capability routing contract for ReEditPro. The study maps owned map/geospatial capabilities, tool combinations, routing rules, evidence handoffs, and blockers before future route or tool execution is separately considered.

This is docs/diagnostics only. Do not render maps, fetch tiles, geocode, route, call providers, execute tools, execute workers, execute routes, mutate Supabase, run SQL, upload GCS artifacts, create signed URLs, publish public artifacts, unlock beta/production, or execute raw prompts.

## Source Of Truth

- `docs/activation-phase-tool-route-0-execution-unlock-audit-results.md`
- `docs/activation-phase-worker-1-approved-plan-snapshot-dry-run-results.md`
- `docs/activation-worker-approved-plan-dry-run-reports/dry-run/worker-job-batch-plan.json`
- `docs/activation-worker-approved-plan-dry-run-reports/evidence/plan-snapshot-evidence-context.json`
- `open-source-tool-registry.md`
- `tool-settings-catalog.md`
- `tool-strategy-planner.md`
- `map-location-animation-planning.md`
- `map-animation-settings-catalog.md`
- `server/tool-registry/production-tool-profiles.ts`
- `src/lib/tool-registry.ts`
- `src/lib/map-animation-planner.ts`

Record missing optional source paths instead of creating unrelated trees.

## Owned Capabilities

- `maplibre`
- `turf`
- `deck_gl`
- `cesium_js`
- `openstreetmap_open_map_data_policy`
- `generated_local_geojson_fixtures`
- `local_offline_map_scene_manifests`
- `map_style_manifest`
- `camera_manifest`
- `timing_manifest`
- `render_manifest`
- `pmtiles_tileserver_gl_martin_future`
- `nominatim_photon_pelias_future`
- `osrm_valhalla_future`

Each capability record must include owner, strengths, non-goals, best use cases, bad use cases, allowed inputs, blocked inputs, output artifact types, render-readiness, alpha/transparency support, runtime/package needs, browser/server/native/Docker needs, cost/latency risk, quality strengths, failure modes, security/license notes, private artifact policy, source-of-truth policy, Track A/Track B/Supabase/Worker/Provider handoffs, QA requirements, fixture status, beta blockers, production blockers, and next action.

## Explicitly Not Owned

- D3.js charts or diagrams
- Three.js creative graphics
- AI_TOOLS_CREATIVE_GRAPHICS implementation
- TRACK_A_RENDER_EXPORT final composition/export
- TRACK_B_MEDIA_PROCESSING
- WORKER_RUNTIME_JOBS execution
- PROVIDER_GATEWAY_MODELS execution
- SUPABASE_RLS_STORAGE_DATABASE schema/RLS/migrations
- public artifact delivery
- signed URL delivery
- production or external beta unlock

## Routing Policy Requirements

- Use Turf for GeoJSON math, bounds, distances, simplification, interpolation, buffers, and route geometry prep only.
- Use MapLibre for 2D map style, camera, pin, route, label, and layer planning only.
- Use deck.gl only for future advanced geospatial overlays such as arcs, heatmaps, point clouds, and dense data layers.
- Use CesiumJS only for future approved 3D globe/world-scale scenes.
- Avoid maps when geography does not improve the edit, location confidence is too low for exact pins, or a card/diagram/text summary is clearer.
- Request AI_TOOLS_CREATIVE_GRAPHICS only for illustrative or stylized non-authoritative map graphics.
- Hand off to Track A only after approved GeoJSON/style/camera/timing/render manifests exist.
- Treat map screenshots/previews as review artifacts only.
- Treat GeoJSON, style, camera, timing, and render manifests as source-of-truth.
- Block public OSM tile hotlinking, live geocoding, live routing, paid map providers, Cesium ion, live terrain/imagery, and 3D Tiles until a later explicit phase approves them.

## Blocked Scope

- live tiles
- public OSM tile hotlinking
- live geocoding
- live routing
- paid map providers
- Cesium ion
- live terrain or imagery
- 3D Tiles unless future-approved
- map rendering
- tool execution
- worker execution
- route execution
- provider/model calls
- media processing
- browser capture
- web search execution
- Supabase mutation
- SQL/migrations/schema/RLS changes
- Google Cloud API calls
- Secret Manager API calls
- GCS upload/storage transfer
- public artifacts
- signed URLs as source-of-truth
- raw prompt execution
- production/external beta/paid production/broad media unlock

## Diagnostics

Add a Node-built-in diagnostics script that verifies expected docs exist, all owned tool IDs are mentioned, the exact no-scope statement is present, Supabase sync is recorded as `blocked_current_branch_missing_sync_layer`, and changed docs do not claim execution or unlock status.

## Validation

Run the local diagnostics, lint, server typecheck, builds, `git diff --check`, changed-file safety scan, staged safety scan, and `git diff --cached --check`. Do not mutate dependencies or `package-lock.json`.

## Final Response Format

Include branch, PR link, draft status, commit hash, files changed, source-of-truth read status, tools studied, capability map, tool combination map, routing policy, handoff contract, internal beta gap map, blocked-use register, diagnostics status, readiness decision, blockers, Supabase classification, cross-chat impact, handoff needed, duplicate risk, evidence docs, next Supabase action, Supabase milestone sync, exact no-scope statement, and recommended next prompt.
