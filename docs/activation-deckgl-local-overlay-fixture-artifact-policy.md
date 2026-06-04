# Phase 50D Deck.gl Local Overlay Fixture Artifact Policy

Phase 50D artifacts are private staging artifacts only.

Generated assets are written under:

`gs://reeditpro-staging-reeditpro-generated-assets/activation-map-geospatial/phase50d/<runId>/`

QA artifacts are written under:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation-map-geospatial/phase50d/<runId>/`

Expected generated assets include the execution plan, local HTML fixture, local asset metadata, generated GeoJSON, deck.gl overlay data, deck.gl layer manifest, offline MapLibre style JSON, render metadata, screenshot PNG, network request log, optional Sharp derivatives, and capture manifest.

Expected QA artifacts include `qa/deckgl-local-overlay-qa.json` and `reports/phase50d-report.json`.

Do not commit generated screenshots, private JSON reports, temp HTML, browser binaries, logs, credentials, secrets, public URLs, signed URLs, or large artifacts.
