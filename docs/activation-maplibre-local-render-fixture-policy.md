# Phase 50C MapLibre Local Render Fixture Policy

Phase 50C is restricted to `maplibre_local_offline_render_capture_fixture`.

Allowed only after confirmation:

- generated synthetic GeoJSON from the Phase 50B fixture builder
- local/offline MapLibre style JSON with inline GeoJSON sources
- temporary `127.0.0.1` static serving
- Playwright Chromium capture of the local fixture only
- Sharp processing of the Phase 50C screenshot only
- private GCS artifact upload under `activation-map-geospatial/phase50c/`

The MapLibre style must not include remote `tiles`, `glyphs`, `sprite`, image URLs, symbol/text layers, public OSM tile URLs, Mapbox URLs, Google Maps URLs, Cesium ion URLs, geocoding URLs, routing URLs, or paid-provider URLs.

The browser network guard allows only `127.0.0.1`, `localhost`, `file://`, `data:`, `blob:`, and `about:blank`. Any other request blocks completion.

Phase 50D readiness is limited to a deck.gl overlay fixture. It is not production, external beta, broad media, public tile, routing, or geocoding readiness.
