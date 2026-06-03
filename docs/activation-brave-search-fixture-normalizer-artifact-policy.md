# Brave Search Fixture Normalizer Artifact Policy

Phase 49K may write private JSON artifacts only.

## Private Prefixes

Generated assets:

`gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49k/<runId>/`

QA artifacts:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49k/<runId>/`

Expected objects:

- `plan/brave-fixture-normalizer-plan.json`
- `fixture/brave-shaped-fixture-response.json`
- `normalized/brave-normalized-sources.json`
- `confidence/searxng-confidence-scenarios.json`
- `router/provider-router-decisions.json`
- `dedupe/searxng-brave-dedupe-fixture.json`
- `sources/brave-fixture-source-manifest.json`
- `qa/brave-search-fixture-normalizer-qa.json`
- `reports/phase49k-report.json`

## Prohibited Artifacts

Do not commit or upload real Brave API responses, API keys, screenshots,
captured pages, extracted article text, provider logs, signed URLs, public URLs,
or large binaries. Local execution reports stay under ignored
`activation-logs/`.

IAM plans are report-only unless upload permission is missing. Any future grant
must be conditional `roles/storage.objectCreator` scoped to the Phase 49K
prefixes only.
