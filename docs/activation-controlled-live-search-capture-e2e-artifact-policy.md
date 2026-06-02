# Phase 49G Controlled Private Live Search/Capture E2E Artifact Policy

Phase 49G artifacts are private staging artifacts only.

Generated assets prefix:

`gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49g/<runId>/`

QA artifacts prefix:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49g/<runId>/`

Expected generated assets include the approved plan snapshot, private SearXNG query responses, normalized source records, source manifest, captured screenshots and metadata for at most two allowlisted pages, sanitized extraction artifacts, and the combined E2E manifest.

Expected QA artifacts include `qa/controlled-live-search-capture-e2e-qa.json` and `reports/phase49g-report.json`.

Do not commit generated screenshots, captured HTML, extracted text, private reports, logs, browser artifacts, credentials, secrets, public URLs, signed URLs, or large binaries. Public access must remain disabled.
