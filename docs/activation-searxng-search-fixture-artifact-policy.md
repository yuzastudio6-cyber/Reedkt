# Phase 49B SearXNG Search Fixture Artifact Policy

Phase 49B artifacts are private JSON only.

## Generated Assets

- `plan/approved-search-plan-snapshot.json`
- `fixture/searxng-generated-fixture-response.json`
- `normalized/normalized-search-results.json`
- `sources/source-manifest.json`
- `metadata/searxng-fixture-metadata.json`

Prefix:

```text
gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49b/<runId>/
```

## QA Artifacts

- `qa/searxng-search-fixture-qa.json`
- `reports/phase49b-report.json`

Prefix:

```text
gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49b/<runId>/
```

## Commit Policy

Do not commit private JSON reports, generated fixture artifacts from GCS, screenshots, captures, logs, credentials, secrets, or large binaries.
