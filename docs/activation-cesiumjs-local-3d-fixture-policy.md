# Phase 50E CesiumJS Local 3D Fixture Policy

Phase 50E allows CesiumJS runtime only inside a generated local/offline 3D planning fixture.

Allowed when confirmed:

- Generated Phase 50B-style GeoJSON transformed into deterministic 3D entity records.
- Local Cesium runtime assets copied from `node_modules/cesium/Build/Cesium`.
- A Cesium `Viewer` scene with generated points, polylines, polygons, and cylinder markers only.
- `baseLayer=false`, `EllipsoidTerrainProvider`, no imagery providers, no terrain providers, no 3D Tiles, no geocoder, and no Cesium ion token.
- Playwright capture against `127.0.0.1` only.
- Sharp processing only for the screenshot created in this phase.
- Private GCS artifact upload under `activation-map-geospatial/phase50e/<runId>/`.

Blocked:

- Cesium ion, ion access tokens, live terrain, live imagery, 3D Tiles, live tiles, public OSM tiles, tile downloads, Mapbox, Google Maps, geocoding, routing, and paid map providers.
- deck.gl runtime in this phase, D3 runtime, and Three.js runtime.
- Public artifacts, signed URLs as source of truth, production, external beta, paid production, and broad media.

The only dependency addition is `cesium`; Playwright and Sharp are reused from earlier generated/local fixture phases.
