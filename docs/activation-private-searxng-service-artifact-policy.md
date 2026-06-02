# Phase 49F Private SearXNG Artifact Policy

Phase 49F artifacts are private JSON only under:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49f/<runId>/`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49f/<runId>/`

Expected generated-assets artifacts include service plan, service validation, query response, normalized results, source manifest, and runtime metadata.

Expected QA artifacts include private SearXNG service QA JSON and the Phase 49F report JSON.

Do not commit private reports, runtime logs, generated query artifacts, secrets, service URLs, public/signed URLs, screenshots, browser artifacts, or large binaries.
