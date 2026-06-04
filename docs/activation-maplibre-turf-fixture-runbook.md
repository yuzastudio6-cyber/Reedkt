# Phase 50B MapLibre + Turf Fixture Runbook

Phase 50B validates only generated/local geospatial fixture contracts.

It installs `@turf/turf`, generates deterministic synthetic GeoJSON for "ReeditPro generated planning city", runs Turf calculations against that generated data, builds a MapLibre-compatible JSON manifest, and uploads private JSON/GeoJSON artifacts to staging GCS only when explicitly executed.

## Static Checks

```sh
npm run smoke:activation-maplibre-turf-fixture
npm run activation:maplibre-turf-fixture:report
npm run activation:maplibre-turf-fixture:iam-plan
```

## Execution

Execution is allowed only with the staging confirmation environment:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_MAPLIBRE_TURF_GENERATED_FIXTURE=true \
npm run activation:maplibre-turf-fixture -- --execute
```

## Blocked In Phase 50B

- MapLibre browser rendering
- Map tile downloads or public OSM tile use
- Live geocoding or routing APIs
- Mapbox, Google Maps, Cesium ion, or paid map providers
- Playwright, screenshots, or rendered map capture
- Docker, Cloud Run, deployment, or broad GCP mutation
- Public artifacts, signed URLs as source of truth, production, external beta, paid production, and broad media

## Phase 50C Handoff

Phase 50C may start only as a MapLibre local render + capture fixture after Phase 50B generated GeoJSON, Turf calculations, MapLibre manifest validation, private artifacts, and blocked-feature QA pass.
