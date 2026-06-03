# Phase 49L Brave Live API Validation Artifact Policy

Phase 49L artifacts are private JSON only. They document the plan, normalized
minimal source records, source manifest, metadata, QA, and report.

## Generated Assets

`gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49l/<runId>/`

- `plan/brave-live-api-validation-plan.json`
- `normalized/brave-live-normalized-sources.json`
- `sources/brave-live-source-manifest.json`
- `metadata/brave-live-validation-metadata.json`

## QA Artifacts

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49l/<runId>/`

- `qa/brave-live-api-validation-qa.json`
- `reports/phase49l-report.json`

## Forbidden Artifacts

The runner must not store raw Brave API JSON, snippets, request headers, API key
values, token prefixes/suffixes/hashes, screenshots, browser captures,
Readability output, public URLs, signed URLs as source of truth, logs, or large
binaries.

IAM changes, if required, must be secret-level or prefix-scoped only. Broad
bucket permissions, project-level secret access, `allUsers`, and
`allAuthenticatedUsers` remain blocked.
