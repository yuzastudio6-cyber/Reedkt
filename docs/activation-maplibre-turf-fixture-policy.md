# Phase 50B MapLibre + Turf Fixture Policy

Phase 50B scope is `maplibre_turf_generated_local_fixture`.

Allowed:

- Generate synthetic GeoJSON fixture data.
- Run Turf calculations locally on generated data.
- Build a MapLibre-compatible style/source/layer manifest JSON.
- Upload private JSON/GeoJSON artifacts to the approved staging prefixes.

Required execution environment:

- `GCP_PROJECT_ID=reeditpro`
- `GCP_REGION=us-central1`
- `REEDITPRO_ENV=staging`
- `REEDITPRO_CONFIRM_MAPLIBRE_TURF_GENERATED_FIXTURE=true`

Safety defaults:

- `mapLibreBrowserRuntimeAllowed=false`
- `mapRenderingAllowed=false`
- `tileDownloadAllowed=false`
- `liveTileProviderAllowed=false`
- `geocodingAllowed=false`
- `routingAllowed=false`
- `paidMapProviderAllowed=false`
- `publicArtifactAllowed=false`
- `productionReadyAllowed=false`
- `externalBetaAllowed=false`
- `broadMediaAllowed=false`

`maplibre-gl` remains uninstalled. Browser rendering is deferred to Phase 50C.
