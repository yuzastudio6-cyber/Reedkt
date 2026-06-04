# Phase 50F Web Search + Map Planning Private E2E Runbook

Phase 50F connects approved web-search evidence to generated/local map planning fixtures only.

Default commands are static and non-mutating:

```sh
npm run activation:web-search-map-planning-e2e
npm run activation:web-search-map-planning-e2e:report
npm run activation:web-search-map-planning-e2e:iam-plan
```

Execution requires:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_WEB_SEARCH_MAP_PLANNING_E2E=true \
npm run activation:web-search-map-planning-e2e -- --execute
```

Execution may only generate planning source records, generated-only location candidates, GeoJSON, Turf calculations, local/offline MapLibre + deck.gl and CesiumJS renders, Playwright screenshots, Sharp derivatives from those screenshots, and private GCS artifacts.

Blocked throughout: live search, public SearXNG, broad crawling, arbitrary URL capture, live geocoding/routing, tile downloads, public OSM tiles, Mapbox, Google Maps, Cesium ion, live terrain, live imagery, 3D Tiles, paid map providers, public artifacts, signed URLs as source of truth, production, external beta, paid production, and broad media.
