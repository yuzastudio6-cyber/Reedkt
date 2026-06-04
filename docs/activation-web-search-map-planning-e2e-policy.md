# Phase 50F Web Search + Map Planning Policy

Phase 50F mode is `web_search_map_planning_private_e2e`.

Allowed:

- Phase 49P evidence references as source context.
- Generated planning source records.
- Generated-only location candidates.
- Turf calculations on generated GeoJSON.
- Local/offline MapLibre render.
- Local/offline deck.gl overlays.
- Local/offline CesiumJS 3D planning scene.
- Playwright capture of local fixtures only.
- Sharp screenshot derivatives from Phase 50F captures only.
- Private GCS JSON, GeoJSON, HTML, and PNG artifacts.

Blocked:

- Live search, public SearXNG, broad crawling, arbitrary URL capture.
- Live geocoding, live routing, tile downloads, public OSM tile use.
- Mapbox, Google Maps, Cesium ion, live terrain, live imagery, 3D Tiles, paid map providers.
- D3 and Three.js runtime ownership changes.
- Public artifacts, signed URLs as source of truth, production, external beta, paid production, broad media.

Sharp/libvips remains Track B-owned; Phase 50F only uses existing Sharp runtime for screenshot derivative evidence.
