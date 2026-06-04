# Phase 50D Deck.gl Local Overlay Fixture Policy

Phase 50D allows deck.gl runtime only inside a generated local/offline fixture.

Allowed when confirmed:

- Generated Phase 50B-style GeoJSON.
- Deterministic overlay records for points, paths, polygons, and arcs.
- Local MapLibre style with generated GeoJSON sources only.
- Local `maplibre-gl` and deck.gl browser bundles copied from `node_modules`.
- Playwright capture against `127.0.0.1` only.
- Sharp processing only for the screenshot created in this phase.
- Private GCS artifact upload under `activation-map-geospatial/phase50d/<runId>/`.

Blocked:

- Live tiles, public OSM tiles, tile downloads, remote glyphs, sprites, or images.
- Mapbox, Google Maps, Cesium ion, geocoding, routing, paid map providers.
- CesiumJS, D3, Three.js runtime.
- Public artifacts, signed URLs as source of truth, production, external beta, paid production, and broad media.

Deck.gl package additions are limited to `@deck.gl/core`, `@deck.gl/layers`, and `@deck.gl/mapbox`. The `@deck.gl/mapbox` package is used only for the local `MapboxOverlay` integration class; it does not enable Mapbox provider access.
