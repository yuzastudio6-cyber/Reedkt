# Phase 50E CesiumJS Local 3D Fixture Runbook

Phase 50E validates one generated/local/offline CesiumJS 3D planning fixture.

Default commands are static and non-mutating:

```sh
npm run activation:cesiumjs-local-3d-fixture:report
npm run activation:cesiumjs-local-3d-fixture:iam-plan
npm run smoke:activation-cesiumjs-local-3d-fixture
```

Execution requires the staging confirmation gate:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_CESIUMJS_LOCAL_3D_FIXTURE=true \
npm run activation:cesiumjs-local-3d-fixture -- --execute
```

The runner verifies the canonical Phase 50D report at `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-map-geospatial/phase50d/phase50d-20260604T030406/reports/phase50d-report.json`, checks private staging buckets, generates deterministic 3D fixture data in a temp non-repo directory, serves only `127.0.0.1`, captures with Playwright, processes the screenshot with Sharp, uploads private artifacts, and writes a local ignored report.

Do not use Cesium ion, ion tokens, live terrain, live imagery, 3D Tiles, live tiles, public OSM tiles, Mapbox/Google, geocoding, routing, paid providers, deck.gl runtime, D3 runtime, Three.js runtime, public artifacts, signed URLs, production, external beta, paid production, or broad media in Phase 50E.
