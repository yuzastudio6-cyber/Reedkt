# Phase 50A Map/Geospatial Approval Runbook

Phase 50A is a static approval and architecture phase for ReeditPro map/geospatial tooling.

Run:

```sh
npm run smoke:activation-map-geospatial-approval-workflow
npm run activation:map-geospatial-approval:plan
npm run activation:map-geospatial-approval:report
npm run activation:map-geospatial-tool:summary
```

No execution confirmation or GCP environment is required for static report mode.

## Approved Planning Stack

- MapLibre GL JS: default browser map renderer planning.
- Turf.js: GeoJSON and geospatial calculations planning.
- deck.gl: advanced overlay/GPU geospatial visualization planning.
- CesiumJS: optional OSS 3D globe/terrain/3D Tiles planning only.
- OpenStreetMap/open map data: preferred open data source with attribution and tile-policy caveats.

## Blocked In Phase 50A

- package installation
- map rendering
- tile download
- live geocoding or routing
- Mapbox, Google Maps, Cesium ion, or paid map providers
- public OSM tile beta/production hotlinking
- arbitrary tile endpoints
- Playwright capture or screenshots
- Docker/GCP mutation
- public artifacts, signed URLs as source of truth, secrets, API keys
- production, external beta, paid production, broad media, providers, and Revideo

## Next Phase

Phase 50B may start only as a generated/local MapLibre + Turf fixture. It must use generated GeoJSON, run Turf calculations only on generated data, build MapLibre-compatible manifest JSON only, and keep live tiles, geocoding, routing, browser capture, paid providers, and public artifacts blocked unless a later prompt explicitly changes scope.
