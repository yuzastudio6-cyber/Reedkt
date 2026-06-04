# Phase 50G Map/Geospatial Readiness Runbook

Phase 50G is an evidence-only readiness gate for controlled internal map/geospatial testing.

Default commands are static/report-only:

- `npm run smoke:activation-map-geospatial-readiness`
- `npm run activation:map-geospatial-readiness:report`
- `npm run activation:map-geospatial-readiness:iam-plan`

Execution requires:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_MAP_GEOSPATIAL_INTERNAL_READINESS=true \
npm run activation:map-geospatial-readiness -- --execute
```

Execution verifies canonical private GCS evidence and uploads private JSON readiness artifacts only. It must not render maps, launch Playwright, capture screenshots, request tiles, call geocoding/routing, use paid map providers, deploy Cloud Run, build Docker images, or unlock production/beta.
