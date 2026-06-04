# Phase 50B MapLibre + Turf Artifact Policy

Phase 50B writes only private staging artifacts under:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-map-geospatial/phase50b/<runId>/`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-map-geospatial/phase50b/<runId>/`

Expected generated-assets outputs:

- `plan/maplibre-turf-fixture-plan.json`
- `geojson/generated-points.geojson`
- `geojson/generated-routes.geojson`
- `geojson/generated-polygons.geojson`
- `geojson/generated-combined.geojson`
- `turf/turf-calculations.json`
- `maplibre/maplibre-style-manifest.json`
- `manifest/map-planning-manifest.json`

Expected QA outputs:

- `qa/maplibre-turf-fixture-qa.json`
- `reports/phase50b-report.json`

Generated local reports stay under ignored `activation-logs/`. Generated JSON/GeoJSON artifacts, rendered maps, screenshots, public URLs, signed URLs, credentials, and large binaries must not be committed.
