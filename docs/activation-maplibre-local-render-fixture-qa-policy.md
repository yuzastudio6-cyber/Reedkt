# Phase 50C MapLibre Local Render QA Policy

Mandatory gates:

- `phase50b_evidence`: canonical Phase 50B evidence exists or deterministic equivalent is documented.
- `generated_geojson_integrity`: generated FeatureCollections are bounded synthetic fixture data.
- `local_style_integrity`: MapLibre style uses local GeoJSON sources and no remote tile/glyph/sprite/image/provider URLs.
- `maplibre_local_render`: MapLibre reports the ready marker and source/layer metadata.
- `network_guard`: no external requests, public OSM tiles, Mapbox, Google, Cesium ion, geocoding, or routing requests.
- `playwright_capture`: a 1280x720 local fixture screenshot exists.
- `optional_screenshot_processing`: Sharp preview, thumbnail, and metadata exist.
- `artifact_privacy`: private GCS only, with no public or signed URL source of truth.
- `blocked_features`: live tiles, geocoding, routing, paid providers, deck.gl, CesiumJS, production, beta, and broad media remain blocked.

Any mandatory gate failure keeps Phase 50D blocked.
