# Phase 50C MapLibre Local Render Artifact Policy

Private generated assets are uploaded under:

`gs://reeditpro-staging-reeditpro-generated-assets/activation-map-geospatial/phase50c/<runId>/`

Private QA artifacts are uploaded under:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation-map-geospatial/phase50c/<runId>/`

Expected generated assets include the execution plan, local HTML fixture, local MapLibre asset metadata, generated GeoJSON, offline style JSON, render metadata, screenshot PNG, network request log, Sharp preview/thumbnail/metadata, and capture manifest.

Expected QA outputs include `qa/maplibre-local-render-qa.json` and `reports/phase50c-report.json`.

Do not commit generated screenshots, temp HTML, private JSON reports, browser binaries, credentials, logs, public URLs, signed URLs, or large artifacts.
