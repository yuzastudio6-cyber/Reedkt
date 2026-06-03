# Phase 49O Web Search Regression Suite Runbook

Phase 49O validates the web search/capture stack with deterministic regression and failure-mode scenarios. It does not run live search, Brave API calls, public SearXNG, browser capture, Sharp processing, Readability extraction, Docker, Cloud Run deploys, or production/beta unlocks.

## Static Review

```sh
npm run smoke:activation-web-search-regression-suite
npm run activation:web-search-regression-suite:report
npm run activation:web-search-regression-suite:iam-plan
```

Static mode builds the scenario matrix and command/IAM plans only.

## Execution

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_WEB_SEARCH_REGRESSION_FAILURE_SUITE=true \
npm run activation:web-search-regression-suite -- --execute
```

Execution verifies canonical Phase 49N private GCS evidence, runs the deterministic local scenario matrix, uploads private JSON artifacts, and writes an ignored local execution report under `activation-logs/`.

## Safety

No secret values are read, printed, stored, or committed. Raw Brave responses, Brave snippets, screenshots, extracted page content, public URLs, signed URLs as source of truth, public artifacts, production, external beta, paid production, and broad media remain blocked.
