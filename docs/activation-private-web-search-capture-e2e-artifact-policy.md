# Phase 49E Controlled Private Web Search/Capture E2E Artifact Policy

Phase 49E artifacts are private and source-of-truth paths remain GCS object URIs.

Generated assets prefix:

`gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49e/<runId>/`

QA prefix:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49e/<runId>/`

Expected artifacts include the approved plan snapshot, private search response, normalized results, source manifest, three fixture HTML pages, original/preview/thumbnail screenshots, capture metadata, sanitized extraction JSON, extracted text, extraction metadata, combined E2E manifest, QA JSON, and Phase 49E report.

Do not commit generated HTML pages, screenshots, extracted text, private JSON reports, logs, credentials, browser artifacts, public URLs, signed URLs, or large binaries.
