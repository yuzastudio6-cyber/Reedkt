# Phase 49L Brave Live API Validation Runbook

Phase 49L validates Brave Search as an optional paid fallback/confidence
provider with one controlled web-search API call. SearXNG remains the default
free/open-source provider.

## Static Checks

Run these without provider execution:

```sh
npm run smoke:activation-brave-live-api-validation
npm run activation:brave-live-api-validation:report
npm run activation:brave-live-api-validation:iam-plan
```

Static report mode must not resolve or print the Brave key, call Brave, run live
search, launch browsers, run extraction, mutate GCP, or upload artifacts.

## Execution

Execution requires explicit staging env and budget gates:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_BRAVE_LIVE_API_VALIDATION=true \
BRAVE_SEARCH_ENABLED=true \
BRAVE_SEARCH_DAILY_LIMIT=1 \
BRAVE_SEARCH_MONTHLY_BUDGET_USD=1 \
BRAVE_SEARCH_MAX_RESULTS=5 \
BRAVE_SEARCH_MAX_QUERIES_PER_RUN=1 \
BRAVE_SEARCH_STORE_RAW_RESULTS=false \
BRAVE_SEARCH_STORE_SNIPPETS=false \
npm run activation:brave-live-api-validation -- --execute
```

The runner resolves `BRAVE_SEARCH_API_KEY` from backend env first, otherwise
from Google Secret Manager in project `reeditpro`. The value must never be
printed, logged, committed, exposed to frontend code, or written to artifacts.

## Outputs

Private JSON artifacts are written only under:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49l/<runId>/`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49l/<runId>/`

Raw Brave responses, snippets, request headers, API key material, screenshots,
captured pages, extracted content, signed URLs, and public artifacts are not
allowed.

## Blocked Scope

Phase 49L does not run browser capture, Sharp, Readability, crawling, arbitrary
URL capture, other paid providers, Docker, Cloud Run deploys, production,
external beta, paid production, or broad media.
