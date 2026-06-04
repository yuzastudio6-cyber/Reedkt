# Phase 50E CesiumJS Local 3D Fixture Artifact Policy

Phase 50E artifacts are private staging artifacts only.

Generated assets are written under:

`gs://reeditpro-staging-reeditpro-generated-assets/activation-map-geospatial/phase50e/<runId>/`

QA artifacts are written under:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation-map-geospatial/phase50e/<runId>/`

Expected generated assets include the execution plan, local HTML fixture, local Cesium asset metadata, generated GeoJSON, Cesium entity data, Cesium scene config, render metadata, screenshot PNG, network request log, Sharp derivatives, image metadata, and capture manifest.

Expected QA artifacts include `qa/cesiumjs-local-3d-qa.json` and `reports/phase50e-report.json`.

Do not commit generated screenshots, private JSON reports, temp HTML, browser binaries, logs, credentials, secrets, Cesium ion tokens, public URLs, signed URLs, or large artifacts.
