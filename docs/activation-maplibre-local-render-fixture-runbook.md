# Phase 50C MapLibre Local Render Fixture Runbook

Phase 50C validates a generated/local/offline MapLibre render and capture path only.

## Static checks

```sh
npm run smoke:activation-maplibre-local-render-fixture
npm run activation:maplibre-local-render-fixture:report
npm run activation:maplibre-local-render-fixture:iam-plan
```

## Execution

Execution is allowed only with the staging confirmation gate:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_MAPLIBRE_LOCAL_RENDER_CAPTURE=true \
npm run activation:maplibre-local-render-fixture -- --execute
```

The runner generates Phase 50B-style synthetic GeoJSON, builds an offline MapLibre style, serves a temporary `127.0.0.1` fixture page, copies local `maplibre-gl` JavaScript and CSS from `node_modules`, captures a 1280x720 screenshot with Playwright, processes the screenshot with Sharp, and uploads private artifacts.

## Still blocked

Live tiles, public OSM tiles, remote glyphs/sprites/images, geocoding, routing, Mapbox, Google Maps, Cesium ion, paid map providers, deck.gl runtime, CesiumJS runtime, production, external beta, broad media, public artifacts, and signed URLs as source of truth remain blocked.
