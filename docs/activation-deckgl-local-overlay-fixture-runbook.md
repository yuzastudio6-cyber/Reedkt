# Phase 50D Deck.gl Local Overlay Fixture Runbook

Phase 50D validates one generated/local/offline deck.gl overlay fixture on top of the Phase 50C MapLibre local render pattern.

Default commands are static and non-mutating:

```sh
npm run activation:deckgl-local-overlay-fixture:report
npm run activation:deckgl-local-overlay-fixture:iam-plan
npm run smoke:activation-deckgl-local-overlay-fixture
```

Execution requires the staging confirmation gate:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_DECKGL_LOCAL_OVERLAY_FIXTURE=true \
npm run activation:deckgl-local-overlay-fixture -- --execute
```

The runner verifies the canonical Phase 50C report at `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-map-geospatial/phase50c/phase50c-20260604T020852/reports/phase50c-report.json`, checks private staging buckets, generates deterministic fixture data in a temp non-repo directory, serves only `127.0.0.1`, captures with Playwright, processes the screenshot with Sharp, uploads private artifacts, and writes a local ignored report.

Do not use live tiles, public OSM tiles, Mapbox/Google/Cesium ion, geocoding, routing, paid providers, CesiumJS runtime, D3 runtime, Three.js runtime, public artifacts, signed URLs, production, external beta, paid production, or broad media in Phase 50D.
