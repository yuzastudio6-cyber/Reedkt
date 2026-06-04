# Phase 50E CesiumJS Local 3D Fixture QA Policy

Mandatory QA gates:

- `phase50d_evidence`: canonical Phase 50D deck.gl local overlay evidence exists.
- `generated_3d_data_integrity`: generated 3D data is bounded, synthetic, and excludes user location, geocoding, routing, and real-world verification.
- `cesium_local_scene`: Cesium scene has no ion token, live imagery, live terrain, 3D Tiles, geocoder, or remote URL dependency.
- `cesium_render`: Cesium renders generated point, route, polygon, and vertical marker entities and reports matching metadata.
- `network_guard`: no external requests, Cesium ion, live terrain/imagery, 3D Tiles, tiles, public OSM, Mapbox, Google, geocoding, or routing.
- `playwright_capture`: a 1280x720 screenshot is captured from the local fixture only.
- `optional_screenshot_processing`: Sharp preview, thumbnail, and metadata are created from the Phase 50E screenshot.
- `artifact_privacy`: artifacts are private GCS objects and no signed URL is source of truth.
- `blocked_features`: production, beta, broad media, live tiles, geocoding/routing, paid providers, deck.gl, D3, and Three.js remain blocked.

Phase50F readiness becomes `ready_for_web_search_map_planning_private_e2e` only when every mandatory gate passes.
