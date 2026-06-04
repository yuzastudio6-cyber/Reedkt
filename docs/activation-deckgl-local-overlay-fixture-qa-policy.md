# Phase 50D Deck.gl Local Overlay Fixture QA Policy

Mandatory QA gates:

- `phase50c_evidence`: canonical Phase 50C local/offline MapLibre render evidence exists.
- `generated_overlay_data_integrity`: generated deck.gl data is bounded, synthetic, and not real-world verified.
- `local_style_integrity`: MapLibre style has local generated GeoJSON sources only and no remote tile/glyph/sprite/image/provider URL.
- `deckgl_overlay_render`: deck.gl renders Scatterplot, Path, Polygon, and Arc layers through the local overlay.
- `maplibre_base_render`: MapLibre base render remains local/offline and reports source/layer metadata.
- `network_guard`: no external requests, live tiles, public OSM, Mapbox, Google, Cesium ion, geocoding, or routing.
- `playwright_capture`: a 1280x720 screenshot is captured from the local fixture only.
- `optional_screenshot_processing`: Sharp preview, thumbnail, and metadata are created from the Phase 50D screenshot.
- `artifact_privacy`: artifacts are private GCS objects and no signed URL is source of truth.
- `blocked_features`: production, beta, broad media, live tiles, geocoding/routing, paid providers, CesiumJS, D3, and Three.js remain blocked.

Phase50E readiness becomes `ready_for_cesiumjs_3d_planning_fixture` only when every mandatory gate passes.
