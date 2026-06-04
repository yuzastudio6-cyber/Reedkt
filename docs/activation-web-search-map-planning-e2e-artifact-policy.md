# Phase 50F Artifact Policy

Phase 50F artifacts are private only.

Generated assets are written under:

`gs://reeditpro-staging-reeditpro-generated-assets/activation-map-geospatial/phase50f/<runId>/`

QA artifacts are written under:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation-map-geospatial/phase50f/<runId>/`

Expected generated assets include plan JSON, planning source records, location candidates, GeoJSON, Turf calculations, MapLibre style JSON, deck.gl overlay data, Cesium scene config, render metadata, local screenshot captures, network request logs, optional Sharp derivatives, and the combined manifest.

Do not commit generated screenshots, private JSON reports, temp HTML, browser artifacts, secrets, public URLs, signed URLs, or large binaries.
