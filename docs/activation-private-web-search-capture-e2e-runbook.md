# Phase 49E Controlled Private Web Search/Capture E2E Runbook

Phase 49E validates the free/open-source web search/capture stack in a controlled private fixture flow. It connects a SearXNG-compatible provider contract, normalized source records, Playwright local capture, Sharp screenshot processing, Mozilla Readability extraction, sanitization, and one private E2E manifest.

Default provider mode is `private_fixture_provider`. `REEDITPRO_SEARXNG_PRIVATE_ENDPOINT` may be validated by policy, but public SearXNG instances and paid providers are blocked.

Run static checks:

```sh
npm run smoke:activation-private-web-search-capture-e2e
npm run activation:private-web-search-capture-e2e:report
npm run activation:private-web-search-capture-e2e:iam-plan
```

Execute once only with:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_PRIVATE_WEB_SEARCH_CAPTURE_E2E=true \
npm run activation:private-web-search-capture-e2e -- --execute
```

Live public search, public capture, arbitrary URL capture, paid providers, public artifacts, production, external beta, paid production, broad media, and Revideo remain blocked.
