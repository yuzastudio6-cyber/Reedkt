# Phase 49B SearXNG Search Fixture Runbook

Phase 49B validates the ReeditPro search-provider contract with a deterministic generated SearXNG-style fixture only.

## Scope

- Provider abstraction: `searxng`.
- Query: `ReeditPro open source video editing toolchain documentation`.
- Output: private JSON plan, fixture response, normalized sources, source manifest, metadata, QA, and report artifacts.
- Storage prefixes: `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49b/<runId>/` and `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49b/<runId>/`.

## Commands

Static report:

```sh
npm run activation:searxng-search-fixture:report
```

IAM plan:

```sh
npm run activation:searxng-search-fixture:iam-plan
```

Generated fixture execution:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_SEARXNG_SEARCH_FIXTURE=true \
npm run activation:searxng-search-fixture -- --execute
```

## Blocked

Live web search, SearXNG public/private endpoint calls, crawling, scraping, Playwright, screenshots, Sharp processing, Readability extraction, paid providers, secrets, public artifacts, Docker, Cloud Run, production, external beta, paid production, broad media, and Revideo remain blocked.

## Next Gate

Phase 49C may only validate Playwright + Sharp against generated/local capture fixtures. Public web capture remains blocked until later controlled phases.
