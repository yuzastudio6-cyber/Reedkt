# Phase 50D Deck.gl Local Overlay Fixture Results

Status: completed.

Run ID: `phase50d-20260604T030406`

Phase 50D validates a generated/local/offline deck.gl overlay fixture on top of the Phase 50C MapLibre local render pattern.

Canonical prerequisite:

- Phase 50C run: `phase50c-20260604T020852`
- Report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-map-geospatial/phase50c/phase50c-20260604T020852/reports/phase50c-report.json`

Allowed runtime scope:

- Local generated GeoJSON and deterministic flow records.
- Local `maplibre-gl` and deck.gl bundles served from `127.0.0.1`.
- deck.gl `ScatterplotLayer`, `PathLayer`, `PolygonLayer`, and `ArcLayer`.
- Playwright capture of the local fixture only.
- Sharp preview/thumbnail/metadata from the Phase 50D screenshot only.

Blocked:

- Live tiles, public OSM tiles, remote glyph/sprite/image URLs, Mapbox provider, Google Maps, Cesium ion, geocoding, routing, paid providers, CesiumJS runtime, D3 runtime, Three.js runtime, public artifacts, signed URLs as source of truth, production, external beta, paid production, and broad media.

Package-lock status:

- Expected to change because Phase 50D installs only `@deck.gl/core`, `@deck.gl/layers`, and `@deck.gl/mapbox` for the generated/local overlay fixture.

Validation:

- `smoke:activation-deckgl-local-overlay-fixture`: passed.
- `activation:deckgl-local-overlay-fixture:report`: passed and reports `phase50d-20260604T030406`.
- `activation:deckgl-local-overlay-fixture:iam-plan`: passed; IAM remains report-only.
- `lint`: passed.
- `build`: passed through standalone Node 24 after the known local Rolldown/native-binding signing issue appeared in the Codex app runtime.
- `build:server`: passed through standalone Node 24 after the same environment workaround.

Execution summary:

- Generated overlay data: 6 points, 2 paths, 2 polygons, and 3 generated arc/flow records.
- deck.gl layers: `ScatterplotLayer`, `PathLayer`, `PolygonLayer`, and `ArcLayer`.
- MapLibre base: 3 local GeoJSON sources and 5 local style layers.
- Screenshot: 1280x720 local Playwright capture.
- Network guard: 0 external requests observed in the canonical passing run.
- Sharp processing: preview, thumbnail, and image metadata created from the Phase 50D screenshot.
- QA gates: all mandatory gates passed.

Private artifacts:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-map-geospatial/phase50d/phase50d-20260604T030406/plan/deckgl-local-overlay-plan.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-map-geospatial/phase50d/phase50d-20260604T030406/fixture/generated-deckgl-map-page.html`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-map-geospatial/phase50d/phase50d-20260604T030406/fixture/deckgl-local-assets-metadata.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-map-geospatial/phase50d/phase50d-20260604T030406/geojson/generated-points.geojson`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-map-geospatial/phase50d/phase50d-20260604T030406/geojson/generated-routes.geojson`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-map-geospatial/phase50d/phase50d-20260604T030406/geojson/generated-polygons.geojson`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-map-geospatial/phase50d/phase50d-20260604T030406/geojson/generated-combined.geojson`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-map-geospatial/phase50d/phase50d-20260604T030406/deckgl/deckgl-overlay-data.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-map-geospatial/phase50d/phase50d-20260604T030406/deckgl/deckgl-layer-manifest.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-map-geospatial/phase50d/phase50d-20260604T030406/maplibre/local-offline-style.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-map-geospatial/phase50d/phase50d-20260604T030406/render/deckgl-render-metadata.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-map-geospatial/phase50d/phase50d-20260604T030406/capture/deckgl-local-overlay-screenshot.png`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-map-geospatial/phase50d/phase50d-20260604T030406/capture/network-requests-observed.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-map-geospatial/phase50d/phase50d-20260604T030406/processed/deckgl-overlay-preview.png`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-map-geospatial/phase50d/phase50d-20260604T030406/processed/deckgl-overlay-thumbnail.png`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-map-geospatial/phase50d/phase50d-20260604T030406/processed/deckgl-overlay-image-metadata.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-map-geospatial/phase50d/phase50d-20260604T030406/manifest/deckgl-local-overlay-capture-manifest.json`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-map-geospatial/phase50d/phase50d-20260604T030406/qa/deckgl-local-overlay-qa.json`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-map-geospatial/phase50d/phase50d-20260604T030406/reports/phase50d-report.json`

Phase50E readiness:

- `ready_for_cesiumjs_3d_planning_fixture`

Phase50E handoff:

- Phase 50E is limited to generated/local/offline CesiumJS 3D planning fixture validation.
- Cesium ion, ion tokens, live terrain, live imagery, 3D Tiles, live tiles, public OSM tiles, Mapbox, Google Maps, geocoding/routing, paid providers, deck.gl runtime in Phase 50E, D3, Three.js, production, external beta, paid production, and broad media remain blocked.
