# TOOL-STUDY-0 MAP_GEOSPATIAL Tool Study

Status: `docs_diagnostics_only`

Owner: `MAP_GEOSPATIAL`

Base evidence: TOOL-ROUTE-0 passed with run `toolroute0-20260612T201155`; WORKER-1 passed with run `worker1-20260612T193823`; the current base contains the TOOL-ROUTE-0 owner prompt for MAP_GEOSPATIAL and planning-safe map modules. PR #354 WEB_SEARCH_CAPTURE was open and unmerged at preflight, so this study is based on the #347 integration branch.

## Purpose

MAP_GEOSPATIAL defines how ReEditPro chooses map and geography capabilities before any route or tool execution is separately approved. The contract keeps exact geography, camera movement, route geometry, map style, timing, and render handoffs in structured manifests. It does not perform map rendering, tile fetching, geocoding, routing, terrain loading, browser capture, Supabase writes, GCS upload, or production/beta unlock.

## Source-Of-Truth Reads

| Source | Status |
| --- | --- |
| `README.md` | read |
| `AGENTS.md` | read |
| `docs/runtime-unlock/` | missing_on_base |
| `docs/cross-chat/` | missing_on_base |
| `docs/agents/` | missing_on_base |
| `docs/tool-studies/` | created_by_this_phase |
| `docs/tool-call-foundation.md` | missing_on_base |
| `docs/provider-gateway-foundation.md` | missing_on_base |
| `docs/worker-claim-execution-contract-hardening.md` | missing_on_base |
| `docs/activation-phase-tool-route-0-execution-unlock-audit-results.md` | read |
| `docs/activation-phase-worker-1-approved-plan-snapshot-dry-run-results.md` | read |
| map/geospatial Phase 50 docs | missing_on_base |
| `open-source-tool-registry.md` | read |
| `tool-settings-catalog.md` | read |
| `tool-strategy-planner.md` | read |
| `map-location-animation-planning.md` | read |
| `map-animation-settings-catalog.md` | read |
| `server/tool-registry/production-tool-profiles.ts` | read |
| `src/lib/tool-registry.ts` | read |
| `src/lib/map-animation-planner.ts` | read |
| `server/activation/supabase-milestone-sync` | missing_on_base |

## Owned Capability Records

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

## Readiness Decision

Decision: `ready_for_TOOL_ROUTE_1_route_dry_run_planning_after_owner_review`

This means TOOL-ROUTE-1 can use MAP_GEOSPATIAL as a review-only owner contract for route dry-run planning. It does not approve runtime execution, tile fetching, geocoding, routing, map rendering, worker execution, provider execution, Supabase mutation, GCS upload, public artifacts, signed URLs, internal beta, external beta, or production.

## Supabase Classification

Supabase update required: docs/status only

Supabase update status: `docs_only`

Supabase environment touched: none

SQL executed: none

Migration deployed: no

Next Supabase action: none

Supabase milestone sync: `blocked_current_branch_missing_sync_layer`

## Exact No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
